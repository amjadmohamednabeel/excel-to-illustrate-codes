import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { ExcelRow } from '@/utils/excelParser';
import { downloadIllustratorFiles, GenerationOptions } from '@/utils/qrCodeGenerator';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Settings2, Palette } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface QRCodeGeneratorProps {
  data: ExcelRow[];
}

// Updated font options to include the actual DENSO fonts from public directory
const getAvailableFontOptions = () => {
  const baseFonts = [
    { value: 'helvetica', label: 'Helvetica' },
    { value: 'helvetica-bold', label: 'Helvetica Bold' },
    { value: 'times', label: 'Times Roman' },
    { value: 'courier', label: 'Courier' },
    { value: 'denso', label: 'OCR-B (Denso)' },
    { value: 'denso-bold', label: 'OCR-B Bold (Denso Bold)' },
  ];

  // Add the actual DENSO fonts from public directory
  const densoFonts = [
    { value: 'denso-regular', label: 'DENSO Regular' },
    { value: 'denso-bold-real', label: 'DENSO Bold' },
    { value: 'denso-light', label: 'DENSO Light' },
    { value: 'denso-bold-italic', label: 'DENSO Bold Italic' },
    { value: 'denso-light-italic', label: 'DENSO Light Italic' },
  ];

  // Check if custom font was uploaded and add it
  const customFont = localStorage.getItem('denso-custom-font');
  if (customFont) {
    try {
      const fontInfo = JSON.parse(customFont);
      if (fontInfo.loaded) {
        densoFonts.push({ value: 'denso-custom', label: `${fontInfo.originalName} (Custom)` });
      }
    } catch (error) {
      console.error('Error parsing custom font info:', error);
    }
  }

  return [...baseFonts, ...densoFonts];
};

const pageSizes = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'a3', label: 'A3 (297 × 420 mm)' },
  { value: 'letter', label: 'Letter (8.5 × 11 in)' },
  { value: 'custom', label: 'Custom Size' },
];

