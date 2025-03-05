import { AdminMessage } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  fetchMessagesFromMongoDB, 
  updateMessageReadStatus, 
  markAllMessagesReadInMongoDB,
  getUnreadMessageCountFromMongoDB
} from './mongoDbService';

// Storage key for caching messages
const CACHED_MESSAGES_KEY = 'cached_admin_messages';
const CACHE_TIMESTAMP_KEY = 'cached_admin_messages_timestamp';
const CACHE_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

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

// Save messages to AsyncStorage for offline access
const cacheMessages = async (messages: AdminMessage[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(CACHED_MESSAGES_KEY, JSON.stringify(messages));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
    console.log('Messages cached successfully');
  } catch (error) {
    console.warn('Failed to cache messages:', error);
  }
};

// Load cached messages from AsyncStorage
const loadCachedMessages = async (): Promise<AdminMessage[] | null> => {
  try {
    const cachedMessagesJson = await AsyncStorage.getItem(CACHED_MESSAGES_KEY);
    const cacheTimestamp = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!cachedMessagesJson || !cacheTimestamp) {
      return null;
    }
    
    // Check if cache is still valid
    const timestamp = parseInt(cacheTimestamp, 10);
    const now = Date.now();
    if (now - timestamp > CACHE_MAX_AGE) {
      console.log('Cached messages are too old, fetching new ones');
      return null;
    }
    
    const cachedMessages = JSON.parse(cachedMessagesJson) as AdminMessage[];
    console.log(`Loaded ${cachedMessages.length} messages from cache`);
    return cachedMessages;
  } catch (error) {
    console.warn('Failed to load cached messages:', error);
    return null;
  }
};

// Initialize admin messages - now supports MongoDB and caching
export const initializeAdminMessages = async (): Promise<void> => {
  // Set a timeout for the entire operation
  let timeoutId: NodeJS.Timeout | null = null;
  
  try {
    // Create a promise that will reject after 5 seconds
    const timeoutPromise = new Promise<void>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error('Initialize admin messages timed out'));
      }, 5000);
    });
    
    // Create the actual initialization promise
    const initPromise = (async () => {
      try {
        // First try to load from cache to show something quickly
        const cachedMessages = await loadCachedMessages();
        if (cachedMessages && cachedMessages.length > 0) {
          inMemoryMessages = cachedMessages;
          isInitialized = true;
          console.log('Using cached messages while fetching fresh data');
        }
        
        // Try to fetch fresh messages from MongoDB
        const mongoMessages = await fetchMessagesFromMongoDB();
        if (mongoMessages && mongoMessages.length > 0) {
          inMemoryMessages = mongoMessages;
          // Cache the fresh messages for future use
          cacheMessages(mongoMessages);
        } else if (!cachedMessages || cachedMessages.length === 0) {
          // If no MongoDB messages and no cache, use sample data
          inMemoryMessages = [...SAMPLE_MESSAGES];
          console.log('Using sample messages as fallback');
        }
      } catch (error) {
        console.warn('Error fetching messages from MongoDB, using cached or sample data:', error);
        
        // Try cached messages if fetching failed
        if (!isInitialized) {
          const cachedMessages = await loadCachedMessages();
          if (cachedMessages && cachedMessages.length > 0) {
            inMemoryMessages = cachedMessages;
            console.log('Using cached messages due to fetch error');
          } else {
            // If no cache available, use sample data
            inMemoryMessages = [...SAMPLE_MESSAGES];
            console.log('Using sample messages as fallback');
          }
        }
      }
      isInitialized = true;
    })();
    
    // Race the two promises
    await Promise.race([initPromise, timeoutPromise]);
  } catch (error) {
    // Handle any errors (including timeout)
    console.warn('Error or timeout initializing admin messages, using sample data:', error);
    
    // Try to load from cache as last resort
    try {
      const cachedMessages = await loadCachedMessages();
      if (cachedMessages && cachedMessages.length > 0) {
        inMemoryMessages = cachedMessages;
        console.log('Loaded messages from cache after error');
      } else {
        inMemoryMessages = [...SAMPLE_MESSAGES];
        console.log('Using sample messages after initialization error');
      }
    } catch (e) {
      inMemoryMessages = [...SAMPLE_MESSAGES];
      console.log('Using sample messages after all recovery attempts failed');
    }
    
    isInitialized = true;
  } finally {
    // Clean up the timeout
    if (timeoutId) clearTimeout(timeoutId);
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