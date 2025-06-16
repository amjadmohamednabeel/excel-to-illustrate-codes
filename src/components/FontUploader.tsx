import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/hooks/use-toast';
import { X, Upload } from 'lucide-react';

interface FontUploaderProps {
  onClose: () => void;
  onFontUploaded?: (fontName: string) => void;
}

const FontUploader: React.FC<FontUploaderProps> = ({ onClose, onFontUploaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFontFile = async (file: File) => {
    const allowedTypes = ['font/woff', 'font/woff2', 'font/ttf', 'font/otf', 'application/font-woff', 'application/font-woff2'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['woff', 'woff2', 'ttf', 'otf'];

    if (!allowedExtensions.includes(fileExtension || '') && !allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a font file (.woff, .woff2, .ttf, or .otf)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Convert font file to base64 immediately
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Create a URL for the uploaded font file for DOM usage
      const fontUrl = URL.createObjectURL(file);
      const fontName = `DENSO-${file.name.split('.')[0]}`;
      
      // Create font-face CSS for immediate DOM usage
      const fontFace = new FontFace(fontName, `url(${fontUrl})`);
      await fontFace.load();
      document.fonts.add(fontFace);

      // Update CSS custom properties for DENSO font
      const style = document.createElement('style');
      style.id = 'denso-custom-font';
      style.textContent = `
        :root {
          --denso-font-family: '${fontName}', 'IBM Plex Mono', 'Roboto Mono', 'Courier New', monospace;
        }
        .font-denso, .font-denso-bold {
          font-family: var(--denso-font-family) !important;
        }
        .denso-corporate-font {
          font-family: '${fontName}' !important;
        }
      `;
      
      // Remove existing custom font style if any
      const existingStyle = document.getElementById('denso-custom-font');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);

      // Store font info in localStorage with base64 data for PDF generation
      localStorage.setItem('denso-custom-font', JSON.stringify({
        name: fontName,
        originalName: file.name,
        base64Data: base64,
        fileType: fileExtension,
        loaded: true
      }));

      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('denso-font-loaded', { 
        detail: { fontName } 
      }));

      toast({
        title: "Success",
        description: `DENSO corporate font "${file.name}" has been loaded successfully`,
      });
      
      // Notify parent component
      if (onFontUploaded) {
        onFontUploaded(fontName);
      }
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load font file. Please check the file format.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFontFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFontFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Upload DENSO Corporate Font</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } transition-colors duration-200 ease-in-out`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-blue-100 p-3">
                <Upload className="h-6 w-6 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your DENSO corporate font file here
                </p>
                <p className="text-xs text-gray-500">
                  Supports .woff, .woff2, .ttf, .otf
                </p>
              </div>
              <div className="pt-2">
                <label htmlFor="font-upload">
                  <Button
                    variant="outline"
                    disabled={isLoading}
                    className="cursor-pointer"
                    asChild
                  >
                    <span>{isLoading ? "Loading..." : "Browse Files"}</span>
                  </Button>
                </label>
                <input
                  id="font-upload"
                  name="font-upload"
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  onChange={handleFileChange}
                  className="sr-only"
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p><strong>Note:</strong> Once uploaded, the DENSO corporate font will be available in the QR code font options.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FontUploader;
