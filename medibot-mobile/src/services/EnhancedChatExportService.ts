/**
 * Enhanced Chat Export Service
 * Provides PDF and HTML export functionality for medical consultations
 */

import { Platform, Linking } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import { Conversation, Message } from '../types/Medical';
import { User } from '../types/User';
import { createLogger } from './Logger';

const logger = createLogger('EnhancedChatExportService');

export interface ExportOptions {
  format: 'pdf' | 'html' | 'text';
  includeTimestamps: boolean;
  includeUserInfo: boolean;
  includeMetadata?: boolean;
  customHeader?: string;
  customFooter?: string;
  emailRecipient?: string;
  theme?: 'light' | 'dark';
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
  fileSize?: number;
}

export class EnhancedChatExportService {
  private static instance: EnhancedChatExportService;

  public static getInstance(): EnhancedChatExportService {
    if (!EnhancedChatExportService.instance) {
      EnhancedChatExportService.instance = new EnhancedChatExportService();
    }
    return EnhancedChatExportService.instance;
  }

  /**
   * Export chat conversation as PDF
   */
  public async exportToPDF(
    conversation: Conversation,
    user: User,
    options: ExportOptions = {
      format: 'pdf',
      includeTimestamps: true,
      includeUserInfo: true,
    }
  ): Promise<ExportResult> {
    try {
      logger.info('Starting PDF export for conversation', { conversationId: conversation.id });
      // Generate HTML content for PDF
      const htmlContent = this.generateHTMLContent(conversation, user, options);
      logger.info('Generated HTML content', { length: htmlContent.length });
      
      return await this.exportPDFMobile(htmlContent, conversation, options);
    } catch (error) {
      logger.error('PDF export error', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export PDF',
      };
    }
  }

  /**
   * Export chat conversation as HTML
   */
  public async exportToHTML(
    conversation: Conversation,
    user: User,
    options: ExportOptions = {
      format: 'html',
      includeTimestamps: true,
      includeUserInfo: true,
    }
  ): Promise<ExportResult> {
    try {
      logger.info('Starting HTML export for conversation', { conversationId: conversation.id });
      const htmlContent = this.generateHTMLContent(conversation, user, options);
      const fileName = this.generateFileName(conversation, 'html');
      logger.info('Generated HTML file name', { fileName });

      return await this.exportHTMLMobile(htmlContent, fileName);
    } catch (error) {
      logger.error('HTML export error', error as Error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to export HTML',
      };
    }
  }

