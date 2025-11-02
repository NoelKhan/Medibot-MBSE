import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { AppColors } from '../theme/colors';
import chatApiService, { ChatMessage } from '../services/ChatApiService';
import { EnhancedAIService } from '../services/EnhancedAIService';
import { authService } from '../services/auth';
import { Message } from '../types/Medical';
import { createLogger } from '../services/Logger';

const logger = createLogger('ChatScreen');

const ChatScreen = ({ navigation }: any) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isOnline, setIsOnline] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const enhancedAI = EnhancedAIService.getInstance();

  useEffect(() => {
    // Load user auth state
    loadAuthState();
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const loadAuthState = async () => {
    try {
      const authState = await authService.loadAuthState();
      if (authState && authState.user) {
        setToken(authState.accessToken);
        setUser(authState.user);
        chatApiService.setToken(authState.accessToken);
        
        // Load conversation history if logged in
        loadConversationHistory();
      } else {
        // Try to get current user if already in memory
        const user = authService.getCurrentUser();
        if (user) {
          setUser(user);
        }
      }
    } catch (error) {
      logger.debug('No auth state found', error);
    }
  };

  const loadConversationHistory = async () => {
    try {
      const conversations = await chatApiService.getConversations();
      if (conversations.length > 0) {
        // Load most recent active conversation
        const active = conversations.find((c) => c.status === 'active');
        if (active && active.messages) {
          setConversationId(active.id);
          setMessages(active.messages);
        }
      }
    } catch (error) {
      logger.debug('Could not load conversation history', error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userContent = inputText.trim();
    setInputText('');
    setLoading(true);

    // Create temporary user message
    const tempUserMessage: ChatMessage = {
      id: `temp_user_${Date.now()}`,
      conversationId: conversationId || 'temp',
      content: userContent,
      sender: 'user',
      messageType: 'text',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      if (token && isOnline) {
        // Try backend API
        const response = await chatApiService.sendMessage({
          conversationId,
          content: userContent,
        });

        // Update with real messages from backend
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
          return [...filtered, response.userMessage, response.aiMessage];
        });

        // Save conversation ID for future messages
        if (!conversationId && response.userMessage.conversationId) {
          setConversationId(response.userMessage.conversationId);
        }
      } else {
        // Fallback to offline AI
        throw new Error('Offline mode');
      }
    } catch (error) {
      logger.info('Using offline AI fallback', error);
      setIsOnline(false);

      // Use offline EnhancedAI service - convert messages format
      const historyMessages: Message[] = messages.map((m) => ({
        id: m.id,
        content: m.content,
        sender: m.sender === 'staff' ? 'provider' : (m.sender as 'user' | 'bot'),
        timestamp: m.createdAt,
        type: m.messageType as 'text' | 'image',
      }));

      const aiResponse = await enhancedAI.generateSmartResponse(
        userContent,
        historyMessages,
        user || { id: 'guest', email: 'guest', role: 'guest' },
      );

      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        conversationId: conversationId || 'offline',
        content: aiResponse.content,
        sender: 'ai',
        messageType: 'text',
        metadata: aiResponse.metadata,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      if (!token) {
        // Show login prompt for guests
        setTimeout(() => {
          Alert.alert(
            'Save Your Conversation',
            'Login to save your conversation history and access advanced features.',
            [
              { text: 'Later', style: 'cancel' },
              {
                text: 'Login',
                onPress: () => navigation.navigate('Login'),
              },
            ],
          );
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={AppColors.primary} />
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>MediBot AI</Text>
          {!isOnline && (
            <Text style={styles.offlineIndicator}>● Offline Mode</Text>
          )}
        </View>
        <TouchableOpacity onPress={() => setShowProfile(true)} style={styles.headerButton}>
          <MaterialIcons name="person" size={24} color={AppColors.primary} />
          <Text style={styles.headerButtonText}>Profile</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              <MaterialIcons name="health-and-safety" size={64} color={AppColors.primary} />
              <Text style={styles.welcomeTitle}>Welcome to MediBot AI</Text>
              <Text style={styles.welcomeText}>
                I'm here to help with your medical questions. Describe your symptoms or ask me anything about your health.
              </Text>
            </View>
          )}
          {messages.map((item) => (
            <View
              key={item.id}
              style={[
                styles.messageContainer,
                item.sender === 'user' ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <View style={styles.messageHeader}>
                <MaterialIcons
                  name={item.sender === 'user' ? 'person' : 'smart-toy'}
                  size={16}
                  color={item.sender === 'user' ? AppColors.primary : AppColors.secondary}
                />
                <Text style={styles.messageSender}>
                  {item.sender === 'user' ? 'You' : 'MediBot AI'}
                </Text>
              </View>
              <Text style={styles.messageText}>{item.content}</Text>
              {item.metadata?.analysis?.severity === 'emergency' && (
                <View style={styles.emergencyBadge}>
                  <MaterialIcons name="warning" size={16} color="#fff" />
                  <Text style={styles.emergencyText}>EMERGENCY</Text>
                </View>
              )}
            </View>
          ))}
          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={AppColors.primary} />
              <Text style={styles.loadingText}>MediBot is thinking...</Text>
            </View>
          )}
        </ScrollView>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Describe your symptoms..."
            placeholderTextColor={AppColors.textSecondary}
            multiline
            maxLength={500}
            editable={!loading}
            textAlignVertical="top"
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendButton} disabled={!inputText.trim() || loading}>
            <MaterialIcons name="send" size={18} color={loading ? AppColors.border : "#FFFFFF"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <Modal visible={showProfile} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Profile</Text>
            <TouchableOpacity onPress={() => setShowProfile(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 18,
    paddingVertical: 18,
    backgroundColor: AppColors.backgroundSecondary,
    borderBottomWidth: 2,
    borderBottomColor: AppColors.border,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: AppColors.backgroundSecondary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.primary,
  },
  headerButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: AppColors.primary,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 12,
    backgroundColor: AppColors.chatBotBubble,
    borderRadius: 8,
  },
  messageText: {
    color: AppColors.textPrimary,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.chatInputBackground,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 8,
    padding: 8,
    color: AppColors.textPrimary,
    backgroundColor: AppColors.background,
    minHeight: 40,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: AppColors.primary,
    borderRadius: 8,
    padding: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: AppColors.backgroundSecondary,
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  offlineIndicator: {
    fontSize: 12,
    color: AppColors.warning,
    fontWeight: '500',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: AppColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  userMessage: {
    backgroundColor: AppColors.primary,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  aiMessage: {
    backgroundColor: AppColors.backgroundSecondary,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textSecondary,
    marginRight: 8,
  },
  emergencyBadge: {
    backgroundColor: AppColors.error,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  emergencyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});

export default ChatScreen;
