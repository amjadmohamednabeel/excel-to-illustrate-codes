
import * as XLSX from 'xlsx';

export type ExcelRow = {
  count?: number;
  serialNumber?: string;
  qrCodeText?: string;
  // Barcode specific fields
  no?: number | string;
  description?: string;
  gtin?: string;
  [key: string]: any;
};

export const parseExcelFile = (file: File): Promise<ExcelRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(new Error('Failed to parse Excel file. Please check the format.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading the file. Please try again.'));
    };
    
    reader.readAsBinaryString(file);
  });
};

export const validateExcelData = (data: ExcelRow[], type: 'qr' | 'barcode' = 'qr'): { valid: boolean; message: string } => {
  if (data.length === 0) {
    return { valid: false, message: 'The Excel file is empty.' };
  }
  
  const firstRow = data[0];
  let requiredColumns: string[] = [];
  
  if (type === 'qr') {
    requiredColumns = ['Count', 'Unit Serial Number', 'QR Code Text'];
  } else if (type === 'barcode') {
    requiredColumns = ['No.', 'Description', 'GTIN'];
  }
  
  for (const column of requiredColumns) {
    if (!(column in firstRow) && !(column.toLowerCase().replace(/[.\s]/g, '') in firstRow)) {
      return { 
        valid: false, 
        message: `Missing required column: ${column}. Please ensure your Excel file has the correct headers.` 
      };
    }
  }
  
  return { valid: true, message: 'Data is valid.' };
};
