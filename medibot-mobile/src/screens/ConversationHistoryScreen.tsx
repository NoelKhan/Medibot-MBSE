import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Conversation } from '../types/Medical';
import { storageService } from '../services/storage';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import EmptyState from '../components/EmptyState';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';
import { useResponsive } from '../hooks/useResponsive';

const logger = createLogger('ConversationHistoryScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'ConversationHistory'>;

// Create dynamic styles based on theme
const createStyles = (colors: ThemeColors, responsive: any) => {
  const isLandscape = responsive.isLandscape;
  const isTablet = responsive.isTablet;
  const contentPadding = isTablet ? 24 : 16;
  
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  bannerHeader: {
    backgroundColor: colors.primary, // Use theme primary color
    paddingBottom: isLandscape && !isTablet ? 12 : 16,
    paddingHorizontal: contentPadding,
    // paddingTop is set inline using insets.top
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 4,
  },
  backButton: {
    padding: 4,
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: contentPadding,
    paddingVertical: isTablet ? 14 : 12,
  backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  conversationCount: {
    fontSize: isTablet ? 18 : 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
  },
  newChatText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  conversationsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  conversationItem: {
  backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationDate: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  deleteButton: {
    padding: 4,
  },
  conversationSummary: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageCount: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  duration: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
};

const ConversationHistoryScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const styles = createStyles(colors, responsive);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    trackScreen('ConversationHistoryScreen', {
      userId: user.id,
      userRole: user.role
    });
    
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const userConversations = await storageService.get<Conversation[]>(`user_conversations_${user.id}`) || [];
      setConversations(userConversations.sort((a: Conversation, b: Conversation) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      ));
    } catch (error) {
      logger.error('Error loading conversations', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeConversation = (conversation: Conversation) => {
    navigation.navigate('Chat', { 
      user, 
      conversationId: conversation.id 
    });
  };

  const handleDeleteConversation = (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete conversation from storage
              const conversations = await storageService.get<Conversation[]>(`user_conversations_${user.id}`) || [];
              const updated = conversations.filter(c => c.id !== conversationId);
              await storageService.set(`user_conversations_${user.id}`, updated);
              setConversations(prev => prev.filter(c => c.id !== conversationId));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete conversation');
            }
          },
        },
      ]
    );
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const startTime = new Date(item.startTime);
    const duration = item.endTime 
      ? Math.round((new Date(item.endTime).getTime() - startTime.getTime()) / 1000 / 60)
      : null;

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'completed': return '#4CAF50';
        case 'escalated': return '#F44336';
        default: return '#FF9800';
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'completed': return 'check-circle';
        case 'escalated': return 'warning';
        default: return 'access-time';
      }
    };

    return (
      <TouchableOpacity 
        style={styles.conversationItem}
        onPress={() => handleResumeConversation(item)}
      >
        <View style={styles.conversationHeader}>
          <View style={styles.conversationInfo}>
            <Text style={styles.conversationDate}>
              {startTime.toLocaleDateString()} at {startTime.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
            <View style={styles.statusContainer}>
              <MaterialIcons 
                name={getStatusIcon(item.status)} 
                size={16} 
                color={getStatusColor(item.status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                {item.status && item.status.length > 0 
                  ? item.status.charAt(0).toUpperCase() + item.status.slice(1)
                  : 'Active'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteConversation(item.id)}
          >
            <MaterialIcons name="delete" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>

        <Text style={styles.conversationSummary} numberOfLines={2}>
          {item.summary || 
           (item.messages?.length > 1 && item.messages[1]?.content
             ? item.messages[1].content 
             : 'Medical consultation session')}
        </Text>

        <View style={styles.conversationFooter}>
          <Text style={styles.messageCount}>
            {item.messages?.length || 0} message{(item.messages?.length || 0) !== 1 ? 's' : ''}
          </Text>
          {duration && (
            <Text style={styles.duration}>
              {duration} minute{duration !== 1 ? 's' : ''}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <EmptyState
      icon="chat-bubble-outline"
      title="No Conversations Yet"
      message="Start a new consultation with MediBot to see your conversation history here."
      actionLabel="Start New Consultation"
      onAction={() => navigation.navigate('Chat', { user })}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={isDark ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background}
        />
        {/* Single Blue Banner Header with safe area padding */}
        <View style={[styles.bannerHeader, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Chat History</Text>
            <Text style={styles.headerSubtitle}>Your medical conversations</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      {/* Single Blue Banner Header with safe area padding */}
      <View style={[styles.bannerHeader, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Chat History</Text>
          <Text style={styles.headerSubtitle}>Your medical conversations</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>
      {conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <>
          <View style={styles.header}>
            <Text style={styles.conversationCount}>
              {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              style={styles.newChatButton}
              onPress={() => navigation.navigate('Chat', { user })}
            >
              <MaterialIcons name="add" size={20} color={colors.primary} />
              <Text style={styles.newChatText}>New Chat</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={conversations}
            renderItem={renderConversationItem}
            keyExtractor={(item) => item.id}
            style={styles.conversationsList}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const ConversationHistoryScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <ConversationHistoryScreen {...props} />
  </ErrorBoundary>
);

export default ConversationHistoryScreenWithErrorBoundary;