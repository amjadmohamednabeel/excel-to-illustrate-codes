
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ExcelRow } from './excelParser';
import * as QRCode from 'qrcode';

export type PageSize = 'a4' | 'a3' | 'letter' | 'custom' | { width: number; height: number };

export interface GenerationOptions {
  boxWidth: number;
  boxHeight: number;
  qrCodeSize: number;
  orientation: 'portrait' | 'landscape'; 
  fontSize: number;
  pageSize: PageSize;
  fontFamily: string;
  boxesPerRow?: number;
  boxesPerColumn?: number;
  countOutsideBox?: boolean;
  boxSpacing?: number;
  rowSpacing?: number;
  showFooter?: boolean;
  customQty?: string;
  footerFontSize?: number;
  boxBorderColor?: string;
  countColor?: string;
  serialColor?: string;
  qrCodeColor?: string;
  qrCodeBgColor?: string;
  footerQtyColor?: string;
  footerInfoColor?: string;
  qrCodeTransparentBg?: boolean;
  qrCodeWidth?: number;
  qrCodeHeight?: number;
  serialToBoxGap?: number;
  serialToQrGap?: number;
  qrToBoxGap?: number;
  useQuantityRepeat?: boolean;
  quantityRepeat?: number;
}

const defaultOptions: GenerationOptions = {
  boxWidth: 50,
  boxHeight: 30,
  qrCodeSize: 0.6,
  orientation: 'portrait',
  fontSize: 9,
  pageSize: 'a4',
  fontFamily: 'helvetica-bold',
  countOutsideBox: true,
  boxSpacing: 10,
  rowSpacing: 10,
  showFooter: true,
  footerFontSize: 12,
  boxBorderColor: '#FF0000',
  countColor: '#FF0000',
  serialColor: '#000000',
  qrCodeColor: '#000000',
  qrCodeBgColor: '#FFFFFF',
  footerQtyColor: '#FF0000',
  footerInfoColor: '#00AA50',
  qrCodeTransparentBg: false,
  qrCodeWidth: undefined,
  qrCodeHeight: undefined,
  serialToBoxGap: 3.1,
  serialToQrGap: 6.3,
  qrToBoxGap: 2.57,
};

const calculateContentPositions = (options: GenerationOptions) => {
  const opts = { ...defaultOptions, ...options };
  
  const serialX = opts.serialToBoxGap || defaultOptions.serialToBoxGap!;
  const qrX = serialX + (opts.serialToQrGap || defaultOptions.serialToQrGap!);
  
  let qrWidth, qrHeight;
  if (opts.qrCodeWidth && opts.qrCodeHeight) {
    qrWidth = opts.qrCodeWidth;
    qrHeight = opts.qrCodeHeight;
  } else {
    qrWidth = qrHeight = opts.boxHeight * opts.qrCodeSize;
  }
  
  const totalContentWidth = serialX + (opts.serialToQrGap || defaultOptions.serialToQrGap!) + qrWidth + (opts.qrToBoxGap || defaultOptions.qrToBoxGap!);
  
  return {
    serialX,
    qrX,
    qrWidth,
    qrHeight,
    totalContentWidth,
    isValidLayout: totalContentWidth <= opts.boxWidth
  };
};

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

// Helper function to get uploaded fonts
const getUploadedFonts = () => {
  try {
    const fonts = localStorage.getItem('uploaded-fonts');
    return fonts ? JSON.parse(fonts) : [];
  } catch (error) {
    console.error('Error parsing uploaded fonts:', error);
    return [];
  }
};

// Font file mapping for public DENSO fonts
const PUBLIC_DENSO_FONTS = {
  'denso-regular': { file: 'DENSORegular.woff2.ttf', name: 'DENSO-Regular' },
  'denso-bold-real': { file: 'DENSOBold.woff2.ttf', name: 'DENSO-Bold' },
};