// Color presets
const colorPresets = {
  boxBorder: ['#FF0000', '#000000', '#0000FF', '#00AA50', '#FFA500', '#800080'],
  countNumber: ['#FF0000', '#000000', '#0000FF', '#FFA500', '#006400', '#800080'],
  serial: ['#000000', '#0000FF', '#006400', '#800080', '#FFA500', '#FF0000'],
  qrCode: ['#000000', '#0000FF', '#006400', '#800080', '#FFA500', '#FF0000'],
  footerQty: ['#FF0000', '#000000', '#0000FF', '#00AA50', '#FFA500', '#800080'],
  footerInfo: ['#00AA50', '#000000', '#0000FF', '#FF0000', '#FFA500', '#800080'],
};

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [fileFormat, setFileFormat] = useState<'eps' | 'pdf'>('pdf');
  const [previewPage, setPreviewPage] = useState(0);
  const [activeTab, setActiveTab] = useState('layout');
  const [fontOptions, setFontOptions] = useState(getAvailableFontOptions());
  
  const [boxWidth, setBoxWidth] = useState(50);
  const [boxHeight, setBoxHeight] = useState(30);
  const [boxSpacing, setBoxSpacing] = useState(10);
  const [qrCodeSize, setQrCodeSize] = useState(60);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fontSize, setFontSize] = useState(9);
  const [pageSize, setPageSize] = useState<string>('a4');
  const [customWidth, setCustomWidth] = useState(210);
  const [customHeight, setCustomHeight] = useState(297);
  const [fontFamily, setFontFamily] = useState('denso-regular'); // Default to DENSO Regular
  const [boxesPerRow, setBoxesPerRow] = useState<number | null>(null);
  const [boxesPerColumn, setBoxesPerColumn] = useState<number | null>(null);
  const [boxesPerPage, setBoxesPerPage] = useState<number>(25);
  const [countOutsideBox, setCountOutsideBox] = useState(true);
  
  const [showFooter, setShowFooter] = useState(true);
  const [customQty, setCustomQty] = useState<string>("");
  const [footerFontSize, setFooterFontSize] = useState(12);

  const [boxBorderColor, setBoxBorderColor] = useState('#FF0000');
  const [countColor, setCountColor] = useState('#FF0000');
  const [serialColor, setSerialColor] = useState('#000000');
  const [qrCodeColor, setQrCodeColor] = useState('#000000');
  const [qrCodeBgColor, setQrCodeBgColor] = useState('#FFFFFF');
  const [footerQtyColor, setFooterQtyColor] = useState('#FF0000');
  const [footerInfoColor, setFooterInfoColor] = useState('#00AA50');

  const [qrCodeTransparentBg, setQrCodeTransparentBg] = useState(true);
  const [useCustomQRDimensions, setUseCustomQRDimensions] = useState(false);
  const [qrCodeWidth, setQrCodeWidth] = useState(18);
  const [qrCodeHeight, setQrCodeHeight] = useState(18);

  useEffect(() => {
    const loadDensoFonts = async () => {
      const fontsToLoad = [
        { name: 'DENSO-Regular', path: '/denso fonts/DENSO-Regular.otf', cssClass: 'denso-regular' },
        { name: 'DENSO-Bold', path: '/denso fonts/DENSO-Bold.otf', cssClass: 'denso-bold-real' },
        { name: 'Denso Light', path: '/denso fonts/Denso Light.otf', cssClass: 'denso-light' },
        { name: 'Denso Bold', path: '/denso fonts/Denso Bold.otf', cssClass: 'denso-bold-real' },
        { name: 'Denso Bold Italic', path: '/denso fonts/Denso Bold Italic.otf', cssClass: 'denso-bold-italic' },
        { name: 'Denso Light Italic', path: '/denso fonts/Denso Light Italic.otf', cssClass: 'denso-light-italic' },
      ];

      let styleContent = '';
      
      for (const font of fontsToLoad) {
        try {
          styleContent += `
            @font-face {
              font-family: '${font.name}';
              src: url('${font.path}') format('opentype');
              font-weight: normal;
              font-style: normal;
            }
            .${font.cssClass} {
              font-family: '${font.name}', 'IBM Plex Mono', 'Roboto Mono', 'Courier New', monospace !important;
            }
          `;
        } catch (error) {
          console.warn(`Could not load font: ${font.name}`, error);
        }
      }

      const styleElement = document.createElement('style');
      styleElement.id = 'denso-public-fonts';
      styleElement.textContent = styleContent;
      
      const existingStyle = document.getElementById('denso-public-fonts');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(styleElement);
    };

    loadDensoFonts();

    const handleCustomFontLoad = () => {
      setFontOptions(getAvailableFontOptions());
    };

    window.addEventListener('denso-font-loaded', handleCustomFontLoad);
    
    return () => {
      window.removeEventListener('denso-font-loaded', handleCustomFontLoad);
    };
  }, []);

  React.useEffect(() => {
    if (boxesPerRow !== null && boxesPerColumn !== null) {
      setBoxesPerPage(boxesPerRow * boxesPerColumn);
      return;
    }

    const pageDimensions = getPageDimensions();
    const maxBoxesInWidth = Math.floor((pageDimensions.width - boxSpacing) / (boxWidth + boxSpacing));
    const maxBoxesInHeight = Math.floor((pageDimensions.height - boxSpacing) / (boxHeight + boxSpacing));
    setBoxesPerPage(maxBoxesInWidth * maxBoxesInHeight);
  }, [boxWidth, boxHeight, boxSpacing, orientation, pageSize, customWidth, customHeight, boxesPerRow, boxesPerColumn]);
  
  const getPageDimensions = () => {
    if (pageSize === 'custom') {
      return orientation === 'portrait' 
        ? { width: customWidth, height: customHeight }
        : { width: customHeight, height: customWidth };
    }
    
    let width, height;
    switch (pageSize) {
      case 'a3':
        width = 297; height = 420;
        break;
      case 'letter':
        width = 215.9; height = 279.4;
        break;
      case 'a4':
      default:
        width = 210; height = 297;
    }
    
    return orientation === 'portrait' 
      ? { width, height }
      : { width: height, height: width };
  };

  const totalPages = Math.ceil(data.length / boxesPerPage);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const options: GenerationOptions = {
        boxWidth,
        boxHeight,
        boxSpacing, 
        qrCodeSize: qrCodeSize / 100, 
        orientation,
        fontSize,
        pageSize: pageSize === 'custom' ? { width: customWidth, height: customHeight } : pageSize as any,
        fontFamily,
        boxesPerRow: boxesPerRow || undefined, 
        boxesPerColumn: boxesPerColumn || undefined, 
        countOutsideBox,
        showFooter,
        customQty: customQty || undefined,
        footerFontSize,
        boxBorderColor,
        countColor,
        serialColor,
        qrCodeColor,
        qrCodeBgColor,
        footerQtyColor,
        footerInfoColor,
        qrCodeTransparentBg,
        qrCodeWidth: useCustomQRDimensions ? qrCodeWidth : undefined,
        qrCodeHeight: useCustomQRDimensions ? qrCodeHeight : undefined,
      };
      
      await downloadIllustratorFiles(data, fileFormat, options);
      toast({
        title: "Success",
        description: `QR codes generated in ${fileFormat.toUpperCase()} format and ready for download`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate QR codes in ${fileFormat.toUpperCase()} format`,
        variant: "destructive",
      });
      console.error("QR code generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
  };
  
  const nextPage = () => {
    if (previewPage < totalPages - 1) {
      setPreviewPage(previewPage + 1);
    }
  };
  
  const prevPage = () => {
    if (previewPage > 0) {
      setPreviewPage(previewPage - 1);
    }
  };
  
  const getCurrentPageItems = () => {
    const start = previewPage * boxesPerPage;
    const end = start + boxesPerPage;
    return data.slice(start, end);
  };

  const resetToDefaults = () => {
    setBoxWidth(50);
    setBoxHeight(30);
    setBoxSpacing(10);
    setQrCodeSize(60);
    setOrientation('portrait');
    setFontSize(9);
    setPageSize('a4');
    setCustomWidth(210);
    setCustomHeight(297);
    setFontFamily('denso-regular');
    setBoxesPerRow(null);
    setBoxesPerColumn(null);
    setCountOutsideBox(true);
    setShowFooter(true);
    setCustomQty("");
    setFooterFontSize(12);
    setBoxBorderColor('#FF0000');
    setCountColor('#FF0000');
    setSerialColor('#000000');
    setQrCodeColor('#000000');
    setQrCodeBgColor('#FFFFFF');
    setFooterQtyColor('#FF0000');
    setFooterInfoColor('#00AA50');
    setQrCodeTransparentBg(true);
    setUseCustomQRDimensions(false);
    setQrCodeWidth(18);
    setQrCodeHeight(18);
  };

  const getDisplayQty = () => {
    return customQty ? customQty : `${data.length}`;
  };

  const ColorPicker = ({ 
    label, 
    value, 
    onChange, 
    presets = colorPresets.boxBorder 
  }: { 
    label: string, 
    value: string, 
    onChange: (color: string) => void, 
    presets?: string[] 
  }) => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label>{label}</Label>
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 border rounded" 
              style={{ backgroundColor: value }}
            />
            <Input 
              type="color" 
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              className="w-8 h-8 p-0 border-0 cursor-pointer"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {presets.map((color, idx) => (
            <button
              key={idx}
              type="button"
              className={`w-5 h-5 rounded-full border ${value === color ? 'ring-2 ring-offset-1 ring-black' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => onChange(color)}
              aria-label={`Set color to ${color}`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Generate QR Codes for Illustrator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex flex-col items-center space-y-2">
          <div className="flex space-x-2 w-full">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={togglePreview} 
              className="mb-2"
            >
              {showPreview ? "Hide Preview" : "Show Layout Preview"}
            </Button>
            
            <Collapsible 
              open={showAdvancedOptions} 
              onOpenChange={setShowAdvancedOptions}
              className="flex-grow"
            >
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="mb-2 ml-auto">
                  <Settings2 className="h-4 w-4 mr-2" />
                  {showAdvancedOptions ? "Hide Options" : "Layout Options"}
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
          
          {showPreview && data.length > 0 && (
            <div className="w-full space-y-2">
              {totalPages > 1 && (
                <div className="flex items-center justify-between mb-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={prevPage} 
                    disabled={previewPage === 0}
                  >
                    Previous Page
                  </Button>
                  <span className="text-sm">
                    Page {previewPage + 1} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={nextPage} 
                    disabled={previewPage === totalPages - 1}
                  >
                    Next Page
                  </Button>
                </div>
              )}
              
              <div className="overflow-auto max-h-[400px] border rounded p-4 w-full">
                <div className="grid gap-4" style={{ 
                  gridTemplateColumns: `repeat(auto-fill, minmax(120px, 1fr))`,
                }}>
                  {getCurrentPageItems().map((row, index) => {
                    const actualIndex = previewPage * boxesPerPage + index;
                    const serial = row['Unit Serial Number'] || row.serialNumber || `unknown-${actualIndex}`;
                    const qrText = row['QR Code Text'] || row.qrCodeText || serial;
                    const count = row['Count'] || row.count || (actualIndex + 1).toString();
                    
                    return (
                      <div key={index} className="relative">
                        <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-xs font-bold" style={{ color: countColor }}>
                          {count}.
                        </div>
                        
                        <div className="border p-2 flex flex-row justify-between items-center" style={{ 
                          width: '120px', 
                          height: '75px',
                          borderColor: boxBorderColor
                        }}>
                          <div className="flex items-center justify-center w-1/2 h-full">
                            <div className="text-xs font-bold text-center" style={{ color: serialColor }}>
                              {serial}
                            </div>
                          </div>
                          
                          <div className="flex justify-center items-center w-1/2 h-full">
                            <QRCodeSVG 
                              value={qrText} 
                              size={40} 
                              fgColor={qrCodeColor}
                              bgColor={qrCodeTransparentBg ? "transparent" : qrCodeBgColor}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {showFooter && (
                <div className="text-center mt-4 text-sm">
                  <span className="font-bold" style={{
                    fontSize: `${footerFontSize}px`,
                    color: footerQtyColor
                  }}>
                    Qty. - {getDisplayQty()} each
                  </span>
                  <span className="float-right font-bold" style={{
                    fontSize: `${footerFontSize}px`,
                    color: footerInfoColor
                  }}>
                    Serial Number+QR code<br />
                    Sticker Size - {boxWidth} x {boxHeight}mm
                  </span>
                </div>
                )}
              </div>
            </div>
          )}

          <Collapsible 
            open={showAdvancedOptions}
            className="w-full border rounded-md p-4 mt-4"
          >
            <CollapsibleContent>
              <Tabs 
                defaultValue="layout" 
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="layout">Layout Settings</TabsTrigger>
                  <TabsTrigger value="colors">
                    <Palette className="h-4 w-4 mr-2" />
                    Color Settings
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="layout" className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Page Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Page Size</Label>
                        <Select value={pageSize} onValueChange={setPageSize}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select page size" />
                          </SelectTrigger>
                          <SelectContent>
                            {pageSizes.map((size) => (
                              <SelectItem key={size.value} value={size.value}>
                                {size.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Orientation</Label>
                        <RadioGroup
                          value={orientation}
                          onValueChange={(value) => setOrientation(value as 'portrait' | 'landscape')}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="portrait" id="portrait" />
                            <Label htmlFor="portrait">Portrait</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="landscape" id="landscape" />
                            <Label htmlFor="landscape">Landscape</Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>

                    {pageSize === 'custom' && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1">
                          <Label htmlFor="custom-width" className="text-xs">Width (mm)</Label>
                          <Input
                            id="custom-width"
                            type="number"
                            min="50"
                            value={customWidth}
                            onChange={(e) => setCustomWidth(Number(e.target.value))}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="custom-height" className="text-xs">Height (mm)</Label>
                          <Input
                            id="custom-height"
                            type="number"
                            min="50"
                            value={customHeight}
                            onChange={(e) => setCustomHeight(Number(e.target.value))}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Box Settings</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Box Width: {boxWidth} mm</Label>
                        </div>
                        <Slider
                          value={[boxWidth]}
                          min={20}
                          max={100}
                          step={1}
                          onValueChange={(value) => setBoxWidth(value[0])}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Box Height: {boxHeight} mm</Label>
                        </div>
                        <Slider
                          value={[boxHeight]}
                          min={15}
                          max={80}
                          step={1}
                          onValueChange={(value) => setBoxHeight(value[0])}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Box Spacing: {boxSpacing} mm</Label>
                      </div>
                      <Slider
                        value={[boxSpacing]}
                        min={5}
                        max={30}
                        step={1}
                        onValueChange={(value) => setBoxSpacing(value[0])}
                      />
                      <p className="text-xs text-gray-500">
                        Space between boxes in layout
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="count-position" className="font-medium">
                          Place Count Outside Box
                        </Label>
                        <Switch
                          id="count-position"
                          checked={countOutsideBox}
                          onCheckedChange={setCountOutsideBox}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        When enabled, the count number will be placed outside the box on the left (recommended)
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 border-t pt-3">
                    <h3 className="text-sm font-medium">Footer Settings</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="show-footer"
                          checked={showFooter}
                          onCheckedChange={(checked) => setShowFooter(checked as boolean)}
                        />
                        <Label htmlFor="show-footer" className="font-medium">
                          Show Footer Information
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500">
                        Enable/disable the footer with quantity and sticker information
                      </p>
                    </div>
                    
                    {showFooter && (
                      <>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="space-y-1">
                            <Label htmlFor="custom-qty" className="text-xs">Custom Quantity Text</Label>
                            <Input
                              id="custom-qty"
                              type="text"
                              placeholder={`${data.length}`}
                              value={customQty}
                              onChange={(e) => setCustomQty(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">
                              Leave blank to use actual count ({data.length})
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label>Footer Font Size: {footerFontSize}pt</Label>
                            </div>
                            <Slider
                              value={[footerFontSize]}
                              min={8}
                              max={16}
                              step={1}
                              onValueChange={(value) => setFooterFontSize(value[0])}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">QR Code & Font Settings</h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="transparent-bg" className="font-medium">
                          Transparent QR Code Background
                        </Label>
                        <Switch
                          id="transparent-bg"
                          checked={qrCodeTransparentBg}
                          onCheckedChange={setQrCodeTransparentBg}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Makes QR code background transparent instead of using a background color
                      </p>
                    </div>
                    
                    <div className="space-y-2 border-t pt-3">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="custom-dimensions" className="font-medium">
                          Use Custom QR Dimensions
                        </Label>
                        <Switch
                          id="custom-dimensions"
                          checked={useCustomQRDimensions}
                          onCheckedChange={setUseCustomQRDimensions}
                        />
                      </div>
                      
                      {useCustomQRDimensions ? (
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          <div className="space-y-1">
                            <Label htmlFor="qr-width" className="text-xs">Width (mm)</Label>
                            <Input
                              id="qr-width"
                              type="number"
                              min="5"
                              max={boxWidth * 0.9}
                              value={qrCodeWidth}
                              onChange={(e) => setQrCodeWidth(Number(e.target.value))}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="qr-height" className="text-xs">Height (mm)</Label>
                            <Input
                              id="qr-height"
                              type="number"
                              min="5"
                              max={boxHeight * 0.9}
                              value={qrCodeHeight}
                              onChange={(e) => setQrCodeHeight(Number(e.target.value))}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <Label>QR Code Size: {qrCodeSize}%</Label>
                          </div>
                          <Slider
                            value={[qrCodeSize]}
                            min={20}
                            max={90}
                            step={5}
                            onValueChange={(value) => setQrCodeSize(value[0])}
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <Label>Font Size: {fontSize}pt</Label>
                        </div>
                        <Slider
                          value={[fontSize]}
                          min={6}
                          max={14}
                          step={1}
                          onValueChange={(value) => setFontSize(value[0])}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Font</Label>
                        <Select value={fontFamily} onValueChange={setFontFamily}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 border-t pt-3">
                    <h3 className="text-sm font-medium">Advanced Layout (Optional)</h3>
                    <p className="text-xs text-gray-500">Manually specify boxes per row/column or leave empty for auto-calculation</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="boxes-per-row" className="text-xs">Boxes Per Row</Label>
                        <Input
                          id="boxes-per-row"
                          type="number"
                          min="1"
                          value={boxesPerRow === null ? '' : boxesPerRow}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            setBoxesPerRow(value);
                          }}
                          placeholder="Auto"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="boxes-per-column" className="text-xs">Boxes Per Column</Label>
                        <Input
                          id="boxes-per-column"
                          type="number"
                          min="1"
                          value={boxesPerColumn === null ? '' : boxesPerColumn}
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            setBoxesPerColumn(value);
                          }}
                          placeholder="Auto"
                        />
                      </div>
                    </div>

                    <div className="mt-2 text-center">
                      <p className="text-sm font-medium">
                        {boxesPerPage} boxes per page ({data.length} items ÷ {boxesPerPage} boxes = {totalPages} pages)
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="colors" className="space-y-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Box & Content Colors</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <ColorPicker
                        label="Box Border Color"
                        value={boxBorderColor}
                        onChange={setBoxBorderColor}
                        presets={colorPresets.boxBorder}
                      />
                      
                      <ColorPicker
                        label="Count Number Color"
                        value={countColor}
                        onChange={setCountColor}
                        presets={colorPresets.countNumber}
                      />
                      
                      <ColorPicker
                        label="Serial Number Color"
                        value={serialColor}
                        onChange={setSerialColor}
                        presets={colorPresets.serial}
                      />
                      
                      <ColorPicker
                        label="QR Code Color"
                        value={qrCodeColor}
                        onChange={setQrCodeColor}
                        presets={colorPresets.qrCode}
                      />
                      
                      {!qrCodeTransparentBg && (
                        <ColorPicker
                          label="QR Code Background"
                          value={qrCodeBgColor}
                          onChange={setQrCodeBgColor}
                          presets={['#FFFFFF', '#F1F1F1', '#FFDEE2', '#E5DEFF', '#D3E4FD', '#F2FCE2']}
                        />
                      )}
                    </div>
                  </div>
                  
                  {showFooter && (
                    <div className="space-y-3 border-t pt-3">
                      <h3 className="text-sm font-medium">Footer Colors</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <ColorPicker
                          label="Quantity Text Color"
                          value={footerQtyColor}
                          onChange={setFooterQtyColor}
                          presets={colorPresets.footerQty}
                        />
                        
                        <ColorPicker
                          label="Info Text Color"
                          value={footerInfoColor}
                          onChange={setFooterInfoColor}
                          presets={colorPresets.footerInfo}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetToDefaults}
                    >
                      Reset All to Defaults
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Choose File Format:</h3>
            <RadioGroup
              value={fileFormat}
              onValueChange={(value) => setFileFormat(value as 'eps' | 'pdf')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="eps" id="eps" />
                <Label htmlFor="eps">EPS Format</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF Format</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || data.length === 0}
            className="w-full"
          >
            {isGenerating ? 
              "Generating..." : 
              `Generate QR Codes (${data.length} items)`
            }
            <Download className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;