  /**
   * Generate HTML content for export
   */
  private generateHTMLContent(
    conversation: Conversation,
    user: User,
    options: ExportOptions
  ): string {
    const theme = options.theme || 'light';
    const isDark = theme === 'dark';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MediBot Consultation - ${this.formatDate(conversation.startTime)}</title>
    <style>
        ${this.generateCSS(isDark)}
    </style>
</head>
<body class="${theme}">
    <div class="container">
        ${this.generateHeader(conversation, user, options)}
        ${this.generateConversationContent(conversation, options)}
        ${this.generateFooter(conversation, user, options)}
    </div>
</body>
</html>`;
  }

  /**
   * Generate CSS styles for HTML export
   */
  private generateCSS(isDark: boolean): string {
    const colors = isDark
      ? {
          background: '#1a1a1a',
          surface: '#2d2d2d',
          text: '#ffffff',
          textSecondary: '#b3b3b3',
          userBubble: '#007AFF',
          botBubble: '#4a4a4a',
          border: '#404040',
        }
      : {
          background: '#f5f5f5',
          surface: '#ffffff',
          text: '#000000',
          textSecondary: '#666666',
          userBubble: '#007AFF',
          botBubble: '#e9ecef',
          border: '#e0e0e0',
        };

    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: ${colors.text};
            background-color: ${colors.background};
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: ${colors.surface};
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        
        .header {
            border-bottom: 2px solid ${colors.border};
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        
        .logo {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .logo-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #007AFF, #0056CC);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 18px;
            margin-right: 12px;
        }
        
        .title {
            font-size: 28px;
            font-weight: 700;
            color: ${colors.text};
            margin: 0;
        }
        
        .subtitle {
            font-size: 16px;
            color: ${colors.textSecondary};
            margin-top: 5px;
        }
        
        .user-info {
            background-color: ${colors.background};
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
        }
        
        .user-info h3 {
            font-size: 16px;
            margin-bottom: 10px;
            color: ${colors.text};
        }
        
        .user-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .user-detail {
            font-size: 14px;
            color: ${colors.textSecondary};
        }
        
        .conversation {
            margin-bottom: 30px;
        }
        
        .message {
            margin-bottom: 20px;
            display: flex;
            align-items: flex-start;
        }
        
        .message.user {
            flex-direction: row-reverse;
        }
        
        .message-bubble {
            max-width: 70%;
            padding: 12px 16px;
            border-radius: 18px;
            word-wrap: break-word;
        }
        
        .message.user .message-bubble {
            background-color: ${colors.userBubble};
            color: white;
            margin-left: 20px;
        }
        
        .message.bot .message-bubble {
            background-color: ${colors.botBubble};
            color: ${colors.text};
            margin-right: 20px;
        }
        
        .message-header {
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }
        
        .sender-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
            margin-right: 8px;
        }
        
        .message.user .sender-avatar {
            background-color: ${colors.userBubble};
            color: white;
            margin-left: 8px;
            margin-right: 0;
        }
        
        .message.bot .sender-avatar {
            background-color: ${colors.botBubble};
            color: ${colors.text};
        }
        
        .message-content {
            font-size: 15px;
            line-height: 1.4;
        }
        
        .message-timestamp {
            font-size: 12px;
            opacity: 0.7;
            margin-top: 5px;
        }
        
        .voice-message {
            display: flex;
            align-items: center;
            padding: 8px 0;
        }
        
        .voice-icon {
            width: 24px;
            height: 24px;
            margin-right: 8px;
            opacity: 0.8;
        }
        
        .footer {
            border-top: 2px solid ${colors.border};
            padding-top: 20px;
            text-align: center;
            color: ${colors.textSecondary};
        }
        
        .export-info {
            font-size: 12px;
            margin-bottom: 10px;
        }
        
        .disclaimer {
            font-size: 11px;
            font-style: italic;
            max-width: 600px;
            margin: 0 auto;
        }
        
        @media print {
            body { -webkit-print-color-adjust: exact; }
            .container { box-shadow: none; }
        }
        
        @media (max-width: 600px) {
            .container { padding: 10px; }
            .message-bubble { max-width: 85%; }
            .user-details { grid-template-columns: 1fr; }
        }
    `;
  }

  /**
   * Generate header section
   */
  private generateHeader(
    conversation: Conversation,
    user: User,
    options: ExportOptions
  ): string {
    const userInfoSection = options.includeUserInfo
      ? `
        <div class="user-info">
          <h3>Patient Information</h3>
          <div class="user-details">
            <div class="user-detail"><strong>Name:</strong> ${user.name || 'Not provided'}</div>
            <div class="user-detail"><strong>Email:</strong> ${user.email || 'Not provided'}</div>
            <div class="user-detail"><strong>Date:</strong> ${this.formatDate(conversation.startTime)}</div>
            <div class="user-detail"><strong>Session ID:</strong> ${conversation.id}</div>
          </div>
        </div>
      `
      : '';

    return `
      <div class="header">
        <div class="logo">
          <div class="logo-icon">M</div>
          <div>
            <h1 class="title">MediBot Medical Consultation</h1>
            <p class="subtitle">AI-Powered Healthcare Assistant</p>
          </div>
        </div>
        ${options.customHeader || ''}
        ${userInfoSection}
      </div>
    `;
  }

  /**
   * Generate conversation content
   */
  private generateConversationContent(
    conversation: Conversation,
    options: ExportOptions
  ): string {
    const messages = conversation.messages
      .map((message) => this.formatMessageForHTML(message, options))
      .join('');

    return `
      <div class="conversation">
        <h2 style="margin-bottom: 20px; color: #333;">Consultation Transcript</h2>
        ${messages}
      </div>
    `;
  }

