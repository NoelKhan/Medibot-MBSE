import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { createLogger } from './Logger';

const logger = createLogger('VoiceRecordingService');

export interface VoiceRecording {
  uri: string;
  duration: number;
  size: number;
}

export interface SpeechToTextResult {
  success: boolean;
  text?: string;
  confidence?: number;
  error?: string;
}

export class VoiceRecordingService {
  private static recording: Audio.Recording | null = null;
  private static isRecording = false;
  private static isInitialized = false;

  static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
      this.isInitialized = true;
    } catch (error) {
      logger.warn('Audio initialization warning', error);
      // Continue anyway - some platforms may not support all options
    }
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      await this.initialize();
      
      const { status, canAskAgain } = await Audio.requestPermissionsAsync();
      
      if (status === 'granted') {
        return true;
      }
      
      if (canAskAgain) {
        logger.info('Permission denied but can ask again');
        // For web compatibility
      } else {
        logger.info('Permission permanently denied');
      }
      
      return false;
    } catch (error) {
      logger.error('Error requesting audio permissions', error);
      return false;
    }
  }

  static async startRecording(): Promise<boolean> {
    try {
      // Clean up any existing recording first
      if (this.recording) {
        await this.cleanupRecording();
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Audio recording permission not granted');
      }

      // Set audio mode for recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      // Create recording with high quality preset
      const recordingOptions = Audio.RecordingOptionsPresets.HIGH_QUALITY;

      const { recording } = await Audio.Recording.createAsync(recordingOptions);

      this.recording = recording;
      this.isRecording = true;
      return true;
    } catch (error) {
      logger.error('Error starting recording', error);
      await this.cleanupRecording();
      return false;
    }
  }

  private static async cleanupRecording(): Promise<void> {
    try {
      if (this.recording) {
        const status = await this.recording.getStatusAsync();
        if (status.isRecording) {
          await this.recording.stopAndUnloadAsync();
        }
        this.recording = null;
      }
      this.isRecording = false;
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });
    } catch (error) {
      logger.warn('Cleanup recording warning', error);
      this.recording = null;
      this.isRecording = false;
    }
  }

  static async stopRecording(): Promise<VoiceRecording | null> {
    try {
      if (!this.recording || !this.isRecording) {
        logger.warn('No active recording to stop');
        return null;
      }

      // Get status before stopping
      const statusBeforeStop = await this.recording.getStatusAsync();
      
      await this.recording.stopAndUnloadAsync();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,
      });

      const uri = this.recording.getURI();
      this.isRecording = false;

      if (!uri) {
        logger.warn('No recording URI available');
        this.recording = null;
        return null;
      }

      // Get file info with proper error handling
      let fileSize = 0;
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && 'size' in fileInfo) {
          fileSize = fileInfo.size || 0;
        }
      } catch (fileError) {
        logger.warn('Could not get file info', fileError);
        // Continue anyway, just with 0 size
      }

      const voiceRecording: VoiceRecording = {
        uri,
        duration: statusBeforeStop.durationMillis || 0,
        size: fileSize,
      };

      this.recording = null;
      return voiceRecording;
    } catch (error) {
      logger.error('Error stopping recording', error);
      await this.cleanupRecording();
      return null;
    }
  }

  static async cancelRecording(): Promise<void> {
    try {
      if (this.recording && this.isRecording) {
        await this.recording.stopAndUnloadAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
    } catch (error) {
      logger.error('Error cancelling recording', error);
    } finally {
      this.isRecording = false;
      this.recording = null;
    }
  }

  static getRecordingStatus(): { isRecording: boolean } {
    return { isRecording: this.isRecording };
  }

  static async playRecording(uri: string): Promise<Audio.Sound | null> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isLooping: false,
        }
      );
      return sound;
    } catch (error) {
      logger.error('Error playing recording', error);
      return null;
    }
  }

  // Enhanced playback with verification controls
  static async createPlaybackVerification(uri: string): Promise<{
    sound: Audio.Sound | null;
    play: () => Promise<void>;
    pause: () => Promise<void>;
    stop: () => Promise<void>;
    getDuration: () => Promise<number>;
    getPosition: () => Promise<number>;
    setPosition: (position: number) => Promise<void>;
    cleanup: () => Promise<void>;
  }> {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isLooping: false,
        }
      );

      const controls = {
        sound,
        play: async () => {
          try {
            await sound.playAsync();
          } catch (error) {
            logger.error('Error playing audio', error);
          }
        },
        pause: async () => {
          try {
            await sound.pauseAsync();
          } catch (error) {
            logger.error('Error pausing audio', error);
          }
        },
        stop: async () => {
          try {
            await sound.stopAsync();
            await sound.setPositionAsync(0);
          } catch (error) {
            logger.error('Error stopping audio', error);
          }
        },
        getDuration: async (): Promise<number> => {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              return status.durationMillis || 0;
            }
            return 0;
          } catch (error) {
            logger.error('Error getting duration', error);
            return 0;
          }
        },
        getPosition: async (): Promise<number> => {
          try {
            const status = await sound.getStatusAsync();
            if (status.isLoaded) {
              return status.positionMillis || 0;
            }
            return 0;
          } catch (error) {
            logger.error('Error getting position', error);
            return 0;
          }
        },
        setPosition: async (position: number): Promise<void> => {
          try {
            await sound.setPositionAsync(position);
          } catch (error) {
            logger.error('Error setting position', error);
          }
        },
        cleanup: async (): Promise<void> => {
          try {
            await sound.unloadAsync();
          } catch (error) {
            logger.error('Error cleaning up sound', error);
          }
        },
      };

      return controls;
    } catch (error) {
      logger.error('Error creating playback verification', error);
      return {
        sound: null,
        play: async () => {},
        pause: async () => {},
        stop: async () => {},
        getDuration: async () => 0,
        getPosition: async () => 0,
        setPosition: async () => {},
        cleanup: async () => {},
      };
    }
  }

  static formatDuration(durationMs: number): string {
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Speech-to-Text functionality
  static async transcribeAudio(uri: string): Promise<SpeechToTextResult> {
    try {
      return await this.transcribeAudioMobile(uri);
    } catch (error) {
      logger.error('Error transcribing audio', error);
      return {
        success: false,
        error: 'Failed to transcribe audio. Please try again.',
      };
    }
  }

  private static async transcribeAudioWeb(uri: string): Promise<SpeechToTextResult> {
    try {
      // For web, we'll use the Web Speech API if available
      if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
        // Note: This is for live speech recognition, not file transcription
        // For file transcription, we'd need to integrate with a cloud service
        return {
          success: false,
          error: 'File-based speech recognition not available in browser. Use live recording instead.',
        };
      } else {
        return {
          success: false,
          error: 'Speech recognition not supported in this browser.',
        };
      }
    } catch (error) {
      logger.error('Web speech recognition error', error);
      return {
        success: false,
        error: 'Browser speech recognition failed.',
      };
    }
  }

  private static async transcribeAudioMobile(uri: string): Promise<SpeechToTextResult> {
    try {
      // For mobile, we would integrate with a cloud service like Google Cloud Speech-to-Text
      // or Azure Speech Service. For now, we'll return a placeholder implementation
      
      // Read the audio file
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        return {
          success: false,
          error: 'Audio file not found.',
        };
      }

      // In a real implementation, you would:
      // 1. Convert the audio to the required format (if needed)
      // 2. Upload to speech recognition service
      // 3. Process the response
      
      // For now, return a mock implementation
      return {
        success: true,
        text: '[Speech-to-text transcription would appear here. Please integrate with a speech recognition service like Google Cloud Speech-to-Text or Azure Speech Service for full functionality.]',
        confidence: 0.95,
      };
    } catch (error) {
      logger.error('Mobile speech recognition error', error);
      return {
        success: false,
        error: 'Mobile speech recognition failed.',
      };
    }
  }

  // Live speech recognition for web (real-time)
  static async startLiveSpeechRecognition(
    onResult: (text: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<boolean> {
    try {
      if (Platform.OS !== 'web') {
        onError?.('Live speech recognition only available on web platform');
        return false;
      }

      if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window)) {
        onError?.('Speech recognition not supported in this browser');
        return false;
      }

      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onResult(finalTranscript, true);
        } else if (interimTranscript) {
          onResult(interimTranscript, false);
        }
      };

      recognition.onerror = (event: any) => {
        onError?.(`Speech recognition error: ${event.error}`);
      };

      recognition.start();
      return true;
    } catch (error) {
      logger.error('Error starting live speech recognition', error);
      onError?.('Failed to start speech recognition');
      return false;
    }
  }

  static async stopLiveSpeechRecognition(): Promise<void> {
    // This would be handled by keeping a reference to the recognition instance
    // For now, it's a placeholder
    logger.info('Live speech recognition stopped');
  }
}