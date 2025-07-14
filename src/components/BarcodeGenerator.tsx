import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ExcelRow } from '@/utils/excelParser';
import { downloadBarcodePDF, BarcodeOptions, defaultBarcodeOptions, generateBarcodeDataURI } from '@/utils/barcodeGenerator';
import { useToast } from '@/hooks/use-toast';
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface BarcodeGeneratorProps {
  data: ExcelRow[];
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ data }) => {
  const [options, setOptions] = useState<BarcodeOptions>(defaultBarcodeOptions);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const pageSizes = [
    { value: 'A4', label: 'A4' },
    { value: 'A3', label: 'A3' },
    { value: 'Letter', label: 'Letter' }
  ];

  // Calculate preview layout
  const getPreviewLayout = () => {
    const pageDimensions = options.pageSize === 'A4' 
      ? { width: 210, height: 297 }
      : options.pageSize === 'A3'
      ? { width: 297, height: 420 }
      : { width: 216, height: 279 };

    if (options.orientation === 'landscape') {
      [pageDimensions.width, pageDimensions.height] = [pageDimensions.height, pageDimensions.width];
    }

    const availableWidth = pageDimensions.width - (options.margin * 2);
    const availableHeight = pageDimensions.height - (options.margin * 2);
    const boxesPerRow = Math.floor(availableWidth / options.boxWidth);
    const boxesPerColumn = Math.floor(availableHeight / options.boxHeight);
    const boxesPerPage = boxesPerRow * boxesPerColumn;

    return { boxesPerRow, boxesPerColumn, boxesPerPage, pageDimensions };
  };

  const { boxesPerRow, boxesPerPage } = getPreviewLayout();
  const totalPages = Math.ceil(data.length / boxesPerPage);

  const getCurrentPageItems = () => {
    const startIndex = currentPage * boxesPerPage;
    const endIndex = Math.min(startIndex + boxesPerPage, data.length);
    return data.slice(startIndex, endIndex);
  };

  const generatePreviewImages = async () => {
    try {
      const images: string[] = [];
      for (const item of getCurrentPageItems()) {
        const gtin = item.gtin || item.GTIN || '';
        if (gtin) {
          const imageUri = await generateBarcodeDataURI(gtin);
          images.push(imageUri);
        } else {
          images.push('');
        }
      }
      setPreviewImages(images);
    } catch (error) {
      console.error('Error generating preview images:', error);
    }
  };

  useEffect(() => {
    if (showPreview) {
      generatePreviewImages();
    }
  }, [showPreview, currentPage, data]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await downloadBarcodePDF(data, options);
      toast({
        title: "Success",
        description: "Barcode PDF has been generated and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate barcode PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    if (!showPreview) {
      setCurrentPage(0);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Barcode Generator</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={togglePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div 
              className="border rounded-lg p-4 bg-white"
              style={{
                aspectRatio: options.orientation === 'portrait' ? '210/297' : '297/210',
                maxHeight: '400px'
              }}
            >
              <div 
                className="grid gap-1 h-full"
                style={{
                  gridTemplateColumns: `repeat(${boxesPerRow}, 1fr)`,
                }}
              >
                {getCurrentPageItems().map((item, index) => {
                  const no = item.no || item['No.'] || '';
                  const description = item.description || item.Description || '';
                  const gtin = item.gtin || item.GTIN || '';
                  
                  return (
                    <div
                      key={index}
                      className="border border-gray-200 flex flex-col items-center justify-center p-1 text-center"
                      style={{ fontSize: '6px', minHeight: '40px' }}
                    >
                      {no && <div className="font-semibold">{no}</div>}
                      {description && (
                        <div className="text-xs truncate w-full" title={description}>
                          {description.length > 15 ? description.substring(0, 15) + '...' : description}
                        </div>
                      )}
                      {previewImages[index] && (
                        <img 
                          src={previewImages[index]} 
                          alt="Barcode" 
                          className="max-w-full h-4 object-contain"
                        />
                      )}
                      {gtin && <div className="text-xs">{gtin}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pageSize">Page Size</Label>
            <Select
              value={options.pageSize}
              onValueChange={(value: 'A4' | 'A3' | 'Letter') =>
                setOptions({ ...options, pageSize: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
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
            <Label htmlFor="orientation">Orientation</Label>
            <Select
              value={options.orientation}
              onValueChange={(value: 'portrait' | 'landscape') =>
                setOptions({ ...options, orientation: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Portrait</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fontSize">Font Size (pt)</Label>
            <Input
              id="fontSize"
              type="number"
              step="0.1"
              value={options.fontSize}
              onChange={(e) =>
                setOptions({ ...options, fontSize: parseFloat(e.target.value) || 6.667 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boxWidth">Box Width (mm)</Label>
            <Input
              id="boxWidth"
              type="number"
              value={options.boxWidth}
              onChange={(e) =>
                setOptions({ ...options, boxWidth: parseFloat(e.target.value) || 50 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="boxHeight">Box Height (mm)</Label>
            <Input
              id="boxHeight"
              type="number"
              value={options.boxHeight}
              onChange={(e) =>
                setOptions({ ...options, boxHeight: parseFloat(e.target.value) || 25 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcodeWidth">Barcode Width (mm)</Label>
            <Input
              id="barcodeWidth"
              type="number"
              step="0.1"
              value={options.barcodeWidth}
              onChange={(e) =>
                setOptions({ ...options, barcodeWidth: parseFloat(e.target.value) || 36.6 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcodeHeight">Barcode Height (mm)</Label>
            <Input
              id="barcodeHeight"
              type="number"
              step="0.1"
              value={options.barcodeHeight}
              onChange={(e) =>
                setOptions({ ...options, barcodeHeight: parseFloat(e.target.value) || 10.6 })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="margin">Page Margin (mm)</Label>
            <Input
              id="margin"
              type="number"
              value={options.margin}
              onChange={(e) =>
                setOptions({ ...options, margin: parseFloat(e.target.value) || 10 })
              }
            />
          </div>
        </div>

        <Separator />

        <div className="flex justify-center">
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || data.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Barcode PDF'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BarcodeGenerator;