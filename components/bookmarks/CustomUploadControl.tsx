import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image, Camera, Palette } from "lucide-react";
import { toast } from "sonner";

interface CustomUploadControlProps {
  bookmarkId: string;
  uploadType: 'favicon' | 'logo' | 'background';
  currentValue?: string;
  onUploadComplete: (url: string) => void;
  onRemove: () => void;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

export function CustomUploadControl({
  bookmarkId,
  uploadType,
  currentValue,
  onUploadComplete,
  onRemove,
  label,
  description,
  icon
}: CustomUploadControlProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only PNG, JPG, SVG, and WebP images are allowed.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadType', uploadType);
      formData.append('bookmarkId', bookmarkId);

      const response = await fetch('/api/bookmarks/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadComplete(result.data.url);
        toast.success(`Custom ${uploadType} uploaded successfully!`);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`Failed to upload ${uploadType}: ${(error as Error).message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentValue) return;

    try {
      const response = await fetch(
        `/api/bookmarks/upload?uploadType=${uploadType}&bookmarkId=${bookmarkId}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (result.success) {
        onRemove();
        toast.success(`Custom ${uploadType} removed successfully!`);
      } else {
        throw new Error(result.error || 'Remove failed');
      }
    } catch (error) {
      console.error('Remove error:', error);
      toast.error(`Failed to remove ${uploadType}: ${(error as Error).message}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (uploadType) {
      case 'favicon':
        return <Image className="h-4 w-4" />;
      case 'logo':
        return <Camera className="h-4 w-4" />;
      case 'background':
        return <Palette className="h-4 w-4" />;
      default:
        return <Upload className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getIcon()}
              <Label className="text-sm font-medium">{label}</Label>
            </div>
            {currentValue && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
          
          <p className="text-xs text-gray-600">{description}</p>

          {currentValue ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded">
                <div className="w-8 h-8 bg-white border rounded flex items-center justify-center">
                  <img 
                    src={currentValue} 
                    alt={`Custom ${uploadType}`}
                    className="w-6 h-6 object-cover rounded"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                    }}
                  />
                </div>
                <span className="text-sm text-green-700 flex-1 truncate">
                  Custom {uploadType} active
                </span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="h-3 w-3 mr-1" />
                Replace {uploadType}
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                dragOver 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600 mb-1">
                {isUploading ? 'Uploading...' : `Drop ${uploadType} here or click to browse`}
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, SVG, WebP (max 5MB)
              </p>
            </div>
          )}

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  );
}