  /**
   * Format individual message for HTML
   */
  private formatMessageForHTML(message: Message, options: ExportOptions): string {
    const isUser = message.sender === 'user';
    const senderName = isUser ? 'You' : 'MediBot';
    const avatarText = isUser ? 'U' : 'M';
    
    const timestamp = options.includeTimestamps
      ? `<div class="message-timestamp">${this.formatTime(message.timestamp)}</div>`
      : '';

    const content = message.type === 'voice'
      ? `<div class="voice-message">
          <div class="voice-icon">🎵</div>
          <span>Voice message</span>
         </div>`
      : `<div class="message-content">${this.escapeHTML(message.content)}</div>`;

    return `
      <div class="message ${isUser ? 'user' : 'bot'}">
        <div class="sender-avatar">${avatarText}</div>
        <div class="message-bubble">
          ${content}
          ${timestamp}
        </div>
      </div>
    `;
  }

  /**
   * Generate footer section
   */
  private generateFooter(
    conversation: Conversation,
    user: User,
    options: ExportOptions
  ): string {
    const exportTime = new Date().toLocaleString();
    const messageCount = conversation.messages.length;
    const duration = conversation.endTime
      ? Math.round((conversation.endTime.getTime() - conversation.startTime.getTime()) / 60000)
      : 'Ongoing';

    return `
      <div class="footer">
        <div class="export-info">
          <p>Exported on ${exportTime} | ${messageCount} messages | Duration: ${duration} minutes</p>
        </div>
        <div class="disclaimer">
          <p><strong>Medical Disclaimer:</strong> This consultation was conducted with MediBot, an AI-powered healthcare assistant. 
          This information is for educational purposes only and should not replace professional medical advice. 
          Always consult with qualified healthcare professionals for medical decisions.</p>
        </div>
        ${options.customFooter || ''}
      </div>
    `;
  }

  /**
   * Export PDF on web platform
   */
  private async exportPDFWeb(
    htmlContent: string,
    conversation: Conversation,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Method 1: Try to use browser's print-to-PDF capability
      if (typeof window !== 'undefined' && 'print' in window) {
        try {
          // Create a hidden iframe for PDF generation
          const iframe = document.createElement('iframe');
          iframe.style.position = 'absolute';
          iframe.style.left = '-9999px';
          iframe.style.width = '210mm'; // A4 width
          iframe.style.height = '297mm'; // A4 height
          document.body.appendChild(iframe);

          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            // Add CSS for PDF formatting
            const pdfHtml = htmlContent.replace(
              '<style>',
              `<style>
                @page { 
                  size: A4; 
                  margin: 20mm; 
                }
                @media print { 
                  body { 
                    -webkit-print-color-adjust: exact;
                    color-adjust: exact;
                    font-size: 12px;
                    line-height: 1.4;
                  }
                  .no-print { display: none !important; }
                  .page-break { page-break-after: always; }
                }
                body {
                  font-family: Arial, sans-serif;
                  max-width: 170mm;
                  margin: 0 auto;
                  padding: 10mm;
                }
              `
            );

            iframeDoc.open();
            iframeDoc.write(pdfHtml);
            iframeDoc.close();

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Trigger print for the iframe
            iframe.contentWindow?.print();

            // Clean up
            setTimeout(() => {
              document.body.removeChild(iframe);
            }, 2000);

            return {
              success: true,
              filePath: 'PDF print dialog opened',
            };
          }
        } catch (printError) {
          logger.warn('Print method failed, trying alternative', { error: (printError as Error).message });
        }
      }

      // Method 2: Create downloadable HTML with print styles
      const pdfStyledHtml = htmlContent.replace(
        '<style>',
        `<style>
          @page { size: A4; margin: 20mm; }
          @media print { 
            body { 
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
            }
          }
          body {
            font-family: Arial, sans-serif;
            max-width: 170mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
          }
          .print-instructions {
            background: #f0f8ff;
            padding: 15px;
            border: 1px solid #0066cc;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .print-instructions h3 {
            margin-top: 0;
            color: #0066cc;
          }
        `
      );

