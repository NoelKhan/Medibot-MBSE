import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { createLogger } from './Logger';

const logger = createLogger('FileUploadService');

export interface FileUpload {
  uri: string;
  name: string;
  type: string;
  size: number;
  mimeType?: string;
}

export interface FileUploadResult {
  success: boolean;
  file?: FileUpload;
  error?: string;
}

export class FileUploadService {
  // Supported file types for medical chat - more comprehensive list
  private static readonly SUPPORTED_TYPES = [
    'image/*',
    'application/pdf',
    'text/*',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.oasis.opendocument.presentation',
    'audio/*',
    'video/*',
  ];

  // Maximum file size (10MB - increased for medical files)
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024;

  static async pickDocument(): Promise<FileUploadResult> {
    try {
      // Use more flexible options to allow various apps to open
      const pickerOptions: DocumentPicker.DocumentPickerOptions = {
        type: '*/*', // Allow all file types initially - let the user's device handle app selection
        copyToCacheDirectory: true,
        multiple: false,
      };

      const result = await DocumentPicker.getDocumentAsync(pickerOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: 'File selection cancelled' };
      }

      const asset = result.assets[0];
      if (!asset || !asset.uri) {
        return { success: false, error: 'No file selected' };
      }

      // Get file info for validation
      let fileInfo: FileSystem.FileInfo | null = null;
      try {
        fileInfo = await FileSystem.getInfoAsync(asset.uri);
      } catch (infoError) {
        logger.warn('Could not get file info, using asset info', infoError);
        // Use asset info as fallback
      }

      const finalSize = asset.size || (fileInfo && 'size' in fileInfo ? fileInfo.size : 0) || 0;

      // Validate file size
      if (finalSize && finalSize > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File too large. Maximum size is ${this.formatFileSize(this.MAX_FILE_SIZE)}`,
        };
      }

      const fileUpload: FileUpload = {
        uri: asset.uri,
        name: asset.name,
        type: this.getFileType(asset.name),
        size: asset.size || 0,
        mimeType: asset.mimeType,
      };

      return { success: true, file: fileUpload };
    } catch (error) {
      logger.error('Error picking document', error);
      return {
        success: false,
        error: 'Failed to select file. Please try again.',
      };
    }
  }

  static async pickImage(): Promise<FileUploadResult> {
    try {
      const pickerOptions: DocumentPicker.DocumentPickerOptions = {
        type: 'image/*',
        copyToCacheDirectory: true,
        multiple: false,
      };

      const result = await DocumentPicker.getDocumentAsync(pickerOptions);

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: 'Image selection cancelled' };
      }

      const asset = result.assets[0];
      if (!asset || !asset.uri) {
        return { success: false, error: 'No image selected' };
      }

      // Validate file size
      if (asset.size && asset.size > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `Image too large. Maximum size is ${this.formatFileSize(this.MAX_FILE_SIZE)}`,
        };
      }

      const fileUpload: FileUpload = {
        uri: asset.uri,
        name: asset.name,
        type: 'image',
        size: asset.size || 0,
        mimeType: asset.mimeType,
      };

      return { success: true, file: fileUpload };
    } catch (error) {
      logger.error('Error picking image', error);
      return {
        success: false,
        error: 'Failed to select image. Please try again.',
      };
    }
  }

  static async validateFile(file: FileUpload): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Check if file exists
      const fileInfo = await (FileSystem as any).getInfoAsync(file.uri);
      if (!fileInfo.exists) {
        return { isValid: false, error: 'File does not exist' };
      }

      // Check file size
      if (fileInfo.size && fileInfo.size > this.MAX_FILE_SIZE) {
        return {
          isValid: false,
          error: `File too large. Maximum size is ${this.formatFileSize(this.MAX_FILE_SIZE)}`,
        };
      }

      // Check file type
      if (!this.isSupportedFileType(file.name)) {
        return {
          isValid: false,
          error: 'Unsupported file type. Please select an image, PDF, or document file.',
        };
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Error validating file', error);
      return { isValid: false, error: 'Failed to validate file' };
    }
  }

  static getFileType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp':
      case 'svg':
      case 'tiff':
      case 'tif':
        return 'image';
      case 'pdf':
        return 'document';
      case 'doc':
      case 'docx':
      case 'rtf':
      case 'odt':
        return 'document';
      case 'xls':
      case 'xlsx':
      case 'ods':
        return 'spreadsheet';
      case 'ppt':
      case 'pptx':
      case 'odp':
        return 'presentation';
      case 'txt':
      case 'md':
      case 'csv':
        return 'text';
      case 'mp3':
      case 'wav':
      case 'm4a':
      case 'aac':
      case 'ogg':
      case 'flac':
        return 'audio';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
      case 'webm':
        return 'video';
      case 'zip':
      case 'rar':
      case '7z':
        return 'archive';
      default:
        return 'file';
    }
  }

  private static isSupportedFileType(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const supportedExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
      'pdf', 'doc', 'docx', 'txt',
    ];
    
    return extension ? supportedExtensions.includes(extension) : false;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getFileIcon(fileType: string): string {
    switch (fileType) {
      case 'image':
        return 'image';
      case 'document':
        return 'description';
      case 'text':
        return 'text-snippet';
      case 'audio':
        return 'audiotrack';
      default:
        return 'attach-file';
    }
  }

  static async readFileAsBase64(uri: string): Promise<string | null> {
    try {
      const base64 = await (FileSystem as any).readAsStringAsync(uri, {
        encoding: 'base64',
      });
      return base64;
    } catch (error) {
      logger.error('Error reading file as base64', error);
      return null;
    }
  }



  // Enhanced picker with better app integration and Expo Go compatibility
  static async pickFileWithOptions(): Promise<FileUploadResult> {
    try {
      // Use broader file types to allow Google Drive and other cloud storage apps
      const pickerOptions: DocumentPicker.DocumentPickerOptions = {
        type: '*/*', // Allow all file types for app compatibility
        copyToCacheDirectory: true,
        multiple: false,
      };

      let result = await DocumentPicker.getDocumentAsync(pickerOptions);

      // If cancelled, don't try alternatives
      if (result.canceled) {
        return { success: false, error: 'File selection cancelled' };
      }

      // If no assets, try a more basic approach
      if (!result.assets || result.assets.length === 0) {
        // Fallback for Expo Go - very simple picker
        try {
          result = await DocumentPicker.getDocumentAsync({
            type: 'image/*', // Start with just images for Expo Go compatibility
            copyToCacheDirectory: false, // Don't copy to cache to prevent crashes
            multiple: false,
          });
        } catch (fallbackError) {
          logger.error('Fallback picker error', fallbackError);
          return { 
            success: false, 
            error: 'File picker not available in Expo Go. Please use a standalone build for full file support.' 
          };
        }

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return { success: false, error: 'No file selected' };
        }
      }

      const asset = result.assets[0];
      if (!asset || !asset.uri) {
        return { success: false, error: 'Invalid file selected' };
      }

      // Get file info for validation
      let fileInfo: FileSystem.FileInfo | null = null;
      try {
        fileInfo = await FileSystem.getInfoAsync(asset.uri);
      } catch (infoError) {
        logger.warn('Could not get file info, using asset info', infoError);
      }

      const finalSize = asset.size || (fileInfo && 'size' in fileInfo ? fileInfo.size : 0) || 0;

      // Validate file size
      if (finalSize && finalSize > this.MAX_FILE_SIZE) {
        return {
          success: false,
          error: `File too large. Maximum size is ${this.formatFileSize(this.MAX_FILE_SIZE)}`,
        };
      }

      // Post-validation check for supported types
      const isSupportedType = this.isSupportedFileType(asset.name);
      if (!isSupportedType) {
        // Allow anyway but warn user
        logger.warn('File type may not be fully supported', { fileName: asset.name });
      }

      const fileUpload: FileUpload = {
        uri: asset.uri,
        name: asset.name,
        type: this.getFileType(asset.name),
        size: finalSize,
        mimeType: asset.mimeType,
      };

      return { success: true, file: fileUpload };
    } catch (error) {
      logger.error('Error in enhanced file picker', error);
      return {
        success: false,
        error: 'Failed to select file. Please ensure you have a compatible file manager app installed.',
      };
    }
  }

  static async copyFileToAppDirectory(uri: string, fileName: string): Promise<string | null> {
    try {
      const documentsDir = (FileSystem as any).documentDirectory;
      if (!documentsDir) {
        throw new Error('Documents directory not available');
      }

      const newUri = `${documentsDir}uploads/${fileName}`;
      
      // Create uploads directory if it doesn't exist
      await (FileSystem as any).makeDirectoryAsync(`${documentsDir}uploads/`, {
        intermediates: true,
      });

      // Copy file to app directory
      await (FileSystem as any).copyAsync({
        from: uri,
        to: newUri,
      });

      return newUri;
    } catch (error) {
      logger.error('Error copying file to app directory', error);
      return null;
    }
  }
}