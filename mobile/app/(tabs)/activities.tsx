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
import { TrendingUp, Heart, Timer, MapPin } from 'lucide-react-native';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

interface CompletedWorkout {
  id: string;
  title: string;
  label: string;
  completedAt: string;
  actualDuration?: number;
  actualDistance?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  stravaId?: string;
}

export default function ActivitiesScreen() {
  const router = useRouter();
  const [activities, setActivities] = useState<CompletedWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadActivities();
  }, [filter]);

  const loadActivities = async () => {
    try {
      const response = await api.get('/workouts/completed', {
        params: { filter },
      });
      setActivities(response.data);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getLabelColor = (label: string) => {
    const colors: Record<string, string> = {
      RODAJE: '#4CAF50',
      SERIES: '#F44336',
      TEMPO: '#FF9800',
      FUERZA: '#9C27B0',
      CUESTAS: '#FF5722',
      CALENTAMIENTO: '#2196F3',
      DESCALENTAMIENTO: '#00BCD4',
      OTRO: Colors.gray,
    };
    return colors[label] || Colors.gray;
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
        stickyHeaderIndices={[1]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Actividades</Text>
        </View>

        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Todas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'week' && styles.filterButtonActive]}
            onPress={() => setFilter('week')}
          >
            <Text style={[styles.filterText, filter === 'week' && styles.filterTextActive]}>
              Semana
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, filter === 'month' && styles.filterButtonActive]}
            onPress={() => setFilter('month')}
          >
            <Text style={[styles.filterText, filter === 'month' && styles.filterTextActive]}>
              Mes
            </Text>
          </TouchableOpacity>
        </View>

        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No hay actividades</Text>
            <Text style={styles.emptyText}>
              Conecta Strava o completa entrenamientos para verlos aquí
            </Text>
          </View>
        ) : (
          <View style={styles.activitiesList}>
            {activities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={styles.activityCard}
                onPress={() => router.push(`/activity/${activity.id}`)}
              >
                <View style={styles.activityHeader}>
                  <View
                    style={[
                      styles.labelBadge,
                      { backgroundColor: getLabelColor(activity.label) },
                    ]}
                  >
                    <Text style={styles.labelText}>{activity.label}</Text>
                  </View>
                  <Text style={styles.activityDate}>
                    {formatDate(activity.completedAt)}
                  </Text>
                </View>

                <Text style={styles.activityTitle}>{activity.title || 'Entrenamiento'}</Text>

                <View style={styles.activityStats}>
                  {activity.actualDistance && (
                    <View style={styles.statItem}>
                      <MapPin size={18} color={Colors.gray} />
                      <Text style={styles.statValue}>
                        {activity.actualDistance.toFixed(2)} km
                      </Text>
                    </View>
                  )}
                  {activity.actualDuration && (
                    <View style={styles.statItem}>
                      <Timer size={18} color={Colors.gray} />
                      <Text style={styles.statValue}>
                        {formatDuration(activity.actualDuration)}
                      </Text>
                    </View>
                  )}
                  {activity.avgHeartRate && (
                    <View style={styles.statItem}>
                      <Heart size={18} color={Colors.gray} />
                      <Text style={styles.statValue}>
                        {activity.avgHeartRate} bpm
                      </Text>
                    </View>
                  )}
                </View>

                {activity.stravaId && (
                  <View style={styles.stravaBadge}>
                    <Text style={styles.stravaText}>🏃 Strava</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    backgroundColor: Colors.base,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.paper,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  filterButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  filterTextActive: {
    color: Colors.paper,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
  },
  activitiesList: {
    gap: 16,
  },
  activityCard: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.paper,
    textTransform: 'uppercase',
  },
  activityDate: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.gray,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  activityStats: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  stravaBadge: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  stravaText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gray,
  },
});
