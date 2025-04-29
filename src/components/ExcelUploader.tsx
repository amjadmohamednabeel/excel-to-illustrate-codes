
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { parseExcelFile, validateExcelData, ExcelRow } from '@/utils/excelParser';

interface ExcelUploaderProps {
  onDataLoaded: (data: ExcelRow[]) => void;
}

const ExcelUploader: React.FC<ExcelUploaderProps> = ({ onDataLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an Excel file (.xlsx or .xls)",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await parseExcelFile(file);
      const validation = validateExcelData(data);
      
      if (!validation.valid) {
        toast({
          title: "Invalid Excel data",
          description: validation.message,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      toast({
        title: "Success",
        description: `Loaded ${data.length} rows from Excel file`,
      });
      
      onDataLoaded(data);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process Excel file",
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          } transition-colors duration-200 ease-in-out`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-blue-100 p-3">
              <svg
                className="h-6 w-6 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                ></path>
              </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Drag and drop your Excel file here
              </p>
              <p className="text-xs text-gray-500">
                Or click to browse (XLSX or XLS)
              </p>
            </div>
            <div className="pt-4">
              <label htmlFor="file-upload">
                <Button
                  variant="outline"
                  disabled={isLoading}
                  className="cursor-pointer"
                  asChild
                >
                  <span>{isLoading ? "Processing..." : "Browse Files"}</span>
                </Button>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="sr-only"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExcelUploader;
