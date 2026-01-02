import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { TrendingUp, Activity, Heart, Zap, BarChart3 } from 'lucide-react-native';
import { authService, User } from '../../lib/auth';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

interface Stats {
  weeklyKm: number;
  monthlyKm: number;
  averageHR: number;
  totalActivities: number;
}

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);

      // Load stats from API
      const response = await api.get('/stats/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{user?.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => router.push('/stats')}
          >
            <BarChart3 size={24} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Weekly Goal Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Objetivo Semanal</Text>
            <TrendingUp size={20} color={Colors.accent} />
          </View>
          <View style={styles.goalContainer}>
            <View style={styles.goalProgress}>
              <View
                style={[
                  styles.goalProgressBar,
                  {
                    width: `${Math.min(
                      ((stats?.weeklyKm || 0) / (user?.weeklyGoalKm || 1)) * 100,
                      100
                    )}%`,
                  },
                ]}
              />
            </View>
            <View style={styles.goalStats}>
              <Text style={styles.goalCurrent}>{stats?.weeklyKm || 0} km</Text>
              <Text style={styles.goalTarget}>
                de {user?.weeklyGoalKm || 0} km
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.statCardHalf]}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2FD' }]}>
              <Activity size={24} color="#2196F3" />
            </View>
            <Text style={styles.statValue}>{stats?.totalActivities || 0}</Text>
            <Text style={styles.statLabel}>Actividades</Text>
            <Text style={styles.statPeriod}>Este mes</Text>
          </View>

          <View style={[styles.statCard, styles.statCardHalf]}>
            <View style={[styles.statIcon, { backgroundColor: '#FCE4EC' }]}>
              <Heart size={24} color="#E91E63" />
            </View>
            <Text style={styles.statValue}>{stats?.averageHR || 0}</Text>
            <Text style={styles.statLabel}>FC Media</Text>
            <Text style={styles.statPeriod}>Últimos 7 días</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF3E0' }]}>
              <Zap size={24} color="#FF9800" />
            </View>
            <Text style={styles.statValue}>{stats?.monthlyKm || 0} km</Text>
            <Text style={styles.statLabel}>Distancia Total</Text>
            <Text style={styles.statPeriod}>Este mes</Text>
          </View>
        </View>

        {/* Recent Activities Placeholder */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Actividades Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.emptyText}>
            Conecta Strava para ver tus actividades
          </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 16,
    color: Colors.gray,
    fontWeight: '500',
  },
  userName: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  statsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.paper,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  card: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  goalContainer: {
    gap: 12,
  },
  goalProgress: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalProgressBar: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  goalCurrent: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.text,
  },
  goalTarget: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  statsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHalf: {
    width: '48%',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  statPeriod: {
    fontSize: 12,
    color: Colors.gray,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  sectionLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
});
