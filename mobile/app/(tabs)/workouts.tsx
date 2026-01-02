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
import { Calendar as CalendarIcon, Clock, MapPin, List } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

interface Workout {
  id: string;
  date: string;
  type: string;
  title: string;
  description?: string;
  distance?: number;
  duration?: number;
  intensity?: string;
}

export default function WorkoutsScreen() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadWorkouts();
  }, []);

  const loadWorkouts = async () => {
    try {
      const response = await api.get('/workouts');
      setWorkouts(response.data);
    } catch (error) {
      console.error('Error loading workouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWorkouts();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, any> = {
      RUN: { backgroundColor: '#E3F2FD' },
      RIDE: { backgroundColor: '#FFF3E0' },
      SWIM: { backgroundColor: '#E0F7FA' },
      STRENGTH: { backgroundColor: '#F3E5F5' },
      YOGA: { backgroundColor: '#E8F5E9' },
      OTHER: { backgroundColor: '#F5F5F5' },
    };
    return colors[type] || colors.OTHER;
  };

  const filteredWorkouts = viewMode === 'calendar' && selectedDate
    ? workouts.filter(w => w.date.startsWith(selectedDate))
    : workouts;

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
        <View style={styles.header}>
          <Text style={styles.title}>Entrenamientos</Text>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <List size={20} color={viewMode === 'list' ? Colors.paper : Colors.gray} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'calendar' && styles.toggleButtonActive]}
              onPress={() => setViewMode('calendar')}
            >
              <CalendarIcon size={20} color={viewMode === 'calendar' ? Colors.paper : Colors.gray} />
            </TouchableOpacity>
          </View>
        </View>

        {viewMode === 'calendar' && (
          <View style={styles.calendarContainer}>
            <Calendar
              markedDates={workouts.reduce((acc, workout) => {
                const date = workout.date.split('T')[0];
                acc[date] = {
                  marked: true,
                  dotColor: Colors.accent,
                  selected: date === selectedDate,
                  selectedColor: Colors.accent,
                };
                return acc;
              }, {} as any)}
              onDayPress={(day: any) => setSelectedDate(day.dateString)}
              theme={{
                backgroundColor: Colors.paper,
                calendarBackground: Colors.paper,
                textSectionTitleColor: Colors.gray,
                selectedDayBackgroundColor: Colors.accent,
                selectedDayTextColor: Colors.paper,
                todayTextColor: Colors.accent,
                dayTextColor: Colors.text,
                textDisabledColor: Colors.lightGray,
                dotColor: Colors.accent,
                selectedDotColor: Colors.paper,
                arrowColor: Colors.accent,
                monthTextColor: Colors.text,
                textDayFontWeight: '500',
                textMonthFontWeight: '700',
                textDayHeaderFontWeight: '600',
              }}
              style={styles.calendar}
            />
          </View>
        )}

        {filteredWorkouts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {viewMode === 'calendar' && selectedDate ? 'No hay entrenamientos este día' : 'No tienes entrenamientos'}
            </Text>
            <Text style={styles.emptyText}>
              {viewMode === 'calendar' && selectedDate
                ? 'Selecciona otro día en el calendario'
                : 'Tu entrenador te asignará entrenamientos pronto'}
            </Text>
          </View>
        ) : (
          <View style={styles.workoutsList}>
            {filteredWorkouts.map((workout) => (
              <TouchableOpacity key={workout.id} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  <View style={[styles.workoutType, getTypeColor(workout.type)]}>
                    <Text style={styles.workoutTypeText}>
                      {workout.type}
                    </Text>
                  </View>
                  <Text style={styles.workoutDate}>
                    {formatDate(workout.date)}
                  </Text>
                </View>

                <Text style={styles.workoutTitle}>{workout.title}</Text>
                {workout.description && (
                  <Text style={styles.workoutDescription} numberOfLines={2}>
                    {workout.description}
                  </Text>
                )}

                <View style={styles.workoutMeta}>
                  {workout.distance && (
                    <View style={styles.metaItem}>
                      <MapPin size={16} color={Colors.gray} />
                      <Text style={styles.metaText}>
                        {workout.distance} km
                      </Text>
                    </View>
                  )}
                  {workout.duration && (
                    <View style={styles.metaItem}>
                      <Clock size={16} color={Colors.gray} />
                      <Text style={styles.metaText}>
                        {formatDuration(workout.duration)}
                      </Text>
                    </View>
                  )}
                  {workout.intensity && (
                    <View style={[styles.intensityBadge, getIntensityColor(workout.intensity)]}>
                      <Text style={styles.intensityText}>
                        {workout.intensity}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const getIntensityColor = (intensity: string) => {
  const colors: Record<string, any> = {
    EASY: { backgroundColor: '#4CAF50' },
    SUAVE: { backgroundColor: '#4CAF50' },
    MODERATE: { backgroundColor: '#FF9800' },
    MODERADO: { backgroundColor: '#FF9800' },
    HARD: { backgroundColor: '#F44336' },
    INTENSO: { backgroundColor: '#F44336' },
    MÁXIMO: { backgroundColor: '#D32F2F' },
  };
  return colors[intensity] || { backgroundColor: Colors.gray };
};

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.paper,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: Colors.accent,
  },
  calendarContainer: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendar: {
    borderRadius: 16,
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
  workoutsList: {
    gap: 16,
  },
  workoutCard: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutType: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  workoutTypeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  workoutDate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  workoutDescription: {
    fontSize: 14,
    color: Colors.gray,
    lineHeight: 20,
    marginBottom: 12,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  intensityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  intensityText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.paper,
  },
});
