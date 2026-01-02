import { Tabs } from 'expo-router';
import { Home, Calendar, Activity, User, Users, MessageCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { authService, User as UserType } from '../../lib/auth';
import { messagingService } from '../../lib/messaging';
import { socketService } from '../../lib/socket';
import Colors from '../../constants/Colors';

export default function TabLayout() {
  const [user, setUser] = useState<UserType | null>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    loadUser();
    loadUnreadCount();

    // Poll for unread count every 10 seconds
    const interval = setInterval(loadUnreadCount, 10000);

    // Listen for new messages via WebSocket to update badge instantly
    const handleNewMessage = () => {
      loadUnreadCount();
    };

    socketService.onNewMessage(handleNewMessage);

    return () => {
      clearInterval(interval);
      socketService.offNewMessage();
    };
  }, []);

  const loadUser = async () => {
    const userData = await authService.getCurrentUser();
    setUser(userData);
  };

  const loadUnreadCount = async () => {
    try {
      const count = await messagingService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const isCoach = user?.role === 'COACH';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.paper,
          borderTopColor: Colors.lightGray,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      {isCoach ? (
        <>
          <Tabs.Screen
            name="coach"
            options={{
              title: 'Atletas',
              tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Mensajes',
              tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
              tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
            }}
          />
          {/* Hide athlete screens for coaches */}
          <Tabs.Screen name="home" options={{ href: null }} />
          <Tabs.Screen name="workouts" options={{ href: null }} />
          <Tabs.Screen name="activities" options={{ href: null }} />
        </>
      ) : (
        <>
          <Tabs.Screen
            name="home"
            options={{
              title: 'Inicio',
              tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="workouts"
            options={{
              title: 'Entrenamientos',
              tabBarIcon: ({ color, size }) => <Calendar size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="activities"
            options={{
              title: 'Actividades',
              tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
            }}
          />
          <Tabs.Screen
            name="messages"
            options={{
              title: 'Mensajes',
              tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
              tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
            }}
          />
          <Tabs.Screen
            name="profile"
            options={{
              title: 'Perfil',
              tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
            }}
          />
          {/* Hide coach screen for athletes */}
          <Tabs.Screen name="coach" options={{ href: null }} />
        </>
      )}
    </Tabs>
  );
}
