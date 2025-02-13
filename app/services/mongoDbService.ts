import axios from 'axios';
import { AdminMessage } from '../types';

// MongoDB Atlas API URL and key
// In a real app, these would come from environment variables or a secure config
const API_URL = 'https://us-east-1.aws.data.mongodb-api.com/app/salatapp-xxxxx/endpoint';
const API_KEY = 'your-api-key';

// Fetch messages from MongoDB
export const fetchMessagesFromMongoDB = async (): Promise<AdminMessage[]> => {
  try {
    const response = await axios.get(`${API_URL}/messages`, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching messages from MongoDB:', error);
    throw error;
  }
};

// Update message read status in MongoDB
export const updateMessageReadStatus = async (messageId: string, isRead: boolean): Promise<boolean> => {
  try {
    await axios.patch(`${API_URL}/message/${messageId}`, 
      { isRead },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error updating message read status in MongoDB:', error);
    return false;
  }
};

// Mark all messages as read in MongoDB
export const markAllMessagesReadInMongoDB = async (): Promise<boolean> => {
  try {
    await axios.patch(`${API_URL}/messages/markAllRead`, 
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': API_KEY
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Error marking all messages as read in MongoDB:', error);
    return false;
  }
};

// Get unread message count from MongoDB
export const getUnreadMessageCountFromMongoDB = async (): Promise<number> => {
  try {
    const response = await axios.get(`${API_URL}/messages/unreadCount`, {
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY
      }
    });
    
    return response.data.count;
  } catch (error) {
    console.error('Error getting unread message count from MongoDB:', error);
    return 0;
  }
}; 