// Function to load font from public directory
const loadPublicFontForPDF = async (fontFamily: string) => {
  const fontInfo = PUBLIC_DENSO_FONTS[fontFamily as keyof typeof PUBLIC_DENSO_FONTS];
  if (!fontInfo) return null;

  try {
    const response = await fetch(`/Denso Fonts/${fontInfo.file}`);
    if (!response.ok) {
      console.warn(`Could not load font file: ${fontInfo.file}`);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    
    return {
      name: fontInfo.name,
      base64: base64,
      family: fontFamily
    };
  } catch (error) {
    console.error(`Error loading public font ${fontInfo.file}:`, error);
    return null;
  }
};

// Helper function to get font data for PDF
const getFontDataForPDF = async (fontFamily: string) => {
  console.log('Getting font data for PDF, fontFamily:', fontFamily);
  
  // Check if it's a public DENSO font
  if (PUBLIC_DENSO_FONTS[fontFamily as keyof typeof PUBLIC_DENSO_FONTS]) {
    console.log('Loading public DENSO font:', fontFamily);
    return await loadPublicFontForPDF(fontFamily);
  }
  
  // Check if it's a custom uploaded font
  if (fontFamily.startsWith('custom-')) {
    const uploadedFonts = getUploadedFonts();
    const matchingFont = uploadedFonts.find((font: any) => font.family === fontFamily);
    
    if (matchingFont && matchingFont.base64Data) {
      console.log('Found matching uploaded font:', matchingFont.name);
      return {
        name: matchingFont.name,
        base64: matchingFont.base64Data,
        family: fontFamily
      };
    }
  }
  
  // Check legacy denso font storage
  const densoFontInfo = localStorage.getItem('denso-custom-font');
  if (densoFontInfo) {
    try {
      const fontData = JSON.parse(densoFontInfo);
      if (fontData.loaded && fontData.base64Data) {
        console.log('Found legacy denso font:', fontData.name);
        return {
          name: fontData.name,
          base64: fontData.base64Data,
          family: fontData.family || 'custom-font'
        };
      }
    } catch (error) {
      console.error('Error parsing denso font data:', error);
    }
  }
  
  return null;
};

export const generateQRCodeSVG = (text: string, index: number, options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const positions = calculateContentPositions(opts);
  const size = 100;
  
  const bgFill = opts.qrCodeTransparentBg ? 'transparent' : opts.qrCodeBgColor;
  
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="100%" height="100%" fill="${bgFill}" />
      <rect x="${positions.serialX}%" y="40%" width="30%" height="20%" fill="${opts.qrCodeColor}" />
      <text x="${positions.serialX}%" y="35%" font-family="${opts.fontFamily.replace('-bold', '')}" font-size="8" fill="${opts.countColor}" text-anchor="start">
        ${index}.
      </text>
      <text x="${positions.serialX + 5}%" y="55%" font-family="${opts.fontFamily.replace('-bold', '')}" font-size="8" font-weight="bold" fill="${opts.serialColor}" text-anchor="start">
        ${text}
      </text>
      <rect x="${positions.qrX}%" y="40%" width="${positions.qrWidth}%" height="${positions.qrHeight}%" fill="${opts.qrCodeColor}" />
    </svg>
  `;
  
  return svg;
};

export const generateEPSLayout = (data: ExcelRow[], options: Partial<GenerationOptions> = {}): string => {
  // Placeholder for EPS generation implementation
  return "EPS generation placeholder";
};

// Helper function to detect sets in data
const detectSets = (data: ExcelRow[]): ExcelRow[][] => {
  const sets: ExcelRow[][] = [];
  let currentSet: ExcelRow[] = [];
  let previousCount: number | null = null;
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const count = Number(row['Count'] || row.count || 0);
    
    // Detect when a new set starts (count resets to 1 or becomes smaller than previous)
    if (previousCount !== null && (count === 1 || count < previousCount)) {
      // Push current set and start a new one
      if (currentSet.length > 0) {
        sets.push(currentSet);
        currentSet = [];
      }
    }
    
    currentSet.push(row);
    previousCount = count;
  }
  
  // Push the last set
  if (currentSet.length > 0) {
    sets.push(currentSet);
  }
  
  return sets.length > 0 ? sets : [data]; // Return original data as single set if no sets detected
};

export const generatePDF = async (data: ExcelRow[], options: Partial<GenerationOptions> = {}) => {
  const { jsPDF } = await import('jspdf');
  
  const opts: GenerationOptions = { ...defaultOptions, ...options };
  const positions = calculateContentPositions(opts);
  
  const pageDims = getPageDimensions(opts.pageSize, opts.orientation);
  
  const pdf = new jsPDF({
    orientation: opts.orientation,
    unit: 'mm',
    format: typeof opts.pageSize === 'object' && 'width' in opts.pageSize ? [opts.pageSize.width, opts.pageSize.height] : opts.pageSize
  });
  
  // Detect sets in the original data (don't repeat rows in data array)
  const sets = detectSets(data);
  console.log(`Detected ${sets.length} sets in data`);
  
  const layout = calculateLayout(opts);
  const boxSpacing = opts.boxSpacing || 10;
  const rowSpacing = opts.rowSpacing || opts.boxSpacing || 10;
  
  // Function to determine and load the font
  const setupFont = async () => {
    console.log('Setting up font for PDF, fontFamily:', opts.fontFamily);
    
    // Try to load custom font data
    const customFontData = await getFontDataForPDF(opts.fontFamily);
    if (customFontData) {
      try {
        console.log('Loading custom font for PDF:', customFontData.name);
        const fontFileName = `${customFontData.name}.ttf`;
        pdf.addFileToVFS(fontFileName, customFontData.base64);
        pdf.addFont(fontFileName, customFontData.name, 'normal');
        
        // Add bold variant if it's a regular font
        if (customFontData.name.includes('Regular') || customFontData.name.includes('Light')) {
          pdf.addFont(fontFileName, customFontData.name, 'bold');
        }
        
        return customFontData.name;
      } catch (error) {
        console.error('Error loading custom font for PDF:', error);
      }
    }
    
    // Handle system fonts
    if (opts.fontFamily.includes('times')) {
      return 'times';
    } else if (opts.fontFamily.includes('courier')) {
      return 'courier';
    } else {
      return 'helvetica';
    }
  };
  
  const font = await setupFont();
  let fontStyle = 'normal';
  
  // Determine font style based on font family
  if (opts.fontFamily.includes('bold') || opts.fontFamily.includes('Bold')) {
    fontStyle = 'bold';
  }
  
  // Convert hex color to RGB array for PDF
  const hexToRGBArray = (hex: string): [number, number, number] => {
    hex = hex.replace(/^#/, '');
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
  };
  
  const boxBorderColorRGB = hexToRGBArray(opts.boxBorderColor || defaultOptions.boxBorderColor!);
  const countColorRGB = hexToRGBArray(opts.countColor || defaultOptions.countColor!);
  const serialColorRGB = hexToRGBArray(opts.serialColor || defaultOptions.serialColor!);
  const qrCodeColorRGB = hexToRGBArray(opts.qrCodeColor || defaultOptions.qrCodeColor!);
  const qrCodeBgColorRGB = hexToRGBArray(opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!);
  const footerQtyColorRGB = hexToRGBArray(opts.footerQtyColor || defaultOptions.footerQtyColor!);
  const footerInfoColorRGB = hexToRGBArray(opts.footerInfoColor || defaultOptions.footerInfoColor!);

  // Set the font for the PDF
  try {
    pdf.setFont(font, fontStyle);
    console.log(`Successfully set font: ${font} with style: ${fontStyle}`);
  } catch (error) {
    console.warn(`Could not set font ${font}, falling back to helvetica:`, error);
    pdf.setFont('helvetica', fontStyle);
  }
  
  let isFirstPage = true;
  let totalPagesCreated = 0;
  
  // Generate QR codes for each set, with each set starting on a new page
  for (let setIndex = 0; setIndex < sets.length; setIndex++) {
    const setData = sets[setIndex];
    
    // Calculate total boxes needed considering quantity repeat
    const repeatCount = opts.useQuantityRepeat && opts.quantityRepeat ? opts.quantityRepeat : 1;
    const totalBoxes = setData.length * repeatCount;
    const numPagesForSet = Math.ceil(totalBoxes / layout.boxesPerPage);
    console.log(`Set ${setIndex + 1}: ${setData.length} items x ${repeatCount} = ${totalBoxes} boxes, ${numPagesForSet} pages`);
    
    for (let pageNum = 0; pageNum < numPagesForSet; pageNum++) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;
      totalPagesCreated++;
      
      const startBoxIndex = pageNum * layout.boxesPerPage;
      const endBoxIndex = Math.min(startBoxIndex + layout.boxesPerPage, totalBoxes);
      
      const promises = [];
      
      for (let boxIndex = startBoxIndex; boxIndex < endBoxIndex; boxIndex++) {
        // Calculate which data row and which repeat this box represents
        const dataIndex = Math.floor(boxIndex / repeatCount);
        const row = setData[dataIndex];
        
        const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${dataIndex}`;
        const qrText = row['QR Code Text'] || row.qrCodeText || serial;
        const count = row['Count'] || row.count || (dataIndex + 1).toString();
        
        const qrOptions = {
          errorCorrectionLevel: 'M' as QRCode.QRCodeErrorCorrectionLevel,
          margin: 1,
          width: 200,
          color: {
            dark: opts.qrCodeColor || defaultOptions.qrCodeColor!,
            light: opts.qrCodeTransparentBg ? '#0000' : (opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!)
          }
        };
        
        const promise = QRCode.toDataURL(qrText, qrOptions).then(dataUrl => {
          const localBoxIndex = boxIndex - startBoxIndex;
          const col = localBoxIndex % layout.boxesPerRow;
          const rowNum = Math.floor(localBoxIndex / layout.boxesPerRow);
          
          const x = layout.horizontalMargin + (col * (opts.boxWidth + boxSpacing));
          const y = layout.verticalMargin + (rowNum * (opts.boxHeight + rowSpacing));
          
          // Draw box border
          pdf.setDrawColor(...boxBorderColorRGB);
          pdf.setLineWidth(0.2);
          pdf.rect(x, y, opts.boxWidth, opts.boxHeight);
          
          // Add count number outside the box
          if (opts.countOutsideBox) {
            pdf.setTextColor(...countColorRGB);
            pdf.setFontSize(10);
            try {
              pdf.setFont(font, 'bold');
            } catch {
              pdf.setFont('helvetica', 'bold');
            }
            pdf.text(`${count}.`, x - 5, y + opts.boxHeight / 2, { align: 'right', baseline: 'middle' });
          }
          
          // Add serial number
          pdf.setTextColor(...serialColorRGB);
          pdf.setFontSize(opts.fontSize);
          try {
            pdf.setFont(font, fontStyle);
          } catch {
            pdf.setFont('helvetica', fontStyle);
          }
          
          const textY = y + (opts.boxHeight / 2);
          pdf.text(serial, x + positions.serialX, textY, { baseline: 'middle' });
          
          // Add QR code
          const qrY = y + (opts.boxHeight - positions.qrHeight) / 2;
          
          if (dataUrl) {
            pdf.addImage(dataUrl, 'PNG', x + positions.qrX, qrY, positions.qrWidth, positions.qrHeight);
          }
        });
        
        promises.push(promise);
      }
      
      await Promise.all(promises);
    }
  }
  
  // Add footer if enabled
  if (opts.showFooter !== false) {
    const footerSize = opts.footerFontSize || defaultOptions.footerFontSize;
    const qtyText = opts.customQty || `${data.length}`;
    
    for (let i = 0; i < totalPagesCreated; i++) {
      pdf.setPage(i + 1);
      
      pdf.setFontSize(footerSize);
      pdf.setTextColor(...footerQtyColorRGB);
      try {
        pdf.setFont(font, 'bold');
      } catch {
        pdf.setFont('helvetica', 'bold');
      }
      pdf.text(`Qty. - ${qtyText} each`, 20, pageDims.height - 10);
      
      pdf.setTextColor(...footerInfoColorRGB);
      pdf.text("Serial Number+QR code", pageDims.width - 20, pageDims.height - 20, { align: 'right' });
      pdf.text(`Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm`, pageDims.width - 20, pageDims.height - 10, { align: 'right' });
    }
  }
  
  return pdf.output('blob');
};

