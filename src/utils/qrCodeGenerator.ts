import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';
import * as QRCode from 'qrcode';

// Define a type for custom page size
export type PageSize = 'a4' | 'a3' | 'letter' | 'custom' | { width: number; height: number };

// Define options for QR code generation
export interface GenerationOptions {
  boxWidth: number; // width of each box in mm
  boxHeight: number; // height of each box in mm
  qrCodeSize: number; // size of QR code as a proportion of box height (0 to 1)
  orientation: 'portrait' | 'landscape'; 
  fontSize: number; // font size in points
  pageSize: PageSize; // page size
  fontFamily: string; // font family to use
  boxesPerRow?: number; // optional manual override for boxes per row
  boxesPerColumn?: number; // optional manual override for boxes per column
  countOutsideBox?: boolean; // whether to place count number outside the box
  boxSpacing?: number; // spacing between boxes in mm
}

// Default options
const defaultOptions: GenerationOptions = {
  boxWidth: 50, // 50mm width
  boxHeight: 30, // 30mm height
  qrCodeSize: 0.6, // QR code size 60% of box height
  orientation: 'portrait',
  fontSize: 9, // 9pt font size
  pageSize: 'a4', // A4 page size
  fontFamily: 'helvetica-bold', // Helvetica Bold font
  countOutsideBox: true, // Default count outside box
  boxSpacing: 10, // Default 10mm spacing between boxes
};

// Gets page dimensions in mm based on the page size
const getPageDimensions = (pageSize: PageSize, orientation: 'portrait' | 'landscape'): { width: number; height: number } => {
  let width: number, height: number;
  
  if (typeof pageSize === 'object' && 'width' in pageSize) {
    width = pageSize.width;
    height = pageSize.height;
  } else {
    switch (pageSize) {
      case 'a3':
        width = 297; height = 420;
        break;
      case 'letter':
        width = 215.9; height = 279.4;
        break;
      case 'custom':
        // This should be handled by the caller using the object version
        width = 210; height = 297;
        break;
      case 'a4':
      default:
        width = 210; height = 297;
    }
  }
  
  return orientation === 'portrait' 
    ? { width, height } 
    : { width: height, height: width };
};

// Generate QR code as SVG
export const generateQRCodeSVG = (text: string, index: number, options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const size = 100;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="white" />
      <rect x="10%" y="10%" width="80%" height="80%" fill="black" />
      <text x="10%" y="20%" font-family="${opts.fontFamily.replace('-bold', '')}" font-size="10" fill="red" text-anchor="start">
        ${index}.
      </text>
      <text x="25%" y="50%" font-family="${opts.fontFamily.replace('-bold', '')}" font-size="10" font-weight="bold" text-anchor="start">
        ${text}
      </text>
    </svg>
  `;
  
  return svg;
};

// Generate EPS version of a QR code
export const generateQRCodeEPS = (text: string, index: number, options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const size = 300; // Increased size for better visibility
  
  const fontName = opts.fontFamily.includes('bold') 
    ? `/Helvetica-Bold findfont def` 
    : `/${opts.fontFamily.charAt(0).toUpperCase() + opts.fontFamily.slice(1)} findfont def`;
  
  let eps = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${size} ${size}
%%Creator: QR Code Generator
%%Title: QR Code ${index}
%%CreationDate: ${new Date().toISOString()}
%%DocumentData: Clean7Bit
%%EndComments
%%BeginProlog
/M {moveto} def
/L {lineto} def
/RL {rlineto} def
/CP {closepath} def
/F {fill} def
/S {stroke} def
/GS {gsave} def
/GR {grestore} def
/SG {setgray} def
/RF {rectfill} def
/SF {selectfont} def
/SH {show} def
%%EndProlog

% QR Code for: ${text}

% Font setup - Using selected font
/QR-Font ${fontName}

% White background
1.0 1.0 1.0 setrgbcolor
0 0 ${size} ${size} RF

% Black QR code placeholder
0.0 0.0 0.0 setrgbcolor
${size * 0.1} ${size * 0.1} ${size * 0.8} ${size * 0.8} RF

% Index number in red
1.0 0.0 0.0 setrgbcolor
/QR-Font ${opts.fontSize * 2} SF
${size * 0.1} ${size * 0.9} M
(${index}.) SH

% Serial number text
0.0 0.0 0.0 setrgbcolor
/QR-Font ${opts.fontSize * 2} SF
${size * 0.2} ${size * 0.5} M
(${text}) SH

%%EOF
`;
  
  return eps;
};

