import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';

export const generateQRCodeSVG = (text: string, index: number): string => {
  // Create more professional QR code representation (still placeholder)
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

// Generate EPS version of a QR code - Improved for Illustrator compatibility
export const generateQRCodeEPS = (text: string, index: number): string => {
  const size = 300; // Increased size for better visibility
  
  // Create a proper EPS file format that's compatible with Adobe Illustrator
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
  // Use 50mm x 30mm box size (converted to points - 1mm = 2.83465 points)
  const boxWidth = 50 * 2.83465;  // 50mm in points
  const boxHeight = 30 * 2.83465; // 30mm in points
  const padding = 10; // padding between boxes in points
  const qrPerRow = 4; // fewer per row to accommodate larger box size
  const rows = Math.ceil(data.length / qrPerRow);
  
  const pageWidth = (boxWidth + padding) * qrPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
  // QR code dimensions and positioning
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

  // Add each QR code to the layout
  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    // Right side for QR code (centered vertically)
    const qrX = x + boxWidth - qrSize - 5; // 5 points from right edge
    const qrY = y + (boxHeight - qrSize) / 2;
    
    // Fixed issue: Use a calculated position for text centering in JavaScript
    // instead of trying to use PostScript commands in a template literal
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
  ${qrX} ${qrY} ${qrSize} ${qrSize} RF
  
  % Index number in top-left
  1.0 0.0 0.0 setrgbcolor
  /Denso 10 SF
  ${x + 5} ${y + boxHeight - 10} M
  (${index + 1}.) SH
  
  % Serial number on left side (centered vertically and horizontally)
  0.0 0.0 0.0 setrgbcolor
  /Denso 12 SF
  
  % Use PostScript's own text centering mechanism
  % This is safer than trying to calculate width in JavaScript
  ${textPosition} ${y + (boxHeight / 2)} M
  (${serial}) dup stringwidth pop 2 div neg 0 rmoveto SH
GR
`;
  });

  epsContent += `
%%EOF`;

  return epsContent;
};

// Generate PDF version of the complete layout - Improved for proper rendering
export const generatePDF = (data: ExcelRow[]) => {
  // Create a valid PDF document with properly encoded content
  const boxWidth = 50 * 2.83465;  // 50mm in points
  const boxHeight = 30 * 2.83465; // 30mm in points
  const padding = 10; // padding between boxes in points
  const qrPerRow = 4; // fewer per row to accommodate larger box size
  const rows = Math.ceil(data.length / qrPerRow);
  
  const pageWidth = (boxWidth + padding) * qrPerRow + padding;
  const pageHeight = (boxHeight + padding) * rows + padding;
  
  // Create a more standards-compliant PDF
  let pdfContent = `%PDF-1.7
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page
   /Parent 2 0 R
   /MediaBox [0 0 ${pageWidth} ${pageHeight}]
   /Contents 4 0 R
   /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >>
>>
endobj
4 0 obj
<< /Length 7 0 R >>
stream
BT
/F1 12 Tf
10 ${pageHeight - 20} Td
(QR Code Layout - Generated for Adobe Illustrator) Tj
ET
`;

  // Add rectangles and text for each QR code box
  data.forEach((row, index) => {
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    const col = index % qrPerRow;
    const rowNum = Math.floor(index / qrPerRow);
    
    const x = padding + col * (boxWidth + padding);
    const y = pageHeight - (padding + (rowNum + 1) * (boxHeight + padding));
    
    // Right side for QR code (centered vertically)
    const qrX = x + boxWidth - boxHeight * 0.8 - 5; // 5 points from right edge
    const qrY = y + (boxHeight - boxHeight * 0.8) / 2;
    
    // Text positioning
    const textX = x + ((boxWidth - boxHeight * 0.8) / 2) - 20;
    const textY = y + (boxHeight / 2);
    
    // Draw box
    pdfContent += `
% Box ${index + 1}
${x} ${y} ${boxWidth} ${boxHeight} re
S

% QR code placeholder
${qrX} ${qrY} ${boxHeight * 0.8} ${boxHeight * 0.8} re
f

% Serial text
BT
/F2 10 Tf
${textX} ${textY} Td
(${serial}) Tj
ET

% Index number
BT
/F1 8 Tf
${x + 5} ${y + boxHeight - 10} Td
(${index + 1}.) Tj
ET
`;
  });
  
  pdfContent += `
endstream
endobj
7 0 obj
${pdfContent.split('stream')[1].split('endstream')[0].length}
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>
endobj
xref
0 8
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000274 00000 n
0000000${pdfContent.split('stream')[1].split('endstream')[0].length + 300} 00000 n
0000000${pdfContent.split('stream')[1].split('endstream')[0].length + 360} 00000 n
0000000${pdfContent.split('stream')[1].split('endstream')[0].length + 274} 00000 n
trailer
<< /Size 8 /Root 1 0 R >>
startxref
${pdfContent.split('stream')[1].split('endstream')[0].length + 425}
%%EOF`;

  return pdfContent;
};

// Generate a complete layout in EPS format with specific dimensions
export const generateIllustratorFile = (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg'): Promise<Blob> => {
  const zip = new JSZip();
  const folder = zip.folder("qr_codes");
  
  if (!folder) throw new Error("Failed to create zip folder");
  
  // Add individual QR codes
  data.forEach((row, index) => {
    const qrText = row['QR Code Text'] || row.qrCodeText || '';
    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${index}`;
    
    if (qrText) {
      if (format === 'svg') {
        const svg = generateQRCodeSVG(qrText, index + 1);
        folder.file(`QR_${serial}.svg`, svg);
      } else if (format === 'eps') {
        const eps = generateQRCodeEPS(qrText, index + 1);
        folder.file(`QR_${serial}.eps`, eps);
      }
    }
  });
  
  // Add a complete layout file
  if (format === 'svg') {
    const layoutSvg = generateIllustratorLayout(data);
    folder.file("complete_layout.svg", layoutSvg);
  } else if (format === 'eps') {
    const layoutEps = generateEPSLayout(data);
    folder.file("complete_layout.eps", layoutEps);
  } else if (format === 'pdf') {
    const pdfContent = generatePDF(data);
    folder.file("complete_layout.pdf", pdfContent);
  }
  
  return zip.generateAsync({ type: "blob" });
};

export const downloadIllustratorFiles = async (data: ExcelRow[], format: 'svg' | 'eps' | 'pdf' = 'svg'): Promise<void> => {
  try {
    const blob = await generateIllustratorFile(data, format);
    const extension = format === 'svg' ? 'svg' : format === 'eps' ? 'eps' : 'pdf';
    saveAs(blob, `qr_codes_for_illustrator_${extension}.zip`);
  } catch (error) {
    console.error(`Failed to generate ${format.toUpperCase()} files:`, error);
    throw error;
  }
};
