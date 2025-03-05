import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl, 
  Animated, 
  ActivityIndicator 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AdminMessage } from '../types';
import { 
  getAdminMessagesAsync, 
  markMessageAsReadAsync, 
  markAllMessagesAsReadAsync,
  initializeAdminMessages
} from '../services/adminMessageService';
import { useTheme } from '../utils/ThemeContext';

export default function MessagesScreen() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const { theme, isDark } = useTheme();

  // Load messages on component mount
  useEffect(() => {
    loadMessages();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      fadeAnim.setValue(0);
    };
  }, []);

  // Reload messages when theme changes to prevent content loss
  useEffect(() => {
    // No need to reset messages, just ensure they're styled correctly
    // We don't want to actually reload the data which would destroy state
  }, [theme, isDark]);

  // Load messages function - now using asynchronous functions
  const loadMessages = async () => {
    try {
      setLoading(true);
      
      // Initialize messages from MongoDB
      await initializeAdminMessages();
      
      // Get messages from MongoDB
      const adminMessages = await getAdminMessagesAsync();
      
      // Sort messages
      const sortedMessages = [...adminMessages].sort((a, b) => {
        // First sort by priority
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        
        // Then sort by date (newest first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
      
      setMessages(sortedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refreshing the messages list
  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  // Handle expanding/collapsing a message and marking it as read
  const toggleMessage = async (messageId: string) => {
    try {
      if (expandedMessageId === messageId) {
        setExpandedMessageId(null);
      } else {
        setExpandedMessageId(messageId);
        
        // Mark message as read if it's unread
        const messageToMark = messages.find(m => m.id === messageId);
        if (messageToMark && !messageToMark.isRead) {
          await markMessageAsReadAsync(messageId);
          // Update the messages state to reflect the read status
          setMessages(prevMessages => 
            prevMessages.map(msg => 
              msg.id === messageId ? { ...msg, isRead: true } : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error toggling message:', error);
    }
  };

  // Mark all messages as read
  const handleMarkAllAsRead = async () => {
    try {
      await markAllMessagesAsReadAsync();
      setMessages(prevMessages => 
        prevMessages.map(msg => ({ ...msg, isRead: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Format date to a readable string
  const formatDate = (dateString: string) => {
    try {
      const messageDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - messageDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return messageDate.toLocaleDateString();
      }
    } catch (error) {
      return 'Unknown date';
    }
  };

  // Render empty state when no messages
  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Ionicons name="chatbubble-outline" size={60} color={theme.textDisabled} />
      <Text style={[styles.emptyText, { color: theme.textPrimary }]}>No messages</Text>
      <Text style={[styles.emptySubText, { color: theme.textSecondary }]}>
        You don't have any messages from the admin yet.
      </Text>
      <TouchableOpacity 
        style={[styles.debugButton, { backgroundColor: theme.primary }]}
        onPress={onRefresh}
      >
        <Text style={styles.debugButtonText}>Refresh Messages</Text>
      </TouchableOpacity>
    </View>
  );

  // Create dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: theme.background,
    },
    content: {
      backgroundColor: theme.background,
    },
    title: {
      color: theme.textPrimary,
    },
    markAllBtnText: {
      color: theme.primary,
    },
    messageCard: {
      backgroundColor: theme.cardBackground,
      borderLeftColor: theme.cardBackground,
      borderBottomColor: theme.divider,
      borderBottomWidth: 1,
    },
    unreadMessage: {
      borderLeftColor: theme.unread,
      backgroundColor: isDark ? theme.surface : '#EBF5FF',
    },
    highPriorityMessage: {
      borderLeftColor: theme.highPriority,
    },
    expandedMessage: {
      backgroundColor: isDark ? theme.surface : '#F3F4F6',
    },
    messageTitle: {
      color: theme.textPrimary,
    },
    messageDate: {
      color: theme.textDisabled,
    },
    messagePreview: {
      color: theme.textSecondary,
    },
    messageContent: {
      color: theme.textSecondary,
    },
  };

  return (
    <SafeAreaView 
      style={[styles.container, dynamicStyles.container]} 
      edges={['top', 'left', 'right']}
    >
      <Animated.View style={[styles.content, dynamicStyles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          <Text style={[styles.title, dynamicStyles.title]}>Admin Messages</Text>
          {messages.some(msg => !msg.isRead) && (
            <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
              <Text style={[styles.markAllBtnText, dynamicStyles.markAllBtnText]}>Mark all as read</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
          >
            {messages.length === 0 ? (
              renderEmptyState()
            ) : (
              messages.map((message) => (
                <TouchableOpacity
                  key={message.id}
                  style={[
                    styles.messageCard,
                    dynamicStyles.messageCard,
                    !message.isRead && [styles.unreadMessage, dynamicStyles.unreadMessage],
                    message.priority === 'high' && [styles.highPriorityMessage, dynamicStyles.highPriorityMessage],
                    expandedMessageId === message.id && [styles.expandedMessage, dynamicStyles.expandedMessage],
                  ]}
                  onPress={() => toggleMessage(message.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.messageHeader}>
                    <View style={styles.messageHeaderLeft}>
                      {!message.isRead && <View style={[styles.unreadDot, { backgroundColor: theme.unread }]} />}
                      {message.priority === 'high' && (
                        <Ionicons name="alert-circle" size={18} color={theme.highPriority} style={styles.priorityIcon} />
                      )}
                      <Text style={[styles.messageTitle, dynamicStyles.messageTitle]}>{message.title}</Text>
                    </View>
                    <Text style={[styles.messageDate, dynamicStyles.messageDate]}>
                      {formatDate(message.date)}
                    </Text>
                  </View>
                  {expandedMessageId === message.id ? (
                    <Text style={[styles.messageContent, dynamicStyles.messageContent]}>
                      {message.content}
                    </Text>
                  ) : (
                    <Text style={[styles.messagePreview, dynamicStyles.messagePreview]} numberOfLines={2}>
                      {message.content}
                    </Text>
                  )}
                  <View style={styles.expandIconContainer}>
                    <Ionicons
                      name={expandedMessageId === message.id ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={theme.textDisabled}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  markAllBtn: {
    padding: 8,
  },
  markAllBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
  },
  messageCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadMessage: {
    // Style will be combined with dynamicStyles
  },
  highPriorityMessage: {
    // Style will be combined with dynamicStyles
  },
  expandedMessage: {
    // Style will be combined with dynamicStyles
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  priorityIcon: {
    marginRight: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  messageDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  messagePreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  expandIconContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  debugButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 