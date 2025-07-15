import JsBarcode from 'jsbarcode';
import jsPDF from 'jspdf';
import { ExcelRow } from './excelParser';

export interface BarcodeOptions {
  boxWidth: number; // in mm
  boxHeight: number; // in mm
  boxSpacing: number; // in mm
  barcodeWidth: number; // in mm
  barcodeHeight: number; // in mm
  fontSize: number; // in pt
  pageSize: 'A4' | 'A3' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margin: number; // in mm
  boxesPerRow?: number;
  boxesPerColumn?: number;
  countOutsideBox: boolean;
  transparentBackground: boolean;
  fontFamily: string;
}

export const defaultBarcodeOptions: BarcodeOptions = {
  boxWidth: 50,
  boxHeight: 25,
  boxSpacing: 2,
  barcodeWidth: 36.6,
  barcodeHeight: 10.6,
  fontSize: 6.667,
  pageSize: 'A4',
  orientation: 'portrait',
  margin: 10,
  countOutsideBox: true,
  transparentBackground: true,
  fontFamily: 'denso-regular'
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

export const generateBarcodeDataURI = (gtin: string, transparent: boolean = true): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      JsBarcode(canvas, gtin, {
        format: 'CODE128',
        width: 2,
        height: 60,
        displayValue: false,
        margin: 0,
        background: transparent ? 'transparent' : '#ffffff',
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
  const boxesPerRow = opts.boxesPerRow || Math.floor(availableWidth / (opts.boxWidth + opts.boxSpacing));
  const boxesPerColumn = opts.boxesPerColumn || Math.floor(availableHeight / (opts.boxHeight + opts.boxSpacing));
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
    const totalWidth = boxesPerRow * opts.boxWidth + (boxesPerRow - 1) * opts.boxSpacing;
    const totalHeight = boxesPerColumn * opts.boxHeight + (boxesPerColumn - 1) * opts.boxSpacing;
    const startX = opts.margin + (availableWidth - totalWidth) / 2;
    const startY = opts.margin + (availableHeight - totalHeight) / 2;
    
    const x = startX + col * (opts.boxWidth + opts.boxSpacing);
    const y = startY + row * (opts.boxHeight + opts.boxSpacing);
    
    // Draw box border
    pdf.rect(x, y, opts.boxWidth, opts.boxHeight);
    
    try {
      // Generate barcode
      const gtin = item.gtin || item.GTIN || '';
      if (gtin) {
        const barcodeDataURI = await generateBarcodeDataURI(gtin, opts.transparentBackground);
        
        // Calculate centered positions within the box
        const barcodeX = x + (opts.boxWidth - opts.barcodeWidth) / 2;
        const barcodeY = y + (opts.boxHeight - opts.barcodeHeight) / 2 + 3; // Slight offset down
        
        // Add barcode
        pdf.addImage(barcodeDataURI, 'PNG', barcodeX, barcodeY, opts.barcodeWidth, opts.barcodeHeight);
        
        // Add text below barcode
        pdf.setFontSize(opts.fontSize);
        
        // Handle font selection
        let fontFamily = 'helvetica';
        let fontStyle = 'normal';
        
        switch (opts.fontFamily) {
          case 'helvetica':
            fontFamily = 'helvetica';
            fontStyle = 'normal';
            break;
          case 'helvetica-bold':
            fontFamily = 'helvetica';
            fontStyle = 'bold';
            break;
          case 'times':
            fontFamily = 'times';
            fontStyle = 'normal';
            break;
          case 'courier':
            fontFamily = 'courier';
            fontStyle = 'normal';
            break;
          case 'denso-regular':
          case 'denso-bold-real':
            // For DENSO fonts, use Helvetica as fallback since jsPDF doesn't support custom fonts directly
            fontFamily = 'helvetica';
            fontStyle = opts.fontFamily.includes('bold') ? 'bold' : 'normal';
            break;
          default:
            // For custom fonts, use Helvetica as fallback
            fontFamily = 'helvetica';
            fontStyle = 'normal';
        }
        
        pdf.setFont(fontFamily, fontStyle);
        
        // No. and Description above barcode
        const no = item.no || item['No.'] || '';
        const description = item.description || item.Description || '';
        
        if (opts.countOutsideBox && no) {
          // Place count outside box (top-left corner)
          const countX = x - 5;
          const countY = y - 2;
          pdf.text(String(no), countX, countY, { align: 'left' });
        } else if (no) {
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