      // Add print instructions
      const instructionsHtml = pdfStyledHtml.replace(
        '<body>',
        `<body>
          <div class="print-instructions">
            <h3>📄 How to save as PDF:</h3>
            <ol>
              <li>Press <strong>Ctrl+P</strong> (or Cmd+P on Mac)</li>
              <li>Select <strong>"Save as PDF"</strong> as the destination</li>
              <li>Click <strong>"Save"</strong> to download your PDF</li>
            </ol>
            <p><small>This instruction box will not appear in the PDF.</small></p>
          </div>
        `
      ).replace('</style>', '.print-instructions { display: none; } @media screen { .print-instructions { display: block; } } </style>');

      // Download the HTML file
      const blob = new Blob([instructionsHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFileName(conversation, 'html');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filePath: 'Downloaded HTML file with PDF print instructions',
      };
    } catch (error) {
      throw new Error(`Web PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export PDF on mobile platform
   */
  private async exportPDFMobile(
    htmlContent: string,
    conversation: Conversation,
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      // Try to use expo-print if available, otherwise fall back to HTML
      try {
        // Import expo-print for PDF generation
        const { printToFileAsync } = await import('expo-print');
        
        logger.info('Attempting PDF generation with expo-print');
        
        // Validate HTML content
        if (!htmlContent || htmlContent.trim().length === 0) {
          throw new Error('HTML content is empty');
        }
        
        logger.info('HTML content validation passed, generating PDF');
        const result = await printToFileAsync({
          html: htmlContent,
          base64: false,
          width: 612, // Standard letter width in points
          height: 792, // Standard letter height in points
        });

        if (!result.uri) {
          throw new Error('PDF generation failed - no URI returned');
        }

        logger.info('PDF generated by expo-print', { uri: result.uri });

        const fileName = this.generateFileName(conversation, 'pdf');
        const finalUri = `${FileSystem.documentDirectory}${fileName}`;
        
        // Check if the generated file exists before moving
        const tempFileInfo = await FileSystem.getInfoAsync(result.uri);
        if (!tempFileInfo.exists) {
          throw new Error('Generated PDF file does not exist');
        }
        
        logger.info('Moving PDF from temp location to final location');
        // Move the generated PDF to our desired location
        await FileSystem.moveAsync({
          from: result.uri,
          to: finalUri,
        });

        logger.info('PDF moved successfully', { finalUri });
        
        // Verify the final file exists
        const fileInfo = await FileSystem.getInfoAsync(finalUri);
        if (!fileInfo.exists) {
          throw new Error('PDF file was not created successfully');
        }
        
        logger.info('PDF file verification passed', { size: fileInfo.size });
        
        return {
          success: true,
          filePath: finalUri,
          fileSize: fileInfo.size || 0,
        };
      } catch (printError) {
        logger.info('expo-print not available, falling back to HTML', { 
          error: (printError as Error).message 
        });
        
        // Fallback: Create HTML file with PDF-like styling
        const fileName = this.generateFileName(conversation, 'html');
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        
        // Add PDF-like styling to HTML
        const pdfStyledContent = htmlContent.replace(
          '<style>',
          '<style>\n      @page { size: A4; margin: 20mm; }\n      @media print { body { -webkit-print-color-adjust: exact; } }\n'
        );
        
        await FileSystem.writeAsStringAsync(fileUri, pdfStyledContent);
        
        // Get file info
        const fileInfo = await FileSystem.getInfoAsync(fileUri);
        
        return {
          success: true,
          filePath: fileUri,
          fileSize: fileInfo.exists ? fileInfo.size : undefined,
        };
      }
    } catch (error) {
      throw new Error(`Mobile PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export HTML on web platform
   */
  private async exportHTMLWeb(htmlContent: string, fileName: string): Promise<ExportResult> {
    try {
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return {
        success: true,
        filePath: fileName,
        fileSize: blob.size,
      };
    } catch (error) {
      throw new Error(`Web HTML export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Export HTML on mobile platform
   */
  private async exportHTMLMobile(htmlContent: string, fileName: string): Promise<ExportResult> {
    try {
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, htmlContent);
      
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      
      return {
        success: true,
        filePath: fileUri,
        fileSize: fileInfo.exists ? fileInfo.size : undefined,
      };
    } catch (error) {
      throw new Error(`Mobile HTML export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Share exported file with timeout protection
   * Returns: 'success' | 'cancelled' | 'error'
   */
  public async shareExportedFile(filePath: string): Promise<'success' | 'cancelled' | 'error'> {
    try {
      logger.info('Sharing file', { filePath, platform: Platform.OS });
      
      logger.info('Checking sharing availability');
      const isAvailable = await Sharing.isAvailableAsync();
      logger.info('Sharing availability checked', { isAvailable });
      
      if (isAvailable) {
        logger.info('Starting share dialog');
        
        try {
          // Create timeout promise for sharing - longer timeout to avoid false cancellations
        const shareTimeout = new Promise<never>((_, reject) => {
            setTimeout(() => {
              logger.info('Share operation timeout - assuming user dismissed dialog');
              reject(new Error('timeout'));
            }, 20000); // 20 second timeout for sharing
          });

          const sharePromise = Sharing.shareAsync(filePath, {
            mimeType: filePath.endsWith('.pdf') ? 'application/pdf' : 'text/html',
            dialogTitle: 'Share MediBot Consultation',
          }).then(() => {
            logger.info('Share dialog completed');
            return true;
          });

          await Promise.race([sharePromise, shareTimeout]);
          logger.info('Share completed successfully');
          return 'success';
        } catch (shareError) {
          logger.info('Share error or timeout', { error: (shareError as Error).message });
          
          // Check for explicit user cancellation based on error message first
          if (shareError instanceof Error) {
            const errorMsg = shareError.message.toLowerCase();
            // More comprehensive cancellation detection
            if (errorMsg.includes('cancel') || errorMsg.includes('dismiss') || 
                errorMsg.includes('abort') || errorMsg.includes('user cancel') ||
                errorMsg.includes('user cancelled') || errorMsg.includes('dismissed') ||
                errorMsg.includes('no app') || errorMsg.includes('no application') ||
                shareError.message === 'Share was cancelled by the user.') {
              logger.info('Detected explicit user cancellation', { errorMsg });
              return 'cancelled';
            }
          }
          
          // For timeout, assume user dismissed dialog without sharing (prioritize cancellation)
          if (shareError instanceof Error && shareError.message === 'timeout') {
            logger.info('Share timeout - user likely dismissed dialog');
            return 'cancelled'; // Assume cancellation on timeout since users often just dismiss
          }
          
          // For other errors, still consider the file successfully created
          logger.info('Share encountered error but file exists');
          return 'success'; // Default to success since file was created
        }
      }
      logger.warn('Sharing not available on this device');
      return 'error';
    } catch (error) {
      logger.error('Share error', error as Error);
      return 'error';
    }
  }

  /**
   * Preview HTML file - Opens file in browser/viewer
   */
  public async previewHTMLFile(filePath: string): Promise<'success' | 'cancelled' | 'error'> {
    try {
      logger.info('Previewing HTML file', { filePath, platform: Platform.OS });
      
      // For Android, use IntentLauncher to open in browser
      if (Platform.OS === 'android') {
        try {
          const contentUri = await FileSystem.getContentUriAsync(filePath);
          logger.info('Opening HTML with Intent Launcher', { contentUri });
          
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_ACTIVITY_NEW_TASK
            type: 'text/html',
          });
          
          logger.info('HTML file opened in browser');
          return 'success';
        } catch (intentError) {
          logger.error('Intent launcher failed, trying Linking API', intentError);
          
          // Fallback: Try using Linking API
          try {
            const fileUri = `file://${filePath}`;
            const canOpen = await Linking.canOpenURL(fileUri);
            if (canOpen) {
              await Linking.openURL(fileUri);
              logger.info('HTML opened via Linking API');
              return 'success';
            }
          } catch (linkError) {
            logger.error('Linking API also failed', linkError);
          }
          
          // Last resort: use share dialog
          logger.info('Falling back to share dialog for preview');
          return await this.shareExportedFile(filePath);
        }
      }
      
      // For iOS, try Linking first, then fall back to share
      if (Platform.OS === 'ios') {
        try {
          // iOS can open file:// URLs directly
          const fileUri = `file://${filePath}`;
          const canOpen = await Linking.canOpenURL(fileUri);
          if (canOpen) {
            await Linking.openURL(fileUri);
            logger.info('HTML opened via Linking API on iOS');
            return 'success';
          }
        } catch (linkError) {
          logger.info('Linking failed on iOS, using share', linkError);
        }
      }
      
      // Fallback for iOS/Web: use sharing
      logger.info('Using sharing as HTML preview fallback');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/html',
          dialogTitle: 'Open HTML File',
          UTI: 'public.html',
        });
        logger.info('HTML shared for preview');
        return 'success';
      }
      
      logger.warn('No preview method available');
      return 'error';
    } catch (error) {
      logger.error('Preview error', error as Error);
      return 'error';
    }
  }

