import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { notificationService } from '../lib/notifications';
import { socketService } from '../lib/socket';
import { authService } from '../lib/auth';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Initialize global services
    initializeApp();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  const initializeApp = async () => {
    // Check if user is authenticated
    const user = await authService.getCurrentUser();

    if (user) {
      // Register for push notifications
      await notificationService.registerForPushNotifications();

      // Connect to WebSocket
      await socketService.connect();

      // Listen for push notification responses (when user taps notification)
      notificationService.addNotificationResponseListener((response) => {
        const data = response.notification.request.content.data;

        // Handle notification tap - navigate to relevant screen
        if (data.type === 'message' && data.userId) {
          router.push({
            pathname: '/chat/[id]' as any,
            params: {
              id: String(data.userId),
              name: String(data.userName || 'Usuario'),
              role: String(data.userRole || 'ATLETA'),
            },
          });
        } else if (data.type === 'workout') {
          router.push('/(tabs)/workouts');
        }
      });
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="workouts" />
        <Stack.Screen name="activity" />
        <Stack.Screen name="stats" />
      </Stack>
    </GestureHandlerRootView>
  );
}
