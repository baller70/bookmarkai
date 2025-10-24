/**
 * Secure Client-Side Storage
 * Encrypted localStorage with XSS protection
 */

import CryptoJS from 'crypto-js';

// Storage configuration
const STORAGE_PREFIX = 'bmhub_';
const ENCRYPTION_KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Generate or retrieve encryption key
function getEncryptionKey(): string {
  // In production, this should be derived from user session or server
  const key = process.env.NEXT_PUBLIC_STORAGE_KEY || 'default-encryption-key-change-in-production';
  
  // Ensure key is proper length
  if (key.length < ENCRYPTION_KEY_LENGTH) {
    return key.padEnd(ENCRYPTION_KEY_LENGTH, '0');
  }
  
  return key.substring(0, ENCRYPTION_KEY_LENGTH);
}

// Data validation schemas
interface StorageItem {
  data: any;
  timestamp: number;
  version: string;
  checksum: string;
}

export class SecureStorage {
  private encryptionKey: string;
  private version: string = '1.0';

  constructor() {
    this.encryptionKey = getEncryptionKey();
  }

  /**
   * Generate checksum for data integrity
   */
  private generateChecksum(data: string): string {
    return CryptoJS.SHA256(data + this.encryptionKey).toString();
  }

  /**
   * Encrypt data with AES
   */
  private encrypt(data: any): string {
    try {
      const jsonString = JSON.stringify(data);
      const iv = CryptoJS.lib.WordArray.random(IV_LENGTH);
      
      const encrypted = CryptoJS.AES.encrypt(jsonString, this.encryptionKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });

      // Combine IV and encrypted data
      const combined = iv.concat(encrypted.ciphertext);
      return combined.toString(CryptoJS.enc.Base64);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt data with AES
   */
  private decrypt(encryptedData: string): any {
    try {
      const combined = CryptoJS.enc.Base64.parse(encryptedData);
      
      // Extract IV and ciphertext
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, IV_LENGTH / 4));
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(IV_LENGTH / 4));

      const decrypted = CryptoJS.AES.decrypt(
        { ciphertext: ciphertext } as any,
        this.encryptionKey,
        {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        }
      );

      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Validate storage item integrity
   */
  private validateItem(item: StorageItem, originalData: string): boolean {
    // Check version compatibility
    if (item.version !== this.version) {
      console.warn('Storage version mismatch');
      return false;
    }

    // Verify checksum
    const expectedChecksum = this.generateChecksum(originalData);
    if (item.checksum !== expectedChecksum) {
      console.error('Storage integrity check failed');
      return false;
    }

    // Check if data is too old (optional expiry)
    const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
    if (Date.now() - item.timestamp > maxAge) {
      console.warn('Stored data has expired');
      return false;
    }

    return true;
  }

  /**
   * Securely store data
   */
  setItem(key: string, value: any): boolean {
    try {
      if (typeof window === 'undefined') {
        console.warn('SecureStorage: localStorage not available');
        return false;
      }

      // Sanitize key
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!sanitizedKey) {
        throw new Error('Invalid storage key');
      }

      const prefixedKey = STORAGE_PREFIX + sanitizedKey;

      // Create storage item
      const storageItem: StorageItem = {
        data: value,
        timestamp: Date.now(),
        version: this.version,
        checksum: '' // Will be set after encryption
      };

      // Encrypt the data
      const encryptedData = this.encrypt(storageItem.data);
      
      // Generate checksum for the encrypted data
      storageItem.checksum = this.generateChecksum(encryptedData);

      // Store the complete item
      const finalItem = {
        ...storageItem,
        data: encryptedData
      };

      localStorage.setItem(prefixedKey, JSON.stringify(finalItem));
      return true;
    } catch (error) {
      console.error('SecureStorage setItem failed:', error);
      return false;
    }
  }

  /**
   * Securely retrieve data
   */
  getItem<T = any>(key: string): T | null {
    try {
      if (typeof window === 'undefined') {
        console.warn('SecureStorage: localStorage not available');
        return null;
      }

      // Sanitize key
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!sanitizedKey) {
        throw new Error('Invalid storage key');
      }

      const prefixedKey = STORAGE_PREFIX + sanitizedKey;
      const storedData = localStorage.getItem(prefixedKey);

      if (!storedData) {
        return null;
      }

      // Parse stored item
      const storageItem: StorageItem = JSON.parse(storedData);

      // Validate item integrity
      if (!this.validateItem(storageItem, storageItem.data)) {
        // Remove corrupted data
        this.removeItem(key);
        return null;
      }

      // Decrypt and return data
      const decryptedData = this.decrypt(storageItem.data);
      return decryptedData as T;
    } catch (error) {
      console.error('SecureStorage getItem failed:', error);
      // Remove corrupted data
      this.removeItem(key);
      return null;
    }
  }

  /**
   * Remove stored data
   */
  removeItem(key: string): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const sanitizedKey = key.replace(/[^a-zA-Z0-9_-]/g, '');
      if (!sanitizedKey) {
        return false;
      }

      const prefixedKey = STORAGE_PREFIX + sanitizedKey;
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.error('SecureStorage removeItem failed:', error);
      return false;
    }
  }

  /**
   * Clear all secure storage data
   */
  clear(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const keysToRemove: string[] = [];
      
      // Find all keys with our prefix
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      // Remove all our keys
      keysToRemove.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('SecureStorage clear failed:', error);
      return false;
    }
  }

  /**
   * Get storage usage statistics
   */
  getStorageInfo(): {
    itemCount: number;
    totalSize: number;
    keys: string[];
  } {
    const info = {
      itemCount: 0,
      totalSize: 0,
      keys: [] as string[]
    };

    try {
      if (typeof window === 'undefined') {
        return info;
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(STORAGE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            info.itemCount++;
            info.totalSize += value.length;
            info.keys.push(key.substring(STORAGE_PREFIX.length));
          }
        }
      }
    } catch (error) {
      console.error('SecureStorage getStorageInfo failed:', error);
    }

    return info;
  }

  /**
   * Check if storage is available and working
   */
  isAvailable(): boolean {
    try {
      if (typeof window === 'undefined') {
        return false;
      }

      const testKey = STORAGE_PREFIX + 'test';
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return retrieved === testValue;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const secureStorage = new SecureStorage();

// Utility functions for common use cases
export const secureStorageUtils = {
  /**
   * Store user preferences securely
   */
  setUserPreferences(preferences: any): boolean {
    return secureStorage.setItem('user_preferences', preferences);
  },

  /**
   * Get user preferences
   */
  getUserPreferences<T = any>(): T | null {
    return secureStorage.getItem<T>('user_preferences');
  },

  /**
   * Store session data securely
   */
  setSessionData(sessionData: any): boolean {
    return secureStorage.setItem('session_data', sessionData);
  },

  /**
   * Get session data
   */
  getSessionData<T = any>(): T | null {
    return secureStorage.getItem<T>('session_data');
  },

  /**
   * Clear all user data
   */
  clearUserData(): boolean {
    return secureStorage.clear();
  },
};
