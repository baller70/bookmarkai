import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface UploadButtonProps {
  bookmarkId: string;
  uploadType: 'favicon' | 'logo' | 'background';
  currentValue?: string;
  onUploadComplete: (url: string) => void;
  onRemove?: () => void;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function UploadButton({
  bookmarkId,
  uploadType,
  currentValue,
  onUploadComplete,
  onRemove,
  children,
  variant = "outline",
  size = "sm",
  className = ""
}: UploadButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
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
    if (!currentValue || !onRemove) return;

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

  const handleClick = () => {
    if (currentValue && onRemove) {
      // If there's a current value, show options to replace or remove
      const action = confirm(`You have a custom ${uploadType} set. Choose:\nOK = Replace with new image\nCancel = Remove current image`);
      if (action) {
        fileInputRef.current?.click();
      } else {
        handleRemove();
      }
    } else {
      // No current value, just open file picker
      fileInputRef.current?.click();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        disabled={isUploading}
        className={className}
      >
        {isUploading ? 'Uploading...' : children}
      </Button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />
    </>
  );
}
