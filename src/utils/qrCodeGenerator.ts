
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';
import * as QRCode from 'qrcode';

// Generate QR code as SVG
export const generateQRCodeSVG = (text: string, index: number): string => {
  const size = 100;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="white" />
      <rect x="10%" y="10%" width="80%" height="80%" fill="black" />
      <text x="10%" y="20%" font-family="Arial" font-size="10" fill="red" text-anchor="start">
        ${index}.
      </text>
      <text x="25%" y="50%" font-family="Arial" font-size="10" font-weight="bold" text-anchor="start">
        ${text}
      </text>
    </svg>
  `;
  
  return svg;
};

// Generate EPS version of a QR code
export const generateQRCodeEPS = (text: string, index: number): string => {
  const size = 300; // Increased size for better visibility
  
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

% White background
1.0 1.0 1.0 setrgbcolor
0 0 ${size} ${size} RF

% Black QR code placeholder
0.0 0.0 0.0 setrgbcolor
${size * 0.1} ${size * 0.1} ${size * 0.8} ${size * 0.8} RF

% Index number in red
1.0 0.0 0.0 setrgbcolor
/Helvetica-Bold 24 SF
${size * 0.1} ${size * 0.9} M
(${index}.) SH

% Serial number text
0.0 0.0 0.0 setrgbcolor
/Helvetica 18 SF
${size * 0.2} ${size * 0.5} M
(${text}) SH

%%EOF
`;
  
  return eps;
};