const calculateLayout = (options: GenerationOptions) => {
  const pageDims = getPageDimensions(options.pageSize, options.orientation);
  const boxSpacing = options.boxSpacing || 10;
  const rowSpacing = options.rowSpacing || options.boxSpacing || 10;
  
  // Reserve space for footer if enabled
  const footerHeight = options.showFooter !== false ? 30 : 0;
  const availableHeight = pageDims.height - footerHeight;
  
  if (options.boxesPerRow && options.boxesPerColumn) {
    const totalContentHeight = (options.boxesPerColumn * options.boxHeight) + ((options.boxesPerColumn - 1) * rowSpacing);
    const verticalMargin = Math.max(5, (availableHeight - totalContentHeight) / 2);
    
    return {
      boxesPerRow: options.boxesPerRow,
      boxesPerColumn: options.boxesPerColumn,
      boxesPerPage: options.boxesPerRow * options.boxesPerColumn,
      horizontalMargin: (pageDims.width - ((options.boxesPerRow * options.boxWidth) + ((options.boxesPerRow - 1) * boxSpacing))) / 2,
      verticalMargin: verticalMargin
    };
  }
  
  const boxesPerRow = Math.floor((pageDims.width - boxSpacing) / (options.boxWidth + boxSpacing));
  const boxesPerColumn = Math.floor((availableHeight - 10) / (options.boxHeight + rowSpacing));
  
  const totalContentHeight = (boxesPerColumn * options.boxHeight) + ((boxesPerColumn - 1) * rowSpacing);
  const verticalMargin = Math.max(5, (availableHeight - totalContentHeight) / 2);
  
  return {
    boxesPerRow,
    boxesPerColumn,
    boxesPerPage: boxesPerRow * boxesPerColumn,
    horizontalMargin: (pageDims.width - ((boxesPerRow * options.boxWidth) + ((boxesPerRow - 1) * boxSpacing))) / 2,
    verticalMargin: verticalMargin
  };
};