  /**
   * Preview PDF file - Opens file in PDF viewer
   */
  public async previewPDFFile(filePath: string): Promise<'success' | 'cancelled' | 'error'> {
    try {
      logger.info('Previewing PDF file', { filePath, platform: Platform.OS });
      
      // For Android, use IntentLauncher to open in PDF viewer
      if (Platform.OS === 'android') {
        try {
          const contentUri = await FileSystem.getContentUriAsync(filePath);
          logger.info('Opening PDF with Intent Launcher', { contentUri });
          
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            flags: 1, // FLAG_ACTIVITY_NEW_TASK
            type: 'application/pdf',
          });
          
          logger.info('PDF file opened in viewer');
          return 'success';
        } catch (intentError) {
          logger.error('Intent launcher failed, trying Linking API', intentError);
          
          // Fallback: Try using Linking API
          try {
            const fileUri = `file://${filePath}`;
            const canOpen = await Linking.canOpenURL(fileUri);
            if (canOpen) {
              await Linking.openURL(fileUri);
              logger.info('PDF opened via Linking API');
              return 'success';
            }
          } catch (linkError) {
            logger.error('Linking API also failed', linkError);
          }
          
          // Last resort: use share dialog
          logger.info('Falling back to share dialog for preview');
          return await this.shareExportedFile(filePath);
        }
      }
      