// Creates an illustrator-ready SVG with multiple QR codes in a grid layout
export const generateIllustratorLayout = (data: ExcelRow[], options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const qrSize = opts.boxHeight * opts.qrCodeSize;
  const padding = opts.boxSpacing || 10; // Use boxSpacing for padding
  const boxesPerRow = opts.boxesPerRow || 5; // Default 5 boxes per row
  const rows = Math.ceil(data.length / boxesPerRow);
  
  const svgWidth = (opts.boxWidth + padding) * boxesPerRow + padding;
  const svgHeight = (opts.boxHeight + padding) * rows + padding;
  
  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" fill="white" />
  `;
  
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const count = row['Count'] || row.count || (index + 1).toString();
    
    const col = index % boxesPerRow;
    const rowNum = Math.floor(index / boxesPerRow);
    
    const x = padding + col * (opts.boxWidth + padding);
    const y = padding + rowNum * (opts.boxHeight + padding);
    
    // Draw box with thin red border (like in the image)
    svgContent += `
      <g transform="translate(${x}, ${y})">
        <rect width="${opts.boxWidth}" height="${opts.boxHeight}" fill="white" stroke="#FF0000" stroke-width="0.5" />
    `;
    
    // If count is outside the box, position it to the left of the box in red
    if (opts.countOutsideBox) {
      svgContent += `
        <text x="${-5}" y="${opts.boxHeight / 2}" font-family="${opts.fontFamily}" font-size="${opts.fontSize * 1.3}" fill="red" text-anchor="end" dominant-baseline="middle">
          ${count}.
        </text>
      `;
    }
    
    // Serial number centered in the left half of the box
    svgContent += `
      <text x="${opts.boxWidth / 4}" y="${opts.boxHeight/2}" font-family="${opts.fontFamily}" font-size="${opts.fontSize}" font-weight="bold" text-anchor="middle" dominant-baseline="middle">
        ${serial}
      </text>
    `;
    
    // QR code positioned on the right side, centered vertically
    svgContent += `
      <image x="${opts.boxWidth * 0.6}" y="${(opts.boxHeight - qrSize) / 2}" width="${qrSize}" height="${qrSize}" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" />
      </g>
    `;
  });
  
  // Add footer information at the bottom like in the image
  svgContent += `
    <text x="20" y="${svgHeight - 20}" font-family="${defaultOptions.fontFamily}" font-size="14" fill="red" text-anchor="start">
      Qty. - ${data.length} each
    </text>
    
    <text x="${svgWidth - 20}" y="${svgHeight - 30}" font-family="${defaultOptions.fontFamily}" font-size="14" fill="#00AA50" text-anchor="end">
      Serial Number+QR code
    </text>
    <text x="${svgWidth - 20}" y="${svgHeight - 10}" font-family="${defaultOptions.fontFamily}" font-size="14" fill="#00AA50" text-anchor="end">
      Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm
    </text>
  `;
  
  svgContent += `</svg>`;
  return svgContent;
};

// Generate a complete layout in EPS format with specific dimensions
export const generateEPSLayout = (data: ExcelRow[], options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  
  const boxWidth = opts.boxWidth * 2.83465;  // Convert mm to points (1mm = 2.83465pts)
  const boxHeight = opts.boxHeight * 2.83465;
  const padding = (opts.boxSpacing || 10) * 2.83465; // Convert spacing to points
  const boxesPerRow = opts.boxesPerRow || 5; // Default 5 boxes per row
  const rows = Math.ceil(data.length / boxesPerRow);
  
  const pageWidth = (boxWidth + padding) * boxesPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
  const qrSize = boxHeight * opts.qrCodeSize;
  
  // Font mapping
  let fontName, boldFontName;
  switch(opts.fontFamily) {
    case 'times':
      fontName = 'Times-Roman';
      boldFontName = 'Times-Bold';
      break;
    case 'courier':
      fontName = 'Courier';
      boldFontName = 'Courier-Bold';
      break;
    case 'helvetica':
    case 'helvetica-bold':
    default:
      fontName = 'Helvetica';
      boldFontName = 'Helvetica-Bold';
  }
  
  let epsContent = `%!PS-Adobe-3.0 EPSF-3.0
%%BoundingBox: 0 0 ${pageWidth} ${pageHeight}
%%Creator: QR Code Generator Layout
%%Title: QR Codes Complete Layout
%%CreationDate: ${new Date().toISOString()}
%%DocumentData: Clean7Bit
%%EndComments
%%BeginProlog
/M {moveto} def
/L {lineto} def
/RL {rlineto} def
/CP {closepath} def
/F {fill} def
/S {stroke} def
/GS {gsave} def
/GR {grestore} def
/SG {setgray} def
/RF {rectfill} def
/SF {selectfont} def
/SH {show} def
%%EndProlog

% Font setup
/${fontName} findfont def
/${boldFontName} findfont def

% White background for entire page
1.0 1.0 1.0 setrgbcolor
0 0 ${pageWidth} ${pageHeight} RF

`;

  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const count = row['Count'] || row.count || (index + 1).toString();
    
    const col = index % boxesPerRow;
    const rowNum = Math.floor(index / boxesPerRow);
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    const qrX = x + (boxWidth * 0.6); // Move QR code to the right position (60%)
    const textX = x + (boxWidth * 0.25); // Center text in the left half
    
    epsContent += `
% QR Code and Label ${index + 1}
GS
  % Box background and border
  1.0 1.0 1.0 setrgbcolor
  ${x} ${y} ${boxWidth} ${boxHeight} RF
  
  1.0 0.0 0.0 setrgbcolor % Red border like in the image
  0.3 setlinewidth
  ${x} ${y} M
  ${boxWidth} 0 RL
  0 ${boxHeight} RL
  ${-boxWidth} 0 RL
  CP
  S
  
  % QR code on right side (centered vertically)
  0.0 0.0 0.0 setrgbcolor
  ${qrX} ${y + (boxHeight - qrSize) / 2} ${qrSize} ${qrSize} RF
  
  % Count number outside the box in red
  1.0 0.0 0.0 setrgbcolor
  /${boldFontName} ${opts.fontSize + 2} SF
  ${x - 10} ${y + boxHeight / 2} M
  (${count}.) SH
  
  % Serial number on left side (centered vertically and horizontally)
  0.0 0.0 0.0 setrgbcolor
  /${boldFontName} ${opts.fontSize + 2} SF
  ${textX} ${y + (boxHeight / 2)} M
  (${serial}) dup stringwidth pop 2 div neg 0 rmoveto SH
GR
`;
  });

  // Add footer information like in the image
  epsContent += `
% Footer information
1.0 0.0 0.0 setrgbcolor % Red text
/${boldFontName} 14 SF
20 20 M
(Qty. - ${data.length} each) SH

0.0 0.7 0.3 setrgbcolor % Green text
/${boldFontName} 14 SF
${pageWidth - 20} 40 M
(Serial Number+QR code) dup stringwidth pop neg 0 rmoveto SH
${pageWidth - 20} 20 M
(Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm) dup stringwidth pop neg 0 rmoveto SH

%%EOF`;

  return epsContent;
};

// Generate QR code data URI for embedding in PDF
export const generateQRCodeDataURI = async (text: string): Promise<string> => {
  try {
    // Generate QR code as data URL
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code data URI:', error);
    // Return a placeholder for error cases
    return '';
  }
};

// Calculate layout based on options
const calculateLayout = (options: GenerationOptions) => {
  const pageDims = getPageDimensions(options.pageSize, options.orientation);
  const boxSpacing = options.boxSpacing || 10; // Use box spacing from options
  
  // If manual values are provided, use them
  if (options.boxesPerRow && options.boxesPerColumn) {
    return {
      boxesPerRow: options.boxesPerRow,
      boxesPerColumn: options.boxesPerColumn,
      boxesPerPage: options.boxesPerRow * options.boxesPerColumn,
      horizontalMargin: (pageDims.width - ((options.boxesPerRow * options.boxWidth) + ((options.boxesPerRow - 1) * boxSpacing))) / 2,
      verticalMargin: (pageDims.height - ((options.boxesPerColumn * options.boxHeight) + ((options.boxesPerColumn - 1) * boxSpacing))) / 2
    };
  }
  
  // Otherwise calculate automatically
  const boxesPerRow = Math.floor((pageDims.width - boxSpacing) / (options.boxWidth + boxSpacing));
  const boxesPerColumn = Math.floor((pageDims.height - boxSpacing) / (options.boxHeight + boxSpacing));
  
  return {
    boxesPerRow,
    boxesPerColumn,
    boxesPerPage: boxesPerRow * boxesPerColumn,
    horizontalMargin: (pageDims.width - ((boxesPerRow * options.boxWidth) + ((boxesPerRow - 1) * boxSpacing))) / 2,
    verticalMargin: (pageDims.height - ((boxesPerColumn * options.boxHeight) + ((boxesPerColumn - 1) * boxSpacing))) / 2
  };
};

// Generate PDF version with improved layout
export const generatePDF = async (data: ExcelRow[], options: Partial<GenerationOptions> = {}) => {
  // Import required libraries dynamically to avoid hydration issues
  const { jsPDF } = await import('jspdf');
  
  // Merge with default options
  const opts: GenerationOptions = { ...defaultOptions, ...options };
  
  // Get page dimensions
  const pageDims = getPageDimensions(opts.pageSize, opts.orientation);
  
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: opts.orientation,
    unit: 'mm',
    format: typeof opts.pageSize === 'object' && 'width' in opts.pageSize ? [opts.pageSize.width, opts.pageSize.height] : opts.pageSize
  });
  
  // Calculate layout
  const layout = calculateLayout(opts);
  const boxSpacing = opts.boxSpacing || 10; // Get spacing between boxes
  
  // Calculate number of pages needed
  const numPages = Math.ceil(data.length / layout.boxesPerPage);
  
  // Function to determine the font to use
  const getFont = () => {
    if (opts.fontFamily.includes('times')) {
      return 'times';
    } else if (opts.fontFamily.includes('courier')) {
      return 'courier';
    } else {
      return 'helvetica'; 
    }
  };
  
  const fontStyle = opts.fontFamily.includes('bold') ? 'bold' : 'normal';
  const font = getFont();
  
  // Generate QR codes and add to PDF page by page
  for (let pageNum = 0; pageNum < numPages; pageNum++) {
    // Add a new page after the first page
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    // Calculate the starting and ending indices for this page
    const startIndex = pageNum * layout.boxesPerPage;
    const endIndex = Math.min(startIndex + layout.boxesPerPage, data.length);
    
    // Process items for current page
    const promises = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const row = data[i];
      const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${i}`;
      const qrText = row['QR Code Text'] || row.qrCodeText || serial;
      const count = row['Count'] || row.count || (i + 1).toString();
      
      const promise = generateQRCodeDataURI(qrText).then(dataUrl => {
        // Calculate position in the grid
        const localIndex = i - startIndex; // Index relative to current page
        const col = localIndex % layout.boxesPerRow;
        const rowNum = Math.floor(localIndex / layout.boxesPerRow);
        
        // Calculate X and Y position for this box, accounting for spacing
        const x = layout.horizontalMargin + (col * (opts.boxWidth + boxSpacing));
        const y = layout.verticalMargin + (rowNum * (opts.boxHeight + boxSpacing));
        
        // Draw box border - thin red border like in the image
        pdf.setDrawColor(255, 0, 0); // Red border
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, opts.boxWidth, opts.boxHeight);
        
        // Add count number in red outside the box
        if (opts.countOutsideBox) {
          pdf.setTextColor(255, 0, 0);
          pdf.setFontSize(10);
          pdf.setFont(font, 'bold');
          pdf.text(`${count}.`, x - 5, y + opts.boxHeight / 2, { align: 'right', baseline: 'middle' });
        }
        
        // Add serial number in black in the center of the left half of the box
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(opts.fontSize);
        pdf.setFont(font, fontStyle);
        
        // Center the serial text in the left half of the box
        const textWidth = pdf.getStringUnitWidth(serial) * pdf.getFontSize() / pdf.internal.scaleFactor;
        const leftHalfCenter = x + (opts.boxWidth * 0.25); // Center of the left half (25%)
        const textX = leftHalfCenter - (textWidth / 2);
        const textY = y + (opts.boxHeight / 2); // Centered vertically
        
        pdf.text(serial, textX, textY, { baseline: 'middle' });
        
        // Calculate QR code size and position (right side of box, centered)
        const qrSize = opts.boxHeight * opts.qrCodeSize;
        const qrX = x + (opts.boxWidth * 0.6); // Positioned at 60% of box width
        const qrY = y + (opts.boxHeight - qrSize) / 2; // Centered vertically
        
        // Add QR code if we have a data URL
        if (dataUrl) {
          pdf.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        }
      });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
  }
  
  // Add footer information like in the image
  for (let i = 0; i < numPages; i++) {
    pdf.setPage(i + 1);
    
    // Add "Qty. - X each" in red on the bottom left
    pdf.setFontSize(12);
    pdf.setTextColor(255, 0, 0);
    pdf.text(`Qty. - ${data.length} each`, 20, pageDims.height - 10);
    
    // Add "Serial Number+QR code" and "Sticker Size" in green on the bottom right
    pdf.setTextColor(0, 170, 80); // Green color
    pdf.setFont(font, 'bold');
    pdf.text("Serial Number+QR code", pageDims.width - 20, pageDims.height - 20, { align: 'right' });
    pdf.text(`Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm`, pageDims.width - 20, pageDims.height - 10, { align: 'right' });
  }
  
  return pdf.output('blob');
};