export const generateQRCodeDataURI = async (text: string, options: Partial<GenerationOptions> = {}): Promise<string> => {
  const opts = { ...defaultOptions, ...options };
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M' as QRCode.QRCodeErrorCorrectionLevel,
      margin: 1,
      width: 200,
      color: {
        dark: opts.qrCodeColor || defaultOptions.qrCodeColor!,
        light: opts.qrCodeTransparentBg ? '#0000' : (opts.qrCodeBgColor || defaultOptions.qrCodeBgColor!)
      }
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code data URI:', error);
    return '';
  }
};

export const generateIllustratorLayout = (data: ExcelRow[], options: Partial<GenerationOptions> = {}): string => {
  const opts = { ...defaultOptions, ...options };
  const positions = calculateContentPositions(opts);
  
  const padding = opts.boxSpacing || 10;
  const boxesPerRow = opts.boxesPerRow || 5;
  const rows = Math.ceil(data.length / boxesPerRow);
  
  const svgWidth = (opts.boxWidth + padding) * boxesPerRow + padding;
  const svgHeight = (opts.boxHeight + padding) * rows + padding;
  
  const qrBgFill = opts.qrCodeTransparentBg ? 'transparent' : opts.qrCodeBgColor;
  
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
    
    svgContent += `
      <g transform="translate(${x}, ${y})">
        <rect width="${opts.boxWidth}" height="${opts.boxHeight}" fill="white" stroke="${opts.boxBorderColor}" stroke-width="0.5" />
    `;
    
    if (opts.countOutsideBox) {
      svgContent += `
        <text x="${-5}" y="${opts.boxHeight / 2}" font-family="${opts.fontFamily.includes('custom') ? 'monospace' : opts.fontFamily}" font-size="${opts.fontSize * 1.3}" fill="${opts.countColor}" text-anchor="end" dominant-baseline="middle">
          ${count}.
        </text>
      `;
    }
    
    svgContent += `
      <text x="${positions.serialX}" y="${opts.boxHeight/2}" font-family="${opts.fontFamily.includes('custom') ? 'monospace' : opts.fontFamily}" font-size="${opts.fontSize}" font-weight="bold" text-anchor="start" dominant-baseline="middle" fill="${opts.serialColor}">
        ${serial}
      </text>
    `;
    
    svgContent += `
      <image x="${positions.qrX}" y="${(opts.boxHeight - positions.qrHeight) / 2}" width="${positions.qrWidth}" height="${positions.qrHeight}" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==" />
      </g>
    `;
  });
  
  if (opts.showFooter !== false) {
    const footerSize = opts.footerFontSize || defaultOptions.footerFontSize;
    const qtyText = opts.customQty || `${data.length}`;
    
    svgContent += `
      <text x="20" y="${svgHeight - 20}" font-family="${defaultOptions.fontFamily}" font-size="${footerSize}" fill="${opts.footerQtyColor}" text-anchor="start">
        Qty. - ${qtyText} each
      </text>
      
      <text x="${svgWidth - 20}" y="${svgHeight - 30}" font-family="${defaultOptions.fontFamily}" font-size="${footerSize}" fill="${opts.footerInfoColor}" text-anchor="end">
        Serial Number+QR code
      </text>
      <text x="${svgWidth - 20}" y="${svgHeight - 10}" font-family="${defaultOptions.fontFamily}" font-size="${footerSize}" fill="${opts.footerInfoColor}" text-anchor="end">
        Sticker Size - ${opts.boxWidth} x ${opts.boxHeight}mm
      </text>
    `;
  }
  
  svgContent += `</svg>`;
  return svgContent;
};

