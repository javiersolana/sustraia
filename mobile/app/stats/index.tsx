import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface WeeklyData {
  labels: string[];
  distances: number[];
  durations: number[];
}

interface MonthlyData {
  labels: string[];
  distances: number[];
}

export default function StatsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [weeklyData, setWeeklyData] = useState<WeeklyData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // Load weekly data (last 7 days)
      const weekResponse = await api.get('/stats/weekly');
      setWeeklyData(weekResponse.data);

      // Load monthly data (last 30 days)
      const monthResponse = await api.get('/stats/monthly');
      setMonthlyData(monthResponse.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: Colors.paper,
    backgroundGradientFrom: Colors.paper,
    backgroundGradientTo: Colors.paper,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(0, 51, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: Colors.accent,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: Colors.lightGray,
      strokeWidth: 1,
    },
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Period Toggle */}
        <View style={styles.periodToggle}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.periodText, period === 'week' && styles.periodTextActive]}>
              Semanal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.periodText, period === 'month' && styles.periodTextActive]}>
              Mensual
            </Text>
          </TouchableOpacity>
        </View>

        {period === 'week' && weeklyData && (
          <>
            {/* Weekly Distance Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Distancia Semanal (km)</Text>
              <LineChart
                data={{
                  labels: weeklyData.labels,
                  datasets: [
                    {
                      data: weeklyData.distances,
                    },
                  ],
                }}
                width={width - 60}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines
                withVerticalLines
                withHorizontalLines
                fromZero
              />
            </View>

            {/* Weekly Duration Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Duración Semanal (min)</Text>
              <BarChart
                data={{
                  labels: weeklyData.labels,
                  datasets: [
                    {
                      data: weeklyData.durations,
                    },
                  ],
                }}
                width={width - 60}
                height={220}
                yAxisLabel=""
                yAxisSuffix=" min"
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.7,
                }}
                style={styles.chart}
                showValuesOnTopOfBars
                fromZero
              />
            </View>
          </>
        )}

        {period === 'month' && monthlyData && (
          <>
            {/* Monthly Distance Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Progreso Mensual (km)</Text>
              <LineChart
                data={{
                  labels: monthlyData.labels,
                  datasets: [
                    {
                      data: monthlyData.distances,
                    },
                  ],
                }}
                width={width - 60}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                withInnerLines
                withOuterLines
                fromZero
              />
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Resumen del Mes</Text>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {monthlyData.distances.reduce((a, b) => a + b, 0).toFixed(1)}
                  </Text>
                  <Text style={styles.summaryLabel}>km totales</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {(monthlyData.distances.reduce((a, b) => a + b, 0) / monthlyData.distances.length).toFixed(1)}
                  </Text>
                  <Text style={styles.summaryLabel}>km promedio/día</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  periodToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.paper,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.accent,
  },
  periodText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.gray,
  },
  periodTextActive: {
    color: Colors.paper,
  },
  chartCard: {
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
  chartTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  summaryCard: {
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: Colors.base,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.accent,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
    textAlign: 'center',
  },
});
