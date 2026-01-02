import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  User as UserIcon,
  Mail,
  Activity,
  Heart,
  LogOut,
  Settings,
  Bell,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react-native';
import { authService, User } from '../../lib/auth';
import { stravaService } from '../../lib/strava';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [weeklyGoal, setWeeklyGoal] = useState('');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const userData = await authService.getCurrentUser();
    setUser(userData);

    // Check Strava connection
    try {
      const response = await api.get('/strava/status');
      setStravaConnected(response.data.connected);
    } catch (error) {
      console.error('Error checking Strava status:', error);
    }

    setWeeklyGoal(userData?.weeklyGoalKm?.toString() || '');
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleConnectStrava = async () => {
    try {
      const result = await stravaService.connect();
      if (result.success) {
        setStravaConnected(true);
        Alert.alert('¡Conectado!', 'Strava se ha conectado correctamente. Tus actividades se sincronizarán automáticamente.');
      } else {
        if (result.error !== 'User cancelled') {
          Alert.alert('Error', result.error || 'No se pudo conectar con Strava');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo conectar con Strava');
    }
  };

  const handleDisconnectStrava = async () => {
    Alert.alert(
      'Desconectar Strava',
      '¿Estás seguro? Tus actividades ya sincronizadas no se eliminarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desconectar',
          style: 'destructive',
          onPress: async () => {
            const success = await stravaService.disconnect();
            if (success) {
              setStravaConnected(false);
              Alert.alert('Desconectado', 'Strava se ha desconectado');
            } else {
              Alert.alert('Error', 'No se pudo desconectar Strava');
            }
          },
        },
      ]
    );
  };

  const handleSyncStrava = async () => {
    try {
      const result = await stravaService.syncActivities();
      if (result.success) {
        Alert.alert('Sincronizado', `Se sincronizaron ${result.count || 0} actividades`);
      } else {
        Alert.alert('Error', result.error || 'No se pudo sincronizar');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo sincronizar con Strava');
    }
  };

  const handleUpdateGoal = async () => {
    try {
      await api.patch('/users/profile', {
        weeklyGoalKm: parseFloat(weeklyGoal),
      });
      Alert.alert('Éxito', 'Objetivo semanal actualizado');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el objetivo');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Perfil</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <UserIcon size={40} color={Colors.accent} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.name}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'COACH' ? 'Entrenador' : 'Atleta'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Mail size={18} color={Colors.gray} />
            <Text style={styles.infoText}>{user?.email}</Text>
          </View>
        </View>

        {/* Weekly Goal */}
        {user?.role === 'ATLETA' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Objetivo Semanal</Text>
            <View style={styles.goalInput}>
              <Activity size={20} color={Colors.gray} />
              <TextInput
                style={styles.input}
                value={weeklyGoal}
                onChangeText={setWeeklyGoal}
                keyboardType="numeric"
                placeholder="0"
              />
              <Text style={styles.inputUnit}>km</Text>
            </View>
            <TouchableOpacity style={styles.updateButton} onPress={handleUpdateGoal}>
              <Text style={styles.updateButtonText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Strava Connection */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Strava</Text>
            {stravaConnected && (
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedText}>Conectado</Text>
              </View>
            )}
          </View>
          {stravaConnected ? (
            <View style={styles.stravaInfo}>
              <Text style={styles.stravaText}>
                Tus actividades de Strava se sincronizan automáticamente
              </Text>
              <View style={styles.stravaActions}>
                <TouchableOpacity style={styles.syncButton} onPress={handleSyncStrava}>
                  <RefreshCw size={16} color={Colors.accent} />
                  <Text style={styles.syncText}>Sincronizar ahora</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnectStrava}>
                  <Text style={styles.disconnectText}>Desconectar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.connectButton} onPress={handleConnectStrava}>
              <LinkIcon size={18} color={Colors.paper} />
              <Text style={styles.connectButtonText}>Conectar Strava</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Configuración</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={Colors.gray} />
              <Text style={styles.settingText}>Notificaciones</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: Colors.lightGray, true: Colors.accent }}
              thumbColor={Colors.paper}
            />
          </View>

          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Settings size={20} color={Colors.gray} />
              <Text style={styles.settingText}>Preferencias</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>SUSTRAIA v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.base,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  card: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.base,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  infoText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  connectedBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  connectedText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.paper,
  },
  goalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.base,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gray,
  },
  updateButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  updateButtonText: {
    color: Colors.paper,
    fontSize: 14,
    fontWeight: '700',
  },
  stravaInfo: {
    gap: 16,
  },
  stravaText: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
  },
  stravaActions: {
    gap: 12,
  },
  syncButton: {
    backgroundColor: Colors.base,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  syncText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },
  connectButton: {
    backgroundColor: '#FC4C02',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  connectButtonText: {
    color: Colors.paper,
    fontSize: 16,
    fontWeight: '700',
  },
  disconnectButton: {
    padding: 12,
    alignItems: 'center',
  },
  disconnectText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  logoutButton: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.error,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: Colors.gray,
    fontWeight: '500',
  },
});
