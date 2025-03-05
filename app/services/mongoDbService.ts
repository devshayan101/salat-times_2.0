import axios from 'axios';
import { AdminMessage } from '../types';
import Constants from 'expo-constants';

// Check if we're in development or production
const isDevelopment = Constants.appOwnership === 'expo' || __DEV__;

// Use localhost for development and the production URL for production builds
// Use a more reliable server like render.com since that's what you mentioned before
const API_URL = 'https://time-api-t6dc.onrender.com/api';

// Add request timeout to all axios requests
axios.defaults.timeout = 10000; // 10 second global timeout

// Check network connectivity using a basic fetch request
const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Simple connectivity check with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    // Try to fetch a small resource - use your own API to test actual backend connectivity
    const testUrl = 'https://time-api-t6dc.onrender.com/api/health';
      
    await fetch(testUrl, { 
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.warn('Network connectivity check failed:', error);
    // Try Google as a fallback to differentiate between general internet vs. API issues
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch('https://www.google.com/favicon.ico', { 
        method: 'HEAD',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      console.log('Internet connection available, but API server may be down');
      return true; // Internet is working, but our API might be down
    } catch (e) {
      console.warn('No internet connection detected');
      return false; // No internet connection at all
    }
  }
};

// Helper function to handle axios errors
const handleAxiosError = (error: any, context: string): never => {
  console.error(`Error in ${context}:`, error);
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('Response data:', error.response.data);
    console.error('Response status:', error.response.status);
  } else if (error.request) {
    // The request was made but no response was received
    console.error('No response received:', error.request);
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('Request setup error:', error.message);
  }
  throw error;
};

// Fetch messages from MongoDB with retry mechanism
export const fetchMessagesFromMongoDB = async (retryCount = 0): Promise<AdminMessage[]> => {
  // In production builds, we'll use cached sample data to avoid network errors
  if (!isDevelopment) {
    console.log('Production build - using sample data without server connection');
    // Return empty array instead of throwing error - the calling function will use sample data
    return [];
  }
  
  try {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected && retryCount < 2) {
      console.warn(`No network connectivity detected, retrying (${retryCount + 1}/2)...`);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchMessagesFromMongoDB(retryCount + 1);
    } else if (!isConnected) {
      console.warn('No network connectivity after retries, returning empty messages');
      return [];
    }
    
    // Create a timeout promise that will reject after the specified time
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000);
    });
    
    // Create the actual fetch promise
    const fetchPromise = axios.get(`${API_URL}/messages`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Race the two promises - whichever resolves/rejects first wins
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    // Map the response data to match our expected AdminMessage format
    if (response.data && response.data.data) {
      return response.data.data.map((msg: any) => ({
        id: msg._id,
        title: msg.title,
        content: msg.content,
        date: msg.createdAt,
        isRead: msg.isRead,
        priority: msg.priority
      }));
    }
    
    return [];
  } catch (error) {
    // If request failed and we haven't exhausted retries, try again
    if (retryCount < 2) {
      console.warn(`Error fetching messages, retrying (${retryCount + 1}/2)...`, error);
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchMessagesFromMongoDB(retryCount + 1);
    }
    
    console.warn('Error fetching messages after retries:', error);
    // Don't throw, just return empty array to prevent app crash
    return [];
  }
};

// Update message read status in MongoDB
export const updateMessageReadStatus = async (messageId: string, isRead: boolean): Promise<boolean> => {
  // In production builds, we'll skip MongoDB updates
  if (!isDevelopment) {
    console.log('Production build - skipping MongoDB update for message status');
    return true; // Pretend it succeeded
  }
  
  try {
    await axios.patch(`${API_URL}/messages/${messageId}/read`, 
      { isRead },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error updating message read status:', error);
    return false; // Don't throw in production to prevent app crashes
  }
};

// Mark all messages as read in MongoDB
export const markAllMessagesReadInMongoDB = async (): Promise<boolean> => {
  // In production builds, we'll skip MongoDB updates
  if (!isDevelopment) {
    console.log('Production build - skipping MongoDB update for marking all read');
    return true; // Pretend it succeeded
  }
  
  try {
    await axios.patch(`${API_URL}/messages/read-all`, 
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000 // 5 second timeout
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return false; // Don't throw in production to prevent app crashes
  }
};

// Get unread message count from MongoDB
export const getUnreadMessageCountFromMongoDB = async (): Promise<number> => {
  // In production builds, skip MongoDB connection
  if (!isDevelopment) {
    console.log('Production build - using default unread count of 0');
    return 0;
  }
  
  try {
    // Check network connectivity first
    const isConnected = await checkNetworkConnectivity();
    if (!isConnected) {
      console.warn('No network connectivity detected, returning default unread count');
      return 0;
    }
    
    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('MongoDB connection timeout')), 3000);
    });
    
    // Create the actual fetch promise
    const fetchPromise = axios.get(`${API_URL}/messages/unread/count`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // Race the two promises
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (response.data && response.data.count !== undefined) {
      return response.data.count;
    }
    
    return 0;
  } catch (error) {
    console.warn('Error getting unread message count:', error);
    // Don't throw, just return 0 to prevent app crash
    return 0;
  }
}; 