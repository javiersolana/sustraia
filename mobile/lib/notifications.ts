import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Request permissions and get push token
   */
  registerForPushNotifications: async (): Promise<string | null> => {
    let token = null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0033FF',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);

      // Send token to backend
      try {
        await api.post('/notifications/register', { pushToken: token });
      } catch (error) {
        console.error('Error registering push token:', error);
      }
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  },

  /**
   * Add notification received listener
   */
  addNotificationReceivedListener: (
    handler: (notification: Notifications.Notification) => void
  ) => {
    return Notifications.addNotificationReceivedListener(handler);
  },

  /**
   * Add notification response listener (when user taps notification)
   */
  addNotificationResponseListener: (
    handler: (response: Notifications.NotificationResponse) => void
  ) => {
    return Notifications.addNotificationResponseReceivedListener(handler);
  },

  /**
   * Schedule a local notification (for testing)
   */
  scheduleLocalNotification: async (title: string, body: string, data?: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  },

  /**
   * Get notification permissions
   */
  getPermissions: async () => {
    return await Notifications.getPermissionsAsync();
  },

  /**
   * Set badge count
   */
  setBadgeCount: async (count: number) => {
    await Notifications.setBadgeCountAsync(count);
  },

  /**
   * Get badge count
   */
  getBadgeCount: async () => {
    return await Notifications.getBadgeCountAsync();
  },
};
