import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { ExcelRow } from '@/utils/excelParser';
import { downloadIllustratorFiles, GenerationOptions } from '@/utils/qrCodeGenerator';
import { QRCodeSVG } from 'qrcode.react';
import { Download, Settings2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface QRCodeGeneratorProps {
  data: ExcelRow[];
}

const fontOptions = [
  { value: 'helvetica', label: 'Helvetica' },
  { value: 'helvetica-bold', label: 'Helvetica Bold' },
  { value: 'times', label: 'Times Roman' },
  { value: 'courier', label: 'Courier' },
];

const pageSizes = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'a3', label: 'A3 (297 × 420 mm)' },
  { value: 'letter', label: 'Letter (8.5 × 11 in)' },
  { value: 'custom', label: 'Custom Size' },
];

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ data }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [fileFormat, setFileFormat] = useState<'svg' | 'eps' | 'pdf'>('pdf');
  const [previewPage, setPreviewPage] = useState(0);
  
  // Layout options
  const [boxWidth, setBoxWidth] = useState(50); // Default box width in mm
  const [boxHeight, setBoxHeight] = useState(30); // Default box height in mm
  const [boxSpacing, setBoxSpacing] = useState(10); // Default spacing between boxes in mm
  const [qrCodeSize, setQrCodeSize] = useState(60); // Default QR code size percentage (60% of box height)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [fontSize, setFontSize] = useState(9); // Default font size
  const [pageSize, setPageSize] = useState<string>('a4'); // Default page size
  const [customWidth, setCustomWidth] = useState(210); // Default custom width in mm
  const [customHeight, setCustomHeight] = useState(297); // Default custom height in mm
  const [fontFamily, setFontFamily] = useState('helvetica-bold'); // Default font
  const [boxesPerRow, setBoxesPerRow] = useState<number | null>(null); // Auto-calculate by default
  const [boxesPerColumn, setBoxesPerColumn] = useState<number | null>(null); // Auto-calculate by default
  const [boxesPerPage, setBoxesPerPage] = useState<number>(25);
  const [countOutsideBox, setCountOutsideBox] = useState(true); // Default to true as per image
  
  // Footer options (new)
  const [showFooter, setShowFooter] = useState(true); // Whether to show the footer
  const [customQty, setCustomQty] = useState<string>(""); // Custom quantity value
  const [footerFontSize, setFooterFontSize] = useState(12); // Footer font size in pt

  // Calculate boxes per page based on current settings
  React.useEffect(() => {
    // If manual boxes per row/column are set, use those values
    if (boxesPerRow !== null && boxesPerColumn !== null) {
      setBoxesPerPage(boxesPerRow * boxesPerColumn);
      return;
    }

    // Otherwise calculate automatically based on page size and box dimensions
    const pageDimensions = getPageDimensions();
    
    // Calculate max boxes that can fit in each dimension with spacing
    const maxBoxesInWidth = Math.floor((pageDimensions.width - boxSpacing) / (boxWidth + boxSpacing));
    const maxBoxesInHeight = Math.floor((pageDimensions.height - boxSpacing) / (boxHeight + boxSpacing));
    
    // Update calculated values
    setBoxesPerPage(maxBoxesInWidth * maxBoxesInHeight);
  }, [boxWidth, boxHeight, boxSpacing, orientation, pageSize, customWidth, customHeight, boxesPerRow, boxesPerColumn]);
  
  // Get current page dimensions in mm based on settings
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
        showFooter, // Add footer visibility option
        customQty: customQty || undefined, // Add custom quantity value
        footerFontSize, // Add footer font size
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
  
  // Navigate preview pages
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
  
  // Get items for current preview page
  const getCurrentPageItems = () => {
    const start = previewPage * boxesPerPage;
    const end = start + boxesPerPage;
    return data.slice(start, end);
  };

  // Reset box layout to default values
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
    setFontFamily('helvetica-bold');
    setBoxesPerRow(null);
    setBoxesPerColumn(null);
    setCountOutsideBox(true); // Match the image's layout
    // Add footer option resets
    setShowFooter(true);
    setCustomQty("");
    setFooterFontSize(12);
  };

  // Get actual quantity to display
  const getDisplayQty = () => {
    return customQty ? customQty : `${data.length}`;
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
                        {/* Count number outside the box in red */}
                        <div className="absolute -left-6 top-1/2 transform -translate-y-1/2 text-red-500 text-xs font-bold">
                          {count}.
                        </div>
                        
                        {/* Box with thin red border */}
                        <div className="border border-red-500 p-2 flex flex-row justify-between items-center" style={{ width: '120px', height: '75px' }}>
                          {/* Serial number centered in left half */}
                          <div className="flex items-center justify-center w-1/2 h-full">
                            <div className="text-xs font-bold text-center">{serial}</div>
                          </div>
                          
                          {/* QR code centered in right half */}
                          <div className="flex justify-center items-center w-1/2 h-full">
                            <QRCodeSVG value={qrText} size={40} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {showFooter && (
                <div className="text-center mt-4 text-sm">
                  <span className="text-red-500 font-bold" style={{fontSize: `${footerFontSize}px`}}>
                    Qty. - {getDisplayQty()} each
                  </span>
                  <span className="float-right text-green-600 font-bold" style={{fontSize: `${footerFontSize}px`}}>
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
              <div className="space-y-6">
                {/* Page Settings */}
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

                {/* Box Settings */}
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

                  {/* Box Spacing Setting */}
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

                  {/* Count Position Setting */}
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

                {/* Footer Settings (NEW) */}
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

                {/* QR Code Settings */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">QR Code & Font Settings</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
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
                
                {/* Advanced Layout Settings */}
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
                  
                  <div className="flex justify-center mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={resetToDefaults}
                    >
                      Reset to Defaults
                    </Button>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Choose File Format:</h3>
            <RadioGroup
              value={fileFormat}
              onValueChange={(value) => setFileFormat(value as 'svg' | 'eps' | 'pdf')}
              className="flex space-x-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="svg" id="svg" />
                <Label htmlFor="svg">SVG Format</Label>
              </div>
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
          
          <div className="bg-blue-50 p-3 rounded text-sm">
            <p className="font-medium text-blue-700">Format Details:</p>
            <ul className="list-disc list-inside text-blue-600 mt-1 space-y-1">
              {fileFormat === 'eps' && (
                <>
                  <li>EPS files with {boxWidth}mm × {boxHeight}mm boxes and {boxSpacing}mm spacing</li>
                  <li>Count numbers displayed outside each box in red</li>
                  <li>QR codes positioned on the right side</li>
                  <li>Serial numbers centered on the left side</li>
                </>
              )}
              {fileFormat === 'pdf' && (
                <>
                  <li>{pageSize === 'custom' ? 'Custom size' : pageSizes.find(p => p.value === pageSize)?.label} PDF in {orientation} orientation</li>
                  <li>Up to {boxesPerPage} QR codes per page with {boxSpacing}mm spacing</li>
                  <li>Count numbers displayed outside each box in red</li>
                  <li>Serial numbers centered in each box's left half</li>
                  <li>{boxWidth}mm × {boxHeight}mm sticker size</li>
                </>
              )}
              {fileFormat === 'svg' && (
                <>
                  <li>SVG files with count numbers outside each box</li>
                  <li>All boxes separated with {boxSpacing}mm spacing</li>
                  <li>Serial numbers and QR codes properly centered</li>
                  <li>{boxWidth}mm × {boxHeight}mm sticker size with thin red border</li>
                </>
              )}
            </ul>
          </div>
          
          <p className="text-sm text-gray-500 mt-2">
            {fileFormat === 'pdf' ? 
              `You will receive a single PDF file with all ${data.length} QR codes in a layout${data.length > boxesPerPage ? ` across ${totalPages} pages` : ''}.` : 
              'You will receive a ZIP file containing:'}
          </p>
          {fileFormat !== 'pdf' && (
            <ul className="list-disc list-inside text-sm text-gray-500 ml-4">
              <li>Individual QR code {fileFormat.toUpperCase()} files for each row</li>
              <li>A complete layout in {fileFormat.toUpperCase()} format with all QR codes arranged</li>
            </ul>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || data.length === 0}
          className="w-full"
        >
          {isGenerating ? "Generating..." : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Download QR Codes in {fileFormat.toUpperCase()} Format
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default QRCodeGenerator;