export const generateIllustratorFile = async (data: ExcelRow[], format: 'eps' | 'pdf', options: Partial<GenerationOptions> = {}): Promise<Blob> => {
  if (format === 'eps') {
    const epsContent = generateEPSLayout(data, options);
    return new Blob([epsContent], { type: 'application/postscript' });
  } else {
    return generatePDF(data, options);
  }
};

export const downloadIllustratorFiles = async (data: ExcelRow[], format: 'eps' | 'pdf', options: Partial<GenerationOptions> = {}): Promise<void> => {
  const fileBlob = await generateIllustratorFile(data, format, options);
  
  const extension = format.toLowerCase();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `QRCodes_${data.length}_items_${timestamp}.${extension}`;
  
  saveAs(fileBlob, filename);
};

export const generateAllFormatsZip = async (data: ExcelRow[], options: Partial<GenerationOptions> = {}): Promise<void> => {
  const zip = new JSZip();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  try {
    const epsBlob = await generateIllustratorFile(data, 'eps', options);
    zip.file(`QRCodes_${data.length}_items.eps`, epsBlob);
    
    const pdfBlob = await generateIllustratorFile(data, 'pdf', options);
    zip.file(`QRCodes_${data.length}_items.pdf`, pdfBlob);
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, `QRCodes_All_Formats_${timestamp}.zip`);
  } catch (error) {
    console.error('Error generating ZIP with multiple formats:', error);
    throw error;
  }
};
