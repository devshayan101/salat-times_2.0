import { AdminMessage } from '../types';
import { 
  fetchMessagesFromMongoDB, 
  updateMessageReadStatus, 
  markAllMessagesReadInMongoDB,
  getUnreadMessageCountFromMongoDB
} from './mongoDbService';

// Hard-coded sample messages that don't rely on AsyncStorage - these will be used as fallback
const SAMPLE_MESSAGES: AdminMessage[] = [
  {
    id: '1',
    title: 'Welcome to Salat Time App',
    content: 'Thank you for downloading our application. This app helps you keep track of prayer times and provides other useful features for Muslims.',
    date: new Date().toISOString(),
    isRead: false,
    priority: 'high',
  },
  {
    id: '2',
    title: 'Ramadan Mubarak',
    content: 'Ramadan Mubarak to all our users. May this holy month bring peace, happiness, and prosperity to you and your family.',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    isRead: false,
    priority: 'normal',
  },
  {
    id: '3',
    title: 'New Features Added',
    content: 'We have added new features to the app including Qibla direction, Tasbih counter, and custom admin messages. Check them out and let us know what you think!',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: false,
    priority: 'normal',
  },
];

// In-memory messages store - initialized with sample data
let inMemoryMessages = [...SAMPLE_MESSAGES];
let isInitialized = false;

// Initialize admin messages - now supports MongoDB
export const initializeAdminMessages = async (): Promise<void> => {
  try {
    // Try to fetch messages from MongoDB
    const mongoMessages = await fetchMessagesFromMongoDB();
    inMemoryMessages = mongoMessages;
    isInitialized = true;
  } catch (error) {
    console.error('Error fetching messages from MongoDB, using sample data:', error);
    // If MongoDB fetch fails, use sample data
    inMemoryMessages = [...SAMPLE_MESSAGES];
    isInitialized = true;
  }
};

// For backward compatibility - synchronous version that just returns in-memory data
export const initializeAdminMessagesSync = (): void => {
  if (!isInitialized) {
    inMemoryMessages = [...SAMPLE_MESSAGES];
    isInitialized = true;
  }
};

// Get all admin messages - async version for MongoDB
export const getAdminMessagesAsync = async (): Promise<AdminMessage[]> => {
  try {
    // Try to fetch fresh data if needed
    if (!isInitialized) {
      await initializeAdminMessages();
    }
    return [...inMemoryMessages];
  } catch (error) {
    console.error('Error getting admin messages:', error);
    return [...SAMPLE_MESSAGES];
  }
};

// Get all admin messages - synchronous function for backward compatibility
export const getAdminMessages = (): AdminMessage[] => {
  // Return a copy of the in-memory messages
  if (!isInitialized) {
    initializeAdminMessagesSync();
  }
  return [...inMemoryMessages];
};

// Mark a message as read - async version for MongoDB
export const markMessageAsReadAsync = async (messageId: string): Promise<boolean> => {
  try {
    // Update message in MongoDB
    const success = await updateMessageReadStatus(messageId, true);
    
    // Update local cache regardless of MongoDB result
    inMemoryMessages = inMemoryMessages.map(message => 
      message.id === messageId ? { ...message, isRead: true } : message
    );
    
    return success;
  } catch (error) {
    console.error('Error marking message as read:', error);
    // Still update local cache even if MongoDB fails
    inMemoryMessages = inMemoryMessages.map(message => 
      message.id === messageId ? { ...message, isRead: true } : message
    );
    return false;
  }
};

// Mark a message as read - synchronous function for backward compatibility
export const markMessageAsRead = (messageId: string): boolean => {
  try {
    // Update in-memory messages
    inMemoryMessages = inMemoryMessages.map(message => 
      message.id === messageId ? { ...message, isRead: true } : message
    );
    
    // Schedule async update to MongoDB
    updateMessageReadStatus(messageId, true).catch(error => 
      console.error('Error updating message read status in MongoDB:', error)
    );
    
    return true;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return false;
  }
};

// Mark all messages as read - async version for MongoDB
export const markAllMessagesAsReadAsync = async (): Promise<boolean> => {
  try {
    // Update all messages in MongoDB
    const success = await markAllMessagesReadInMongoDB();
    
    // Update local cache regardless of MongoDB result
    inMemoryMessages = inMemoryMessages.map(message => ({ ...message, isRead: true }));
    
    return success;
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    // Still update local cache even if MongoDB fails
    inMemoryMessages = inMemoryMessages.map(message => ({ ...message, isRead: true }));
    return false;
  }
};

// Mark all messages as read - synchronous function for backward compatibility
export const markAllMessagesAsRead = (): boolean => {
  try {
    // Update all in-memory messages
    inMemoryMessages = inMemoryMessages.map(message => ({ ...message, isRead: true }));
    
    // Schedule async update to MongoDB
    markAllMessagesReadInMongoDB().catch(error => 
      console.error('Error marking all messages as read in MongoDB:', error)
    );
    
    return true;
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return false;
  }
};

// Count unread messages - async version for MongoDB
export const getUnreadMessageCountAsync = async (): Promise<number> => {
  try {
    return await getUnreadMessageCountFromMongoDB();
  } catch (error) {
    console.error('Error counting unread messages from MongoDB:', error);
    return inMemoryMessages.filter(message => !message.isRead).length;
  }
};

// Count unread messages - synchronous function for backward compatibility
export const getUnreadMessageCount = (): number => {
  try {
    return inMemoryMessages.filter(message => !message.isRead).length;
  } catch (error) {
    console.error('Error counting unread messages:', error);
    return 0;
  }
}; 