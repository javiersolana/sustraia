import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Users, Search, MessageCircle, TrendingUp, Calendar, Plus } from 'lucide-react-native';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

interface Athlete {
  id: string;
  name: string;
  email: string;
  weeklyGoalKm?: number;
  stats?: {
    weeklyKm: number;
    monthlyKm: number;
    totalActivities: number;
  };
}

export default function CoachScreen() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAthletes();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = athletes.filter((athlete) =>
        athlete.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredAthletes(filtered);
    } else {
      setFilteredAthletes(athletes);
    }
  }, [searchQuery, athletes]);

  const loadAthletes = async () => {
    try {
      const response = await api.get('/coach/athletes');
      setAthletes(response.data);
      setFilteredAthletes(response.data);
    } catch (error) {
      console.error('Error loading athletes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAthletes();
  };

  const getProgressPercentage = (athlete: Athlete) => {
    if (!athlete.weeklyGoalKm || !athlete.stats?.weeklyKm) return 0;
    return Math.min((athlete.stats.weeklyKm / athlete.weeklyGoalKm) * 100, 100);
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
          <View>
            <Text style={styles.title}>Mis Atletas</Text>
            <Text style={styles.subtitle}>{athletes.length} atletas activos</Text>
          </View>
          <TouchableOpacity style={styles.addButton}>
            <Users size={20} color={Colors.paper} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar atleta..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {filteredAthletes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No se encontraron atletas' : 'No tienes atletas'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Intenta con otro nombre'
                : 'Comparte tu código de entrenador para que los atletas se unan'}
            </Text>
          </View>
        ) : (
          <View style={styles.athletesList}>
            {filteredAthletes.map((athlete) => (
              <TouchableOpacity key={athlete.id} style={styles.athleteCard}>
                <View style={styles.athleteHeader}>
                  <View style={styles.athleteAvatar}>
                    <Text style={styles.athleteInitial}>
                      {athlete.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.athleteInfo}>
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                    <Text style={styles.athleteEmail}>{athlete.email}</Text>
                  </View>
                  <TouchableOpacity style={styles.messageButton}>
                    <MessageCircle size={20} color={Colors.accent} />
                  </TouchableOpacity>
                </View>

                {athlete.stats && (
                  <>
                    <View style={styles.statsRow}>
                      <View style={styles.stat}>
                        <TrendingUp size={16} color={Colors.gray} />
                        <Text style={styles.statLabel}>Semana</Text>
                        <Text style={styles.statValue}>
                          {athlete.stats.weeklyKm} km
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <Calendar size={16} color={Colors.gray} />
                        <Text style={styles.statLabel}>Mes</Text>
                        <Text style={styles.statValue}>
                          {athlete.stats.monthlyKm} km
                        </Text>
                      </View>
                      <View style={styles.stat}>
                        <Users size={16} color={Colors.gray} />
                        <Text style={styles.statLabel}>Actividades</Text>
                        <Text style={styles.statValue}>
                          {athlete.stats.totalActivities}
                        </Text>
                      </View>
                    </View>

                    {athlete.weeklyGoalKm && (
                      <View style={styles.progressContainer}>
                        <View style={styles.progressHeader}>
                          <Text style={styles.progressLabel}>Objetivo semanal</Text>
                          <Text style={styles.progressPercentage}>
                            {getProgressPercentage(athlete).toFixed(0)}%
                          </Text>
                        </View>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${getProgressPercentage(athlete)}%` },
                            ]}
                          />
                        </View>
                      </View>
                    )}
                  </>
                )}

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() =>
                      router.push({
                        pathname: '/workouts/create',
                        params: {
                          athleteId: athlete.id,
                          athleteName: athlete.name,
                        },
                      })
                    }
                  >
                    <Plus size={16} color={Colors.accent} />
                    <Text style={styles.actionText}>Nuevo entrenamiento</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <TrendingUp size={16} color={Colors.accent} />
                    <Text style={styles.actionText}>Progreso</Text>
                  </TouchableOpacity>
                </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.gray,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.paper,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
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
    paddingHorizontal: 40,
  },
  athletesList: {
    gap: 16,
  },
  athleteCard: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  athleteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  athleteAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  athleteInitial: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.paper,
  },
  athleteInfo: {
    flex: 1,
  },
  athleteName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  athleteEmail: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '500',
  },
  messageButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stat: {
    flex: 1,
    backgroundColor: Colors.base,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
  },
  progressBar: {
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 3,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.base,
    borderRadius: 12,
    padding: 14,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
});