      // For iOS, try Linking first, then fall back to share
      if (Platform.OS === 'ios') {
        try {
          // iOS can open file:// URLs directly
          const fileUri = `file://${filePath}`;
          const canOpen = await Linking.canOpenURL(fileUri);
          if (canOpen) {
            await Linking.openURL(fileUri);
            logger.info('PDF opened via Linking API on iOS');
            return 'success';
          }
        } catch (linkError) {
          logger.info('Linking failed on iOS, using share', linkError);
        }
      }
      
      // Fallback for iOS/Web: use sharing
      logger.info('Using sharing as PDF preview fallback');
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Open PDF File',
          UTI: 'com.adobe.pdf',
        });
        logger.info('PDF shared for preview');
        return 'success';
      }
      
      logger.warn('No preview method available');
      return 'error';
    } catch (error) {
      logger.error('PDF Preview error', error as Error);
      return 'error';
    }
  }

  /**
   * Utility functions
   */
  private generateFileName(conversation: Conversation, extension: string): string {
    const date = this.formatDate(conversation.startTime).replace(/[/\\:*?"<>|]/g, '-');
    return `MediBot_Consultation_${date}.${extension}`;
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  }

  private escapeHTML(text: string): string {
    const div = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (div) {
      div.textContent = text;
      return div.innerHTML;
    }
    
    // Fallback HTML escaping
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}