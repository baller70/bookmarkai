/**
 * Secure File Upload Handler
 * Path traversal prevention and file validation
 */

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { FileUploadSchema, InputSanitizer } from './input-validation';

// File type validation
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.gif'
] as const;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const UPLOAD_BASE_PATH = 'uploads'; // Base upload directory

// File validation result
interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedName?: string;
  detectedType?: string;
}

// Secure upload configuration
interface SecureUploadConfig {
  userId: string;
  uploadType: 'favicon' | 'logo' | 'background' | 'avatar';
  entityId?: string; // bookmark ID, folder ID, etc.
  maxSize?: number;
  allowedTypes?: readonly string[];
}

export class SecureFileUploadHandler {
  /**
   * Validate file before upload
   */
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];

    // Basic file validation using schema
    const schemaResult = FileUploadSchema.safeParse({
      name: file.name,
      size: file.size,
      type: file.type
    });

    if (!schemaResult.success) {
      errors.push(...schemaResult.error.errors.map(e => e.message));
    }

    // Additional security checks
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size exceeds limit (${MAX_FILE_SIZE / 1024 / 1024}MB)`);
    }

    if (file.size === 0) {
      errors.push('File is empty');
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      errors.push(`Invalid file type: ${file.type}`);
    }

    // Validate file extension
    const extension = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension as any)) {
      errors.push(`Invalid file extension: ${extension}`);
    }

    // Check for double extensions (potential bypass attempt)
    const fileName = path.basename(file.name, extension);
    if (fileName.includes('.')) {
      errors.push('Multiple file extensions not allowed');
    }

    // Sanitize filename
    const sanitizedName = InputSanitizer.sanitizeFilename(file.name);
    if (!sanitizedName || sanitizedName.length === 0) {
      errors.push('Invalid filename');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedName,
      detectedType: file.type
    };
  }

  /**
   * Generate secure file path
   */
  static generateSecureFilePath(config: SecureUploadConfig, originalFilename: string): {
    success: boolean;
    filePath?: string;
    fileName?: string;
    error?: string;
  } {
    try {
      // Validate user ID
      const userIdValidation = z.string().uuid().safeParse(config.userId);
      if (!userIdValidation.success) {
        return { success: false, error: 'Invalid user ID' };
      }

      // Validate upload type
      const uploadTypeValidation = z.enum(['favicon', 'logo', 'background', 'avatar']).safeParse(config.uploadType);
      if (!uploadTypeValidation.success) {
        return { success: false, error: 'Invalid upload type' };
      }

      // Sanitize original filename
      const sanitizedOriginal = InputSanitizer.sanitizeFilename(originalFilename);
      if (!sanitizedOriginal) {
        return { success: false, error: 'Invalid filename' };
      }

      // Generate unique filename
      const extension = path.extname(sanitizedOriginal).toLowerCase();
      const uniqueFileName = `${uuidv4()}${extension}`;

      // Build secure path components
      const pathComponents = [
        UPLOAD_BASE_PATH,
        config.userId,
        config.uploadType
      ];

      // Add entity ID if provided (e.g., bookmark ID)
      if (config.entityId) {
        const entityIdValidation = z.string().uuid().safeParse(config.entityId);
        if (entityIdValidation.success) {
          pathComponents.push(config.entityId);
        }
      }

      pathComponents.push(uniqueFileName);

      // Join path components
      const filePath = path.join(...pathComponents);

      // Normalize path to prevent traversal
      const normalizedPath = path.normalize(filePath);

      // Ensure path is within allowed directory
      if (!normalizedPath.startsWith(UPLOAD_BASE_PATH + path.sep)) {
        return { success: false, error: 'Invalid file path' };
      }

      // Ensure no parent directory references
      if (normalizedPath.includes('..')) {
        return { success: false, error: 'Path traversal attempt detected' };
      }

      return {
        success: true,
        filePath: normalizedPath,
        fileName: uniqueFileName
      };
    } catch (error) {
      return { success: false, error: 'Failed to generate secure path' };
    }
  }

  /**
   * Validate file content (basic magic number check)
   */
  static async validateFileContent(file: File): Promise<{
    isValid: boolean;
    detectedType?: string;
    error?: string;
  }> {
    try {
      // Read first few bytes to check magic numbers
      const buffer = await file.slice(0, 12).arrayBuffer();
      const bytes = new Uint8Array(buffer);

      // Check magic numbers for common image types
      const magicNumbers = {
        'image/jpeg': [0xFF, 0xD8, 0xFF],
        'image/png': [0x89, 0x50, 0x4E, 0x47],
        'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF
        'image/gif': [0x47, 0x49, 0x46], // GIF
      };

      let detectedType: string | undefined;

      for (const [mimeType, signature] of Object.entries(magicNumbers)) {
        if (signature.every((byte, index) => bytes[index] === byte)) {
          detectedType = mimeType;
          break;
        }
      }

      // Special case for WebP (needs additional check)
      if (detectedType === 'image/webp') {
        // Check for WEBP signature at offset 8
        const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
        const hasWebpSignature = webpSignature.every((byte, index) => bytes[8 + index] === byte);
        if (!hasWebpSignature) {
          detectedType = undefined;
        }
      }

      if (!detectedType) {
        return { isValid: false, error: 'File content does not match expected image format' };
      }

      // Verify detected type matches declared type
      if (detectedType !== file.type) {
        return { 
          isValid: false, 
          error: `File content (${detectedType}) does not match declared type (${file.type})` 
        };
      }

      return { isValid: true, detectedType };
    } catch (error) {
      return { isValid: false, error: 'Failed to validate file content' };
    }
  }

  /**
   * Complete secure file validation
   */
  static async validateFileSecurely(file: File, config: SecureUploadConfig): Promise<{
    isValid: boolean;
    errors: string[];
    secureFilePath?: string;
    fileName?: string;
  }> {
    const errors: string[] = [];

    // Basic file validation
    const basicValidation = this.validateFile(file);
    if (!basicValidation.isValid) {
      errors.push(...basicValidation.errors);
    }

    // Content validation
    const contentValidation = await this.validateFileContent(file);
    if (!contentValidation.isValid) {
      errors.push(contentValidation.error || 'Content validation failed');
    }

    // Path generation
    const pathResult = this.generateSecureFilePath(config, file.name);
    if (!pathResult.success) {
      errors.push(pathResult.error || 'Path generation failed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      secureFilePath: pathResult.filePath,
      fileName: pathResult.fileName
    };
  }

  /**
   * Get file URL for serving (with security checks)
   */
  static getSecureFileUrl(filePath: string, userId: string): string | null {
    try {
      // Normalize path
      const normalizedPath = path.normalize(filePath);

      // Ensure path is within uploads directory
      if (!normalizedPath.startsWith(UPLOAD_BASE_PATH + path.sep)) {
        return null;
      }

      // Ensure path contains user ID (basic access control)
      if (!normalizedPath.includes(userId)) {
        return null;
      }

      // Ensure no path traversal
      if (normalizedPath.includes('..')) {
        return null;
      }

      // Return secure URL (would be served through a secure endpoint)
      return `/api/files/secure/${encodeURIComponent(normalizedPath)}`;
    } catch {
      return null;
    }
  }
}

// Export types and constants
export type { SecureUploadConfig, FileValidationResult };
export { ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE };
