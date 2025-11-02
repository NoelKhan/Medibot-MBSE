/**
 * Enhanced Document Service
 * Provides comprehensive document selection, preview, and management capabilities
 * Similar to CameraService but for files and documents
 */

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform, Alert } from 'react-native';
import { showAlert } from '../components/CrossPlatformAlert';
import { createLogger } from './Logger';

const logger = createLogger('EnhancedDocumentService');

export interface DocumentResult {
  success: boolean;
  document?: DocumentFile;
  error?: string;
}

export interface DocumentFile {
  uri: string;
  name: string;
  type: string;
  size: number;
  mimeType?: string;
}

export interface DocumentOptions {
  allowedTypes?: string[];
  maxSizeInMB?: number;
  copyToCache?: boolean;
}

export class EnhancedDocumentService {
  private static readonly DEFAULT_MAX_SIZE_MB = 25; // 25MB limit
  private static readonly SUPPORTED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/*'
  ];

  private static readonly MEDICAL_DOCUMENT_TYPES = [
    'application/pdf', // Lab reports, prescriptions
    'image/*', // X-rays, medical images
    'text/plain', // Medical notes
    'application/msword', // Medical documents
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  /**
   * Show document source options similar to camera options
   */
  public static async showDocumentOptions(): Promise<DocumentResult> {
    try {
      logger.info('Showing document source options');
      
      return new Promise((resolve) => {
        // For mobile, show enhanced choice dialog with specific app integrations
        showAlert(
          'Choose Document Source',
          'Select how you want to add your document:',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                logger.info('Document selection cancelled');
                resolve({ success: false, error: 'Cancelled' });
              }
            },
            {
              text: '📁 Apple Files',
              onPress: () => {
                logger.info('Apple Files app selected');
                this.pickFromAppleFiles()
                  .then(resolve)
                  .catch(error => resolve({ success: false, error: error.message }));
              }
            },
            {
              text: '☁️ Google Drive',
              onPress: () => {
                logger.info('Google Drive selected');
                this.pickFromGoogleDrive()
                  .then(resolve)
                  .catch(error => resolve({ success: false, error: error.message }));
              }
            },
            {
              text: '🏥 Medical DB',
              onPress: () => {
                logger.info('Medical Database selected');
                this.pickFromMedicalDB()
                  .then(resolve)
                  .catch(error => resolve({ success: false, error: error.message }));
              }
            },
            {
              text: '📚 Research Papers',
              onPress: () => {
                logger.info('Research Papers selected');
                this.pickFromResearchPortal()
                  .then(resolve)
                  .catch(error => resolve({ success: false, error: error.message }));
              }
            }
          ]
        );
      });
    } catch (error) {
      logger.error('Error showing document options', error);
      return { success: false, error: 'Failed to show document options' };
    }
  }

  /**
   * Pick from Apple Files app (iOS) or Files app (Android)
   */
  public static async pickFromAppleFiles(options: DocumentOptions = {}): Promise<DocumentResult> {
    try {
      logger.info('Opening Apple Files/Files app for document selection');

      const timeout = new Promise<DocumentResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Apple Files selection timeout'));
        }, 45000); // Longer timeout for Files app
      });

      // Use specific configuration for Files app integration
      const pickPromise = this.performDocumentPick({
        type: Platform.OS === 'ios' ? [
          // iOS Files app supports these types well
          'public.item', // All file types
          'com.adobe.pdf',
          'com.microsoft.word.doc',
          'org.openxmlformats.wordprocessingml.document',
          'public.image',
          'public.text'
        ] : '*/*', // Android Files app
        copyToCacheDirectory: options.copyToCache ?? true,
        multiple: false,
      }, options);

      const result = await Promise.race([pickPromise, timeout]);
      logger.info('Apple Files selection completed');
      return result;
    } catch (error: any) {
      logger.error('Error picking from Apple Files', error);
      return { 
        success: false, 
        error: error instanceof Error && error.message === 'Apple Files selection timeout' 
          ? 'Files app selection took too long' 
          : 'Failed to access Files app' 
      };
    }
  }

  /**
   * Pick from Google Drive
   */
  public static async pickFromGoogleDrive(options: DocumentOptions = {}): Promise<DocumentResult> {
    try {
      logger.info('Opening Google Drive for document selection');

      const timeout = new Promise<DocumentResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Google Drive selection timeout'));
        }, 60000); // Longer timeout for cloud access
      });

      // Configure for Google Drive integration
      const pickPromise = this.performDocumentPick({
        type: [
          // Google Drive supported types
          'application/pdf',
          'application/vnd.google-apps.document',
          'application/vnd.google-apps.spreadsheet',
          'application/vnd.google-apps.presentation',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/*',
          'text/plain'
        ],
        copyToCacheDirectory: true, // Always cache from cloud
        multiple: false,
      }, options);

      const result = await Promise.race([pickPromise, timeout]);
      logger.info('Google Drive selection completed');
      return result;
    } catch (error: any) {
      logger.error('Error picking from Google Drive', error);
      return { 
        success: false, 
        error: error instanceof Error && error.message === 'Google Drive selection timeout'
          ? 'Google Drive access took too long'
          : 'Failed to access Google Drive. Please ensure you have the Google Drive app installed.' 
      };
    }
  }

  /**
   * Pick from Medical Database (simulated for backend development)
   */
  public static async pickFromMedicalDB(options: DocumentOptions = {}): Promise<DocumentResult> {
    try {
      logger.info('Opening Medical Database for document selection');
      
      // For development purposes, we'll show medical-specific file picker
      // In production, this would integrate with actual medical databases
      
      const timeout = new Promise<DocumentResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Medical DB timeout'));
        }, 45000);
      });

      // Configure for medical document types
      const pickPromise = this.performDocumentPick({
        type: [
          // Medical document types
          'application/pdf', // Lab reports, prescriptions
          'application/dicom', // Medical imaging
          'text/plain', // Medical notes
          'text/csv', // Medical data
          'image/jpeg', // X-rays, scans
          'image/png', // Medical images
          'application/hl7', // HL7 messages
          'application/fhir+json' // FHIR resources
        ],
        copyToCacheDirectory: true,
        multiple: false,
      }, options);

      const result = await Promise.race([pickPromise, timeout]);
      
      if (result.success && result.document) {
        // Add medical document metadata for backend development
        logger.info('Medical document selected', {
          type: result.document.type,
          size: result.document.size,
          name: result.document.name,
          medicalContext: 'healthcare_document'
        });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error picking from Medical DB', error);
      return { 
        success: false, 
        error: error instanceof Error && error.message === 'Medical DB timeout'
          ? 'Medical database access timeout'
          : 'Failed to access medical database. This feature simulates backend integration.' 
      };
    }
  }

  /**
   * Pick from Research Papers Portal (simulated for backend development)
   */
  public static async pickFromResearchPortal(options: DocumentOptions = {}): Promise<DocumentResult> {
    try {
      logger.info('Opening Research Papers Portal for document selection');
      
      // For development purposes, simulate research paper access
      // In production, this would integrate with PubMed, arXiv, etc.
      
      const timeout = new Promise<DocumentResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Research portal timeout'));
        }, 45000);
      });

      // Configure for research document types
      const pickPromise = this.performDocumentPick({
        type: [
          // Research document types
          'application/pdf', // Research papers
          'text/plain', // Plain text papers
          'application/vnd.ms-excel', // Research data
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv', // Research datasets
          'application/x-bibtex', // Bibliography
          'application/x-endnote-refer' // Reference manager
        ],
        copyToCacheDirectory: true,
        multiple: false,
      }, { ...options, maxSizeInMB: 50 }); // Larger files for research

      const result = await Promise.race([pickPromise, timeout]);
      
      if (result.success && result.document) {
        // Add research metadata for backend development
        logger.info('Research document selected', {
          type: result.document.type,
          size: result.document.size,
          name: result.document.name,
          researchContext: 'academic_paper',
          potentialSources: ['PubMed', 'arXiv', 'Google Scholar', 'ResearchGate']
        });
      }
      
      return result;
    } catch (error: any) {
      logger.error('Error picking from Research Portal', error);
      return { 
        success: false, 
        error: error instanceof Error && error.message === 'Research portal timeout'
          ? 'Research portal access timeout'
          : 'Failed to access research portal. This feature simulates academic database integration.' 
      };
    }
  }

  /**
   * Pick from local files app (legacy method for compatibility)
   */
  public static async pickFromFiles(options: DocumentOptions = {}): Promise<DocumentResult> {
    try {
      logger.info('Opening files app for document selection');

      const timeout = new Promise<DocumentResult>((_, reject) => {
        setTimeout(() => {
          reject(new Error('File selection timeout'));
        }, 30000); // 30 second timeout
      });

      const pickPromise = this.performDocumentPick({
        type: '*/*',
        copyToCacheDirectory: options.copyToCache ?? true,
        multiple: false,
      }, options);

      const result = await Promise.race([pickPromise, timeout]);
      return result;
    } catch (error) {
      logger.error('Error picking from files', error);
      return { 
        success: false, 
        error: error instanceof Error && error.message === 'File selection timeout' 
          ? 'File selection took too long' 
          : 'Failed to access files app' 
      };
    }
  }



  /**
   * Core document picking functionality
   */
  private static async performDocumentPick(
    pickerOptions: DocumentPicker.DocumentPickerOptions,
    options: DocumentOptions = {}
  ): Promise<DocumentResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync(pickerOptions);

      if (result.canceled) {
        return { success: false, error: 'Cancelled' };
      }

      if (!result.assets || result.assets.length === 0) {
        return { success: false, error: 'No document selected' };
      }

      const asset = result.assets[0];
      if (!asset || !asset.uri) {
        return { success: false, error: 'Invalid document selected' };
      }

      // Validate file size
      const maxSize = (options.maxSizeInMB ?? this.DEFAULT_MAX_SIZE_MB) * 1024 * 1024;
      const fileSize = asset.size || 0;

      if (fileSize > maxSize) {
        return {
          success: false,
          error: `File too large. Maximum size is ${options.maxSizeInMB || this.DEFAULT_MAX_SIZE_MB}MB`
        };
      }

      // Get additional file info
      let fileInfo: FileSystem.FileInfo | null = null;
      try {
        fileInfo = await FileSystem.getInfoAsync(asset.uri);
      } catch (infoError) {
        logger.warn('Could not get additional file info', infoError);
      }

      const documentFile: DocumentFile = {
        uri: asset.uri,
        name: asset.name,
        type: this.getDocumentType(asset.name),
        size: asset.size || (fileInfo && 'size' in fileInfo ? fileInfo.size : 0) || 0,
        mimeType: asset.mimeType
      };

      return { success: true, document: documentFile };
    } catch (error) {
      logger.error('Document picker error', error);
      return {
        success: false,
        error: 'Failed to select document. Please try again.'
      };
    }
  }

  /**
   * Preview document using system sharing
   */
  public static async previewDocument(documentUri: string, documentName: string): Promise<'success' | 'cancelled' | 'error'> {
    try {
      logger.info('Previewing document', { documentName });

            // For mobile, use sharing as preview
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        return 'error';
      }

      try {
        const shareTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => {
            logger.info('Document preview timeout');
            reject(new Error('timeout'));
          }, 15000);
        });

        const sharePromise = Sharing.shareAsync(documentUri, {
          mimeType: this.getMimeTypeFromName(documentName),
          dialogTitle: `Preview ${documentName}`,
        });

        await Promise.race([sharePromise, shareTimeout]);
        return 'success';
      } catch (previewError) {
        if (previewError instanceof Error && previewError.message === 'timeout') {
          return 'cancelled';
        }
        throw previewError;
      }
    } catch (error) {
      logger.error('Document preview error', error);
      return 'error';
    }
  }

  /**
   * Get document type from filename
   */
  private static getDocumentType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'document';
      case 'doc':
      case 'docx':
        return 'document';
      case 'txt':
        return 'text';
      case 'csv':
      case 'xls':
      case 'xlsx':
        return 'spreadsheet';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      default:
        return 'document';
    }
  }

  /**
   * Get MIME type from filename
   */
  private static getMimeTypeFromName(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'txt':
        return 'text/plain';
      case 'csv':
        return 'text/csv';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }

  /**
   * Format file size for display
   */
  public static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Check if file type is supported
   */
  public static isSupportedType(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const supportedExtensions = [
      'pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx',
      'jpg', 'jpeg', 'png', 'gif', 'rtf'
    ];
    
    return supportedExtensions.includes(extension || '');
  }

  /**
   * Get document icon name for UI
   */
  public static getDocumentIcon(fileName: string): string {
    const type = this.getDocumentType(fileName);
    
    switch (type) {
      case 'document':
        return 'description';
      case 'text':
        return 'article';
      case 'spreadsheet':
        return 'grid-on';
      case 'image':
        return 'image';
      default:
        return 'insert-drive-file';
    }
  }

  /**
   * BACKEND INTEGRATION HELPERS
   * These methods simulate backend integration for development purposes
   */

  /**
   * Generate metadata for backend document processing
   */
  public static generateDocumentMetadata(document: DocumentFile, source: string): any {
    const metadata = {
      // Basic file info
      fileName: document.name,
      fileSize: document.size,
      mimeType: document.mimeType,
      documentType: this.getDocumentType(document.name),
      
      // Source information
      source: source,
      uploadTimestamp: new Date().toISOString(),
      
      // Medical context (for backend ML processing)
      medicalContext: {
        isPotentialMedicalDocument: this.isMedicalDocument(document.name),
        documentCategory: this.categorizeDocument(document.name),
        processingPriority: this.getProcessingPriority(document.name, source),
      },
      
      // Backend integration flags
      backendFlags: {
        requiresOCR: this.requiresOCR(document.name),
        requiresMedicalNLP: source === 'medical_db' || source === 'research_portal',
        requiresPrivacyFiltering: true,
        supportsBatchProcessing: this.supportsBatchProcessing(document.name),
      },
      
      // Simulated API endpoints for backend development
      simulatedEndpoints: {
        uploadUrl: `/api/documents/upload/${source}`,
        processUrl: `/api/documents/process/${this.getDocumentType(document.name)}`,
        extractUrl: `/api/documents/extract/${document.name.split('.').pop()}`,
        analyzeUrl: `/api/medical/analyze`,
      }
    };

    logger.info('Generated document metadata for backend integration', metadata);
    return metadata;
  }

  /**
   * Check if document is medical-related
   */
  private static isMedicalDocument(fileName: string): boolean {
    const medicalKeywords = [
      'lab', 'test', 'result', 'report', 'prescription', 'medical',
      'health', 'diagnosis', 'scan', 'xray', 'mri', 'ct', 'blood',
      'patient', 'doctor', 'clinic', 'hospital'
    ];
    
    const lowerName = fileName.toLowerCase();
    return medicalKeywords.some(keyword => lowerName.includes(keyword));
  }

  /**
   * Categorize document for backend processing
   */
  private static categorizeDocument(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const lowerName = fileName.toLowerCase();
    
    if (this.isMedicalDocument(fileName)) {
      if (lowerName.includes('lab') || lowerName.includes('test')) return 'lab_report';
      if (lowerName.includes('prescription') || lowerName.includes('rx')) return 'prescription';
      if (lowerName.includes('scan') || lowerName.includes('image')) return 'medical_imaging';
      return 'medical_document';
    }
    
    if (lowerName.includes('research') || lowerName.includes('study') || lowerName.includes('paper')) {
      return 'research_paper';
    }
    
    switch (extension) {
      case 'pdf': return 'pdf_document';
      case 'doc':
      case 'docx': return 'word_document';
      case 'xls':
      case 'xlsx': return 'spreadsheet';
      case 'jpg':
      case 'jpeg':
      case 'png': return 'image';
      default: return 'general_document';
    }
  }

  /**
   * Get processing priority for backend queue
   */
  private static getProcessingPriority(fileName: string, source: string): 'high' | 'medium' | 'low' {
    if (source === 'medical_db') return 'high';
    if (this.isMedicalDocument(fileName)) return 'high';
    if (source === 'research_portal') return 'medium';
    return 'low';
  }

  /**
   * Check if document requires OCR processing
   */
  private static requiresOCR(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const ocrTypes = ['jpg', 'jpeg', 'png', 'tiff', 'bmp', 'gif'];
    return ocrTypes.includes(extension || '') || fileName.toLowerCase().includes('scan');
  }

  /**
   * Check if document supports batch processing
   */
  private static supportsBatchProcessing(fileName: string): boolean {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const batchTypes = ['csv', 'xlsx', 'json', 'xml'];
    return batchTypes.includes(extension || '');
  }

  /**
   * Simulate backend API calls for development
   */
  public static simulateBackendIntegration(document: DocumentFile, source: string): void {
    const metadata = this.generateDocumentMetadata(document, source);
    
    logger.info('Backend integration simulation', {
      message: 'Document processed with backend calls',
      uploadUrl: metadata.simulatedEndpoints.uploadUrl,
      processUrl: metadata.simulatedEndpoints.processUrl,
      extractUrl: metadata.simulatedEndpoints.extractUrl,
      analyzeUrl: metadata.backendFlags.requiresMedicalNLP ? metadata.simulatedEndpoints.analyzeUrl : undefined,
      source,
      category: metadata.medicalContext.documentCategory,
      priority: metadata.medicalContext.processingPriority,
      flags: metadata.backendFlags
    });
  }

  /**
   * Get integration URLs for specific apps (for backend development)
   */
  public static getAppIntegrationInfo(): any {
    return {
      appleFiles: {
        description: 'Apple Files app integration',
        supportedPlatforms: ['iOS', 'macOS'],
        apiIntegration: 'Document Provider Extensions',
        backendEndpoint: '/api/integrations/apple-files',
        capabilities: ['local_files', 'icloud_drive', 'third_party_providers']
      },
      googleDrive: {
        description: 'Google Drive integration',
        supportedPlatforms: ['iOS', 'Android', 'Web'],
        apiIntegration: 'Google Drive API v3',
        backendEndpoint: '/api/integrations/google-drive',
        oauthScopes: ['https://www.googleapis.com/auth/drive.readonly'],
        capabilities: ['cloud_storage', 'real_time_collaboration', 'google_workspace']
      },
      medicalDB: {
        description: 'Medical Database integration (simulated)',
        supportedPlatforms: ['All'],
        apiIntegration: 'Custom Medical API',
        backendEndpoint: '/api/medical/documents',
        standardsSupport: ['HL7', 'FHIR', 'DICOM'],
        capabilities: ['patient_records', 'lab_results', 'imaging_studies']
      },
      researchPortal: {
        description: 'Research Papers Portal (simulated)',
        supportedPlatforms: ['All'],
        apiIntegration: 'Academic Database APIs',
        backendEndpoint: '/api/research/papers',
        databases: ['PubMed', 'arXiv', 'Google Scholar', 'ResearchGate'],
        capabilities: ['literature_search', 'citation_extraction', 'full_text_access']
      }
    };
  }
}