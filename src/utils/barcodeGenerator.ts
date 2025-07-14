import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { ExcelRow } from './excelParser';

export interface BarcodeOptions {
  boxWidth: number; // in mm
  boxHeight: number; // in mm
  barcodeWidth: number; // in mm
  barcodeHeight: number; // in mm
  fontSize: number; // in pt
  pageSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin: number; // in mm
}

export const defaultBarcodeOptions: BarcodeOptions = {
  boxWidth: 50,
  boxHeight: 25,
  barcodeWidth: 36.6,
  barcodeHeight: 10.6,
  fontSize: 6.667,
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 10
};

const getPageDimensions = (pageSize: string, orientation: 'portrait' | 'landscape') => {
  const sizes = {
    A4: { width: 210, height: 297 },
    A3: { width: 297, height: 420 },
    Letter: { width: 216, height: 279 }
  };
  
  const size = sizes[pageSize as keyof typeof sizes] || sizes.A4;
  return orientation === 'landscape' 
    ? { width: size.height, height: size.width }
    : size;
};

export const generateBarcodeDataURI = (gtin: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, gtin, {
        format: 'EAN13',
        width: 2,
        height: 60,
        displayValue: false,
        margin: 0,
        background: '#ffffff',
        lineColor: '#000000'
      });
      
      const dataURI = canvas.toDataURL('image/png');
      resolve(dataURI);
    } catch (error) {
      reject(error);
    }
  });
};

export const generateBarcodePDF = async (data: ExcelRow[], options: Partial<BarcodeOptions> = {}) => {
  const opts = { ...defaultBarcodeOptions, ...options };
  const pageDimensions = getPageDimensions(opts.pageSize, opts.orientation);
  
  const pdf = new jsPDF({
    orientation: opts.orientation,
    unit: 'mm',
    format: [pageDimensions.width, pageDimensions.height]
  });

  // Calculate how many boxes fit per page
  const availableWidth = pageDimensions.width - (opts.margin * 2);
  const availableHeight = pageDimensions.height - (opts.margin * 2);
  const boxesPerRow = Math.floor(availableWidth / opts.boxWidth);
  const boxesPerColumn = Math.floor(availableHeight / opts.boxHeight);
  const boxesPerPage = boxesPerRow * boxesPerColumn;

  let currentPage = 0;
  
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const pageIndex = Math.floor(i / boxesPerPage);
    
    // Add new page if needed
    if (pageIndex > currentPage) {
      pdf.addPage();
      currentPage = pageIndex;
    }
    
    const positionInPage = i % boxesPerPage;
    const row = Math.floor(positionInPage / boxesPerRow);
    const col = positionInPage % boxesPerRow;
    
    // Calculate position (centered within available space)
    const startX = opts.margin + (availableWidth - (boxesPerRow * opts.boxWidth)) / 2;
    const startY = opts.margin + (availableHeight - (boxesPerColumn * opts.boxHeight)) / 2;
    
    const x = startX + (col * opts.boxWidth);
    const y = startY + (row * opts.boxHeight);
    
    // Draw box border (optional, for debugging)
    // pdf.rect(x, y, opts.boxWidth, opts.boxHeight);
    
    try {
      // Generate barcode
      const gtin = item.gtin || item.GTIN || '';
      if (gtin) {
        const barcodeDataURI = await generateBarcodeDataURI(gtin);
        
        // Calculate centered positions within the box
        const barcodeX = x + (opts.boxWidth - opts.barcodeWidth) / 2;
        const barcodeY = y + (opts.boxHeight - opts.barcodeHeight) / 2 + 3; // Slight offset down
        
        // Add barcode
        pdf.addImage(barcodeDataURI, 'PNG', barcodeX, barcodeY, opts.barcodeWidth, opts.barcodeHeight);
        
        // Add text below barcode
        pdf.setFontSize(opts.fontSize);
        pdf.setFont('helvetica', 'normal');
        
        // No. and Description above barcode
        const no = item.no || item['No.'] || '';
        const description = item.description || item.Description || '';
        
        if (no) {
          const noY = barcodeY - 2;
          pdf.text(String(no), x + opts.boxWidth / 2, noY, { align: 'center' });
        }
        
        if (description) {
          const descY = barcodeY - 0.5;
          // Truncate description if too long
          const maxLength = 25;
          const truncatedDesc = description.length > maxLength 
            ? description.substring(0, maxLength) + '...' 
            : description;
          pdf.text(truncatedDesc, x + opts.boxWidth / 2, descY, { align: 'center' });
        }
        
        // GTIN below barcode
        const gtinY = barcodeY + opts.barcodeHeight + 2;
        pdf.text(gtin, x + opts.boxWidth / 2, gtinY, { align: 'center' });
      }
    } catch (error) {
      console.error('Error generating barcode for item:', item, error);
    }
  }
  
  return pdf;
};

export const downloadBarcodePDF = async (data: ExcelRow[], options: Partial<BarcodeOptions> = {}) => {
  try {
    const pdf = await generateBarcodePDF(data, options);
    pdf.save('barcodes.pdf');
  } catch (error) {
    console.error('Error generating barcode PDF:', error);
    throw error;
  }
};