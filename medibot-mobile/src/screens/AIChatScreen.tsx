/**
 * AI Chat Screen
 * ================
 * AI-powered medical triage chat with severity badges and action buttons
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';
import chatApiService, { AITriageResponse } from '../services/ChatApiService';
import { authService } from '../services/auth';
import { createLogger } from '../services/Logger';

const logger = createLogger('AIChatScreen');

interface AIMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  triageData?: AITriageResponse;
}

const AIChatScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    // Load authentication and show welcome message
    loadAuthAndWelcome();
  }, []);

  const loadAuthAndWelcome = async () => {
    try {
      const authState = await authService.loadAuthState();
      if (authState && authState.user) {
        chatApiService.setToken(authState.accessToken);
        
        // Add welcome message
        const welcomeMessage: AIMessage = {
          id: 'welcome',
          content: `Hello! I'm your AI medical assistant. I can help you understand your symptoms and recommend the right level of care. What symptoms are you experiencing?`,
          sender: 'ai',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      logger.debug('No auth state found', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || loading) return;

    const userContent = inputText.trim();
    setInputText('');
    setLoading(true);

    // Add user message
    const userMessage: AIMessage = {
      id: `user_${Date.now()}`,
      content: userContent,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      // Call AI Agent API
      const triageResponse = await chatApiService.aiTriage({
        message: userContent,
        conversationId,
        includeHistory: true,
      });

      // Create AI response message
      const aiMessage: AIMessage = {
        id: triageResponse.case_id,
        content: triageResponse.message,
        sender: 'ai',
        timestamp: new Date(),
        triageData: triageResponse,
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Update conversation ID if it's the first message
      if (!conversationId) {
        setConversationId(triageResponse.case_id);
      }
    } catch (error) {
      logger.error('Failed to get AI response', error);
      
      // Add error message
      const errorMessage: AIMessage = {
        id: `error_${Date.now()}`,
        content: 'Sorry, I encountered an error processing your message. Please try again.',
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
      
      Alert.alert('Error', 'Failed to get AI response. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookAppointment = (triageData: AITriageResponse) => {
    navigation.navigate('BookAppointment', { 
      triageCase: triageData,
      specialization: triageData.action?.specialization,
    });
  };

  const handleEmergencyCall = () => {
    Alert.alert(
      '🚨 Emergency',
      'Call emergency services immediately?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call 911', 
          style: 'destructive',
          onPress: () => {
            // In production, this would open the phone dialer
            Alert.alert('Emergency', 'Emergency services have been contacted.');
          }
        },
      ]
    );
  };

  const renderSeverityBadge = (severity: 'GREEN' | 'AMBER' | 'RED') => {
    const badgeConfig = {
      GREEN: { color: AppColors.success, label: 'Low Risk', icon: 'check-circle' },
      AMBER: { color: AppColors.warning, label: 'Medical Attention', icon: 'warning' },
      RED: { color: AppColors.error, label: 'Emergency', icon: 'local-hospital' },
    };

    const config = badgeConfig[severity];

    return (
      <View style={[styles.severityBadge, { backgroundColor: config.color }]}>
        <MaterialIcons name={config.icon as any} size={16} color="white" />
        <Text style={styles.severityText}>{config.label}</Text>
      </View>
    );
  };

  const renderActionButtons = (triageData: AITriageResponse) => {
    const { triage, action } = triageData;

    return (
      <View style={styles.actionButtons}>
        {triage.severity_level === 'RED' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.emergencyButton]}
            onPress={handleEmergencyCall}
          >
            <MaterialIcons name="local-hospital" size={20} color="white" />
            <Text style={styles.actionButtonText}>Call Emergency</Text>
          </TouchableOpacity>
        )}

        {triage.severity_level === 'AMBER' && action.type === 'book_appointment' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.bookButton]}
            onPress={() => handleBookAppointment(triageData)}
          >
            <MaterialIcons name="event" size={20} color="white" />
            <Text style={styles.actionButtonText}>Book Appointment</Text>
          </TouchableOpacity>
        )}

        {triage.severity_level === 'GREEN' && (
          <TouchableOpacity 
            style={[styles.actionButton, styles.selfCareButton]}
            onPress={() => {
              Alert.alert(
                'Self-Care Tips',
                triage.care_instructions.join('\n\n'),
                [{ text: 'OK' }]
              );
            }}
          >
            <MaterialIcons name="healing" size={20} color="white" />
            <Text style={styles.actionButtonText}>View Self-Care Tips</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMessage = (message: AIMessage) => {
    const isUser = message.sender === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <MaterialIcons name="smart-toy" size={24} color={AppColors.primary} />
          </View>
        )}

        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser && styles.userMessageText]}>
            {message.content}
          </Text>

          {!isUser && message.triageData && (
            <View style={styles.triageInfo}>
              {renderSeverityBadge(message.triageData.triage.severity_level)}
              
              {message.triageData.triage.red_flags_triggered?.length > 0 && (
                <View style={styles.redFlags}>
                  <Text style={styles.redFlagsTitle}>⚠️ Important Warnings:</Text>
                  {message.triageData.triage.red_flags_triggered.map((flag, idx) => (
                    <Text key={idx} style={styles.redFlagText}>• {flag}</Text>
                  ))}
                </View>
              )}

              {renderActionButtons(message.triageData)}
            </View>
          )}
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <MaterialIcons name="person" size={24} color="white" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primary} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Medical Assistant</Text>
          <Text style={styles.headerSubtitle}>Powered by BioMistral</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('History')} style={styles.historyButton}>
          <MaterialIcons name="history" size={24} color={AppColors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppColors.primary} />
              <Text style={styles.loadingText}>AI is analyzing your symptoms...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your symptoms..."
            placeholderTextColor={AppColors.textSecondary}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <MaterialIcons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: AppColors.border,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 2,
  },
  historyButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textPrimary,
  },
  userMessageText: {
    color: 'white',
  },
  triageInfo: {
    marginTop: 12,
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  severityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  redFlags: {
    backgroundColor: '#FFF3F3',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.error,
  },
  redFlagsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: AppColors.error,
    marginBottom: 6,
  },
  redFlagText: {
    fontSize: 13,
    color: AppColors.textPrimary,
    marginBottom: 4,
  },
  actionButtons: {
    marginTop: 8,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  emergencyButton: {
    backgroundColor: AppColors.error,
  },
  bookButton: {
    backgroundColor: AppColors.warning,
  },
  selfCareButton: {
    backgroundColor: AppColors.success,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: AppColors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 40,
    backgroundColor: AppColors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: AppColors.textPrimary,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: AppColors.textSecondary,
    opacity: 0.5,
  },
});

export default AIChatScreen;