// Creates an illustrator-ready SVG with multiple QR codes in a grid layout
export const generateIllustratorLayout = (data: ExcelRow[]): string => {
  const qrSize = 120;
  const padding = 10;
  const qrPerRow = 5;
  const rows = Math.ceil(data.length / qrPerRow);
  
  const svgWidth = (qrSize + padding) * qrPerRow + padding;
  const svgHeight = (qrSize + padding) * rows + padding;
  
  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
      <rect width="100%" height="100%" fill="white" />
  `;
  
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (qrSize + padding);
    const y = padding + rowNum * (qrSize + padding);
    
    svgContent += `
      <g transform="translate(${x}, ${y})">
        <rect width="${qrSize}" height="${qrSize}" fill="white" stroke="lightgray" stroke-width="1" />
        <text x="10" y="20" font-family="Arial" font-size="12" fill="red">
          ${index + 1}.
        </text>
        <text x="50" y="60" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle">
          ${serial}
        </text>
        <image x="60" y="30" width="50" height="50" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" />
      </g>
    `;
  });
  
  svgContent += `</svg>`;
  return svgContent;
};

// Generate a complete layout in EPS format with specific dimensions
export const generateEPSLayout = (data: ExcelRow[]): string => {
  const boxWidth = 50 * 2.83465;  // 50mm in points
  const boxHeight = 30 * 2.83465; // 30mm in points
  const padding = 10; // padding between boxes in points
  const qrPerRow = 4; // fewer per row to accommodate larger box size
  const rows = Math.ceil(data.length / qrPerRow);
  
  const pageWidth = (boxWidth + padding) * qrPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
  const qrSize = boxHeight * 0.8;
  
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

% Font setup - Using Helvetica as fallback for Denso
/Denso-Font /Helvetica findfont def
/Denso /Helvetica-Bold findfont def

% White background for entire page
1.0 1.0 1.0 setrgbcolor
0 0 ${pageWidth} ${pageHeight} RF

`;

  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    const qrX = x + boxWidth - qrSize - 5; // 5 points from right edge
    const textPosition = x + ((boxWidth - qrSize) / 4); // Center point for text
    
    epsContent += `
% QR Code and Label ${index + 1}
GS
  % Box background and border
  1.0 1.0 1.0 setrgbcolor
  ${x} ${y} ${boxWidth} ${boxHeight} RF
  
  0.8 0.8 0.8 setrgbcolor
  0.5 setlinewidth
  ${x} ${y} M
  ${boxWidth} 0 RL
  0 ${boxHeight} RL
  ${-boxWidth} 0 RL
  CP
  S
  
  % QR code on right side (centered vertically)
  0.0 0.0 0.0 setrgbcolor
  ${qrX} ${y + (boxHeight - qrSize) / 2} ${qrSize} ${qrSize} RF
  
  % Index number in top-left
  1.0 0.0 0.0 setrgbcolor
  /Denso 10 SF
  ${x + 5} ${y + boxHeight - 10} M
  (${index + 1}.) SH
  
  % Serial number on left side (centered vertically and horizontally)
  0.0 0.0 0.0 setrgbcolor
  /Denso 12 SF
  ${textPosition} ${y + (boxHeight / 2)} M
  (${serial}) dup stringwidth pop 2 div neg 0 rmoveto SH
GR
`;
  });

  epsContent += `
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

// Generate PDF version with improved layout for A4 with 25 boxes per page
export const generatePDF = async (data: ExcelRow[]) => {
  // Import required libraries dynamically to avoid hydration issues
  const { jsPDF } = await import('jspdf');
  
  // Create a new PDF document (A4 size)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // A4 dimensions in mm
  const pageWidth = 210;
  const pageHeight = 297;
  
  // Box dimensions for a 5x5 grid on A4
  const boxesPerRow = 5;
  const boxesPerColumn = 5;
  const boxesPerPage = boxesPerRow * boxesPerColumn;
  const boxWidth = (pageWidth - 20) / boxesPerRow;  // 10mm margin on each side
  const boxHeight = (pageHeight - 30) / boxesPerColumn; // 15mm margin on top and bottom
  
  // Calculate number of pages needed
  const numPages = Math.ceil(data.length / boxesPerPage);
  
  // Generate QR codes and add to PDF page by page
  for (let pageNum = 0; pageNum < numPages; pageNum++) {
    // Add a new page after the first page
    if (pageNum > 0) {
      pdf.addPage();
    }
    
    // Calculate the starting and ending indices for this page
    const startIndex = pageNum * boxesPerPage;
    const endIndex = Math.min(startIndex + boxesPerPage, data.length);
    
    // Process items for current page
    const promises = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const row = data[i];
      const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${i}`;
      const qrText = row['QR Code Text'] || row.qrCodeText || serial;
      
      const promise = generateQRCodeDataURI(qrText).then(dataUrl => {
        // Calculate position in the grid
        const localIndex = i - startIndex; // Index relative to current page
        const col = localIndex % boxesPerRow;
        const rowNum = Math.floor(localIndex / boxesPerRow);
        
        // Calculate X and Y position for this box
        const x = 10 + (col * boxWidth);
        const y = 15 + (rowNum * boxHeight);
        
        // Draw box border
        pdf.setDrawColor(200, 0, 0); // Red border for boxes
        pdf.setLineWidth(0.2);
        pdf.rect(x, y, boxWidth, boxHeight);
        
        // Add box number in red in the left
        pdf.setTextColor(255, 0, 0);
        pdf.setFontSize(10);
        pdf.text(`${i + 1}.`, x + 2, y + 10);
        
        // Add serial number in black
        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "bold");
        pdf.text(serial, x + 12, y + 10);
        
        // Calculate QR code size and position (right side of box)
        const qrSize = Math.min(boxHeight - 10, boxWidth / 2.5);
        const qrX = x + boxWidth - qrSize - 5;
        const qrY = y + (boxHeight - qrSize) / 2;
        
        // Add QR code if we have a data URL
        if (dataUrl) {
          pdf.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        }
      });
      
      promises.push(promise);
    }
    
    await Promise.all(promises);
  }
  
  // Add page number and generation date at the bottom of each page
  for (let i = 0; i < numPages; i++) {
    pdf.setPage(i + 1);
    
    // Add footer with information based on image reference
    pdf.setFontSize(12);
    pdf.setTextColor(255, 0, 0);
    pdf.text(`Qty. - ${data.length} each`, 20, pageHeight - 10);
    
    pdf.setTextColor(0, 150, 50); // Green color
    pdf.setFont("helvetica", "bold");
    pdf.text("Serial Number+QR code", pageWidth - 60, pageHeight - 15);
    pdf.text("Sticker Size - 50 x 30mm", pageWidth - 60, pageHeight - 10);
    
    // Optional: Add page number
    pdf.setFontSize(8);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i + 1} of ${numPages}`, pageWidth - 20, 10, { align: 'right' });
  }
  
  return pdf.output('blob');
};

// Generate Illustrator file in requested format
export const generateIllustratorFile = async (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg'): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder("qr_codes");
  
  if (!folder) throw new Error("Failed to create zip folder");
  
  // Generate individual QR code files
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    if (qrText || serial) {
      if (format === 'svg') {
        const svg = generateQRCodeSVG(qrText || serial, index + 1);
        folder.file(`QR_${serial}.svg`, svg);
      } else if (format === 'eps') {
        const eps = generateQRCodeEPS(qrText || serial, index + 1);
        folder.file(`QR_${serial}.eps`, eps);
      }
    }
  });
  
  // Generate the layout file
  if (format === 'svg') {
    const layoutSvg = generateIllustratorLayout(data);
    folder.file("complete_layout.svg", layoutSvg);
  } else if (format === 'eps') {
    const layoutEps = generateEPSLayout(data);
    folder.file("complete_layout.eps", layoutEps);
  } else if (format === 'pdf') {
    // For PDF, we'll generate it directly rather than adding to ZIP
    return await generatePDF(data);
  }
  
  return zip.generateAsync({ type: "blob" });
};

export const downloadIllustratorFiles = async (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg'): Promise<void> => {
  try {
    const blob = await generateIllustratorFile(data, format);
    
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
