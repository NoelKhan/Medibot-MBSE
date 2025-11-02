import * as ImagePicker from 'expo-image-picker';
import { Platform, Alert } from 'react-native';
import { createLogger } from './Logger';

const logger = createLogger('CameraService');

export interface CameraPhoto {
  uri: string;
  width: number;
  height: number;
  type: 'image';
  base64?: string;
}

export interface CameraResult {
  success: boolean;
  photo?: CameraPhoto;
  error?: string;
}

export interface TextExtractionResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

export class CameraService {
  // Request camera permissions
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      // For mobile platforms
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      return cameraPermission.status === 'granted';
    } catch (error) {
      logger.error('Error requesting camera permissions', error);
      return false;
    }
  }

  // Request media library permissions for accessing Photos app
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      // For mobile platforms, request media library permissions
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return mediaLibraryPermission.status === 'granted';
    } catch (error) {
      logger.error('Error requesting media library permissions', error);
      return false;
    }
  }

  // Take photo using camera
  static async takePhoto(): Promise<CameraResult> {
    try {
      logger.info('Starting camera capture');
      
      // Simplified options to avoid potential conflicts
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: 'images' as any,
        quality: 0.7,
        // Removed allowsEditing, aspect, and base64 to prevent hanging
      };

      logger.debug('Launching camera', { options });
      
      // Shorter timeout and better error handling
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          logger.warn('Camera timeout triggered');
          reject(new Error('Camera timeout - this may be an Expo Go limitation'));
        }, 10000); // Reduced to 10 seconds
      });

      const cameraPromise = ImagePicker.launchCameraAsync(options).then(result => {
        clearTimeout(timeoutId);
        return result;
      });

      logger.debug('Waiting for camera result');
      const result = await Promise.race([cameraPromise, timeoutPromise]);
      logger.debug('Camera operation completed', { 
        canceled: result.canceled, 
        assetsCount: result.assets?.length 
      });

      if (result.canceled) {
        logger.info('Camera cancelled by user');
        return {
          success: false,
          error: 'Photo capture was cancelled',
        };
      }
      
      if (!result.assets || result.assets.length === 0) {
        logger.error('No camera assets returned');
        return {
          success: false,
          error: 'No photo was captured',
        };
      }

      const asset = result.assets[0];
      logger.debug('Processing camera asset', { 
        hasUri: !!asset.uri,
        width: asset.width, 
        height: asset.height
      });

      const photo: CameraPhoto = {
        uri: asset.uri,
        width: asset.width || 400,
        height: asset.height || 300,
        type: 'image',
        base64: undefined, // Skip base64 to prevent memory issues
      };

      logger.info('Camera capture successful');
      return {
        success: true,
        photo,
      };
    } catch (error) {
      logger.error('Camera error', error);
      if (error instanceof Error && (error.message.includes('timeout') || error.message.includes('Expo Go'))) {
        return {
          success: false,
          error: 'Camera not available in Expo Go. Try using the photo gallery instead or use a development build.',
        };
      }
      return {
        success: false,
        error: 'Camera failed. Please try the photo gallery option instead.',
      };
    }
  }

  // Pick image from gallery as alternative
  static async pickFromGallery(): Promise<CameraResult> {
    try {
      logger.info('Starting image library access');
      
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: 'images' as any,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      };

      logger.debug('Launching image library', { options });
      
      // Add timeout to prevent hanging
      const libraryPromise = ImagePicker.launchImageLibraryAsync(options);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Image library timeout after 30 seconds'));
        }, 30000);
      });

      const result = await Promise.race([libraryPromise, timeoutPromise]);
      logger.debug('Image library result received', { 
        canceled: result.canceled,
        assetsCount: result.assets?.length
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        logger.info('Image selection cancelled');
        return {
          success: false,
          error: 'Image selection was cancelled',
        };
      }

      const asset = result.assets[0];
      logger.debug('Image asset received', { 
        hasUri: !!asset.uri,
        width: asset.width, 
        height: asset.height,
        hasBase64: !!asset.base64
      });

      const photo: CameraPhoto = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: 'image',
        base64: asset.base64 || undefined,
      };

      logger.info('Image selection successful');
      return {
        success: true,
        photo,
      };
    } catch (error) {
      logger.error('Error picking image', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          success: false,
          error: 'Image library took too long to respond. Please try again.',
        };
      }
      return {
        success: false,
        error: 'Failed to select image. Please try again.',
      };
    }
  }

  // Extract text from image using OCR
  static async extractTextFromImage(photo: CameraPhoto): Promise<TextExtractionResult> {
    try {
      if (!photo.base64) {
        return {
          success: false,
          error: 'Image data not available for text extraction',
        };
      }

      // In a real implementation, you would integrate with an OCR service like:
      // - Google Cloud Vision API
      // - Azure Computer Vision
      // - AWS Textract
      // - Or a local OCR library like Tesseract.js for web

      // For now, return a mock implementation
      const mockExtractedText = this.generateMockOCRResult();
      
      return {
        success: true,
        text: mockExtractedText,
        confidence: 0.85,
      };
    } catch (error) {
      logger.error('Error extracting text from image', error);
      return {
        success: false,
        error: 'Failed to extract text from image. Please try again.',
      };
    }
  }

  // Mock OCR result for demonstration
  private static generateMockOCRResult(): string {
    const mockTexts = [
      'Patient Name: John Smith\nDate: 2024-01-15\nDiagnosis: Hypertension\nPrescription: Lisinopril 10mg daily',
      'Blood Test Results\nHemoglobin: 14.2 g/dL\nWBC: 7,500/μL\nPlatelets: 250,000/μL\nGlucose: 95 mg/dL',
      'Medical Report\nPatient ID: 12345\nSymptoms: Fever, headache\nTemperature: 38.5°C\nRecommendation: Rest and fluids',
      'Prescription\nMedication: Amoxicillin 500mg\nDosage: 3 times daily\nDuration: 7 days\nPhysician: Dr. Johnson',
    ];
    
    return mockTexts[Math.floor(Math.random() * mockTexts.length)];
  }

  // Show photo source options with user-friendly interface
  static async showCameraOptions(): Promise<CameraResult> {
    return new Promise((resolve) => {
      Alert.alert(
        'Add Photo',
        'How would you like to add a photo?',
        [
          { 
            text: 'Cancel', 
            style: 'cancel',
            onPress: () => resolve({
              success: false,
              error: 'Cancelled'
            })
          },
          {
            text: '📱 Take Photo',
            onPress: async () => {
              try {
                logger.info('User selected camera option');
                const result = await this.takePhoto();
                resolve(result);
              } catch (error) {
                logger.error('Camera failed, offering gallery fallback', error);
                // If camera fails, automatically try gallery as fallback
                Alert.alert(
                  'Camera Unavailable',
                  'Camera failed to start. Opening photo gallery instead.',
                  [
                    {
                      text: 'OK',
                      onPress: async () => {
                        const galleryResult = await this.pickFromGallery();
                        resolve(galleryResult);
                      }
                    }
                  ]
                );
              }
            }
          },
          {
            text: '🖼️ Choose from Gallery',
            onPress: async () => {
              logger.info('User selected gallery option');
              const result = await this.pickFromGallery();
              resolve(result);
            }
          }
        ]
      );
    });
  }

  // Process image for medical context
  static async processImageForMedicalDiagnosis(photo: CameraPhoto): Promise<{
    extractedText: TextExtractionResult;
    medicalContext: {
      containsMedicalTerms: boolean;
      suggestedCategory: string;
      confidence: number;
    };
  }> {
    try {
      const textResult = await this.extractTextFromImage(photo);
      
      // Analyze text for medical context
      const medicalContext = this.analyzeMedicalContext(textResult.text || '');
      
      return {
        extractedText: textResult,
        medicalContext,
      };
    } catch (error) {
      logger.error('Error processing image for medical diagnosis', error);
      return {
        extractedText: {
          success: false,
          error: 'Failed to process image',
        },
        medicalContext: {
          containsMedicalTerms: false,
          suggestedCategory: 'unknown',
          confidence: 0,
        },
      };
    }
  }

  // Analyze text for medical terms and context
  private static analyzeMedicalContext(text: string): {
    containsMedicalTerms: boolean;
    suggestedCategory: string;
    confidence: number;
  } {
    const medicalTerms = {
      prescription: ['medication', 'dosage', 'prescription', 'mg', 'ml', 'tablet', 'capsule', 'daily', 'times'],
      labResults: ['test', 'result', 'level', 'count', 'normal', 'high', 'low', 'range', 'reference'],
      symptoms: ['pain', 'fever', 'headache', 'nausea', 'dizzy', 'tired', 'weakness', 'symptom'],
      vitals: ['blood pressure', 'temperature', 'heart rate', 'pulse', 'oxygen', 'saturation', 'bpm'],
    };

    const lowerText = text.toLowerCase();
    let maxMatches = 0;
    let suggestedCategory = 'general';

    for (const [category, terms] of Object.entries(medicalTerms)) {
      const matches = terms.filter(term => lowerText.includes(term)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        suggestedCategory = category;
      }
    }

    const containsMedicalTerms = maxMatches > 0;
    const confidence = Math.min(maxMatches / 5, 1); // Normalize to 0-1

    return {
      containsMedicalTerms,
      suggestedCategory,
      confidence,
    };
  }


}