// Generate the illustrator-ready file in the requested format (SVG, EPS, or PDF)
export const generateIllustratorFile = async (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf', options: Partial<GenerationOptions> = {}): Promise<Blob> => {
  try {
    // For PDF format, use the existing generatePDF function
    if (format === 'pdf') {
      return await generatePDF(data, options);
    }
    
    // For SVG and EPS formats, create a ZIP with individual files and a complete layout
    const zip = new JSZip();
    
    // Create a folder for individual QR codes
    const individualFolder = zip.folder('individual-qr-codes');
    const layoutFolder = zip.folder('complete-layout');
    
    // Add individual QR codes
    data.forEach((row, index) => {
      const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
      const qrText = row['QR Code Text'] || row.qrCodeText || serial;
      
      // Generate the appropriate format
      let fileContent = '';
      if (format === 'svg') {
        fileContent = generateQRCodeSVG(qrText, index + 1, options);
      } else if (format === 'eps') {
        fileContent = generateQRCodeEPS(qrText, index + 1, options);
      }
      
      // Add to the zip
      const fileName = `qr-code-${index + 1}-${serial.replace(/[^a-zA-Z0-9]/g, '_')}.${format}`;
      individualFolder?.file(fileName, fileContent);
    });
    
    // Add the complete layout file
    if (format === 'svg') {
      layoutFolder?.file(`complete-layout.svg`, generateIllustratorLayout(data, options));
    } else if (format === 'eps') {
      layoutFolder?.file(`complete-layout.eps`, generateEPSLayout(data, options));
    }
    
    // Generate the ZIP file
    return await zip.generateAsync({ type: "blob" });
  } catch (error) {
    console.error(`Error generating ${format} files:`, error);
    throw error;
  }
};

export const downloadIllustratorFiles = async (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg', options: Partial<GenerationOptions> = {}): Promise<void> => {
  try {
    const blob = await generateIllustratorFile(data, format, options);
    
    if (format === 'pdf') {
      // For PDF, save the blob directly
      saveAs(blob, `qr_codes_layout.pdf`);
    } else {
      // For other formats, save as ZIP with all files
      const extension = format === 'svg' ? 'svg' : 'eps';
      saveAs(blob, `qr_codes_for_illustrator_${extension}.zip`);
    }
  } catch (error) {
    console.error(`Failed to generate ${format.toUpperCase()} files:`, error);
    throw error;
  }
};
