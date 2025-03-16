import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AdminMessage } from '../types';
import { 
  getAdminMessagesAsync, 
  markMessageAsReadAsync, 
  markAllMessagesAsReadAsync
} from '../services/adminMessageService';
import { useTheme } from '../utils/ThemeContext';

export default function MessagesScreen() {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Load messages when the component mounts
  useEffect(() => {
    loadMessages();
  }, []);
  
  // Load messages from the service
  const loadMessages = async () => {
    try {
      setLoading(true);
      const fetchedMessages = await getAdminMessagesAsync();
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Handle pull-to-refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };
  
  // Toggle message expansion and mark as read
  const toggleMessage = async (messageId: string) => {
    // If the message is already expanded, collapse it
    if (expandedMessage === messageId) {
      setExpandedMessage(null);
      return;
    }
    
    // Expand the message
    setExpandedMessage(messageId);
    
    // Find the message
    const message = messages.find(m => m.id === messageId);
    
    // If the message is unread, mark it as read
    if (message && !message.isRead) {
      try {
        // Mark the message as read
        await markMessageAsReadAsync(messageId);
        
        // Update the local state
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, isRead: true } : m
        ));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };
  
  // Mark all messages as read
  const handleMarkAllAsRead = async () => {
    try {
      // Mark all messages as read in the service
      await markAllMessagesAsReadAsync();
      
      // Update the local state
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    } catch (error) {
      console.error('Error marking all messages as read:', error);
    }
  };
  
  // Format a date string to a readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) {
      return 'Today';
    } else if (diff === 1) {
      return 'Yesterday';
    } else if (diff < 7) {
      return `${diff} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Render an empty state when there are no messages
  const renderEmptyState = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.cardBackground }]}>
      <Ionicons name="mail-open-outline" size={64} color={theme.textDisabled} />
      <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Messages</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        You don't have any messages at the moment. Check back later for updates.
      </Text>
    </View>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={styles.container}>
        <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Messages</Text>
          
          <TouchableOpacity 
            style={styles.markAllButton} 
            onPress={handleMarkAllAsRead}
            disabled={messages.every(m => m.isRead)}
          >
            <Text style={[
              styles.markAllText, 
              { 
                color: messages.every(m => m.isRead) 
                  ? theme.textDisabled 
                  : theme.primary 
              }
            ]}>
              Mark All Read
            </Text>
          </TouchableOpacity>
        </View>
        
        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <FlatList
            data={messages}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            ListEmptyComponent={renderEmptyState}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.messageItem,
                  { backgroundColor: theme.cardBackground },
                  !item.isRead && { borderLeftColor: theme.unread, borderLeftWidth: 4 }
                ]}
                onPress={() => toggleMessage(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.messageHeader}>
                  <View style={styles.titleRow}>
                    <Text 
                      style={[
                        styles.messageTitle, 
                        { color: theme.textPrimary },
                        !item.isRead && styles.messageTitleUnread
                      ]}
                      numberOfLines={expandedMessage === item.id ? undefined : 1}
                    >
                      {item.title}
                    </Text>
                    
                    {item.priority === 'high' && (
                      <View style={[styles.priorityBadge, { backgroundColor: theme.highPriority }]}>
                        <Text style={styles.priorityText}>Important</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={[styles.messageDate, { color: theme.textSecondary }]}>
                    {formatDate(item.date)}
                  </Text>
                </View>
                
                {expandedMessage === item.id && (
                  <Text style={[styles.messageContent, { color: theme.textSecondary }]}>
                    {item.content}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    flexGrow: 1,
    padding: 16,
  },
  messageItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageHeader: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  messageTitleUnread: {
    fontWeight: 'bold',
  },
  messageDate: {
    fontSize: 12,
  },
  messageContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    borderRadius: 8,
    marginVertical: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 