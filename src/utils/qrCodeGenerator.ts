
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';

export const generateQRCodeSVG = (text: string): string => {
  // Simple SVG QR code generation for illustrator
  // This is a simplified version - in a real app, we'd use a proper QR library
  const size = 100;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="white" />
      <text x="50%" y="50%" font-family="Arial" font-size="10" text-anchor="middle" dominant-baseline="middle">
        QR: ${text}
      </text>
    </svg>
  `;
  
  return svg;
};

export const generateIllustratorFile = (data: ExcelRow[]): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder("qr_codes");
  
  if (!folder) throw new Error("Failed to create zip folder");
  
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    if (qrText) {
      const svg = generateQRCodeSVG(qrText);
      folder.file(`QR_${serial}.svg`, svg);
    }
  });
  
  return zip.generateAsync({ type: "blob" });
};

export const downloadIllustratorFiles = async (data: ExcelRow[]): Promise<void> => {
  try {
    const blob = await generateIllustratorFile(data);
    saveAs(blob, "qr_codes_for_illustrator.zip");
  } catch (error) {
    console.error("Failed to generate Illustrator files:", error);
    throw error;
  }
};
