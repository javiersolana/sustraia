import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calendar, Clock, TrendingUp } from 'lucide-react-native';
import api from '../../lib/api';
import Colors from '../../constants/Colors';
import DateTimePicker from '@react-native-community/datetimepicker';

type WorkoutType = 'RUN' | 'RIDE' | 'SWIM' | 'STRENGTH' | 'YOGA' | 'OTHER';
type IntensityLevel = 'EASY' | 'MODERATE' | 'HARD' | 'RACE';

export default function CreateWorkoutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ athleteId?: string; athleteName?: string }>();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [type, setType] = useState<WorkoutType>('RUN');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<IntensityLevel>('MODERATE');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const workoutTypes: { value: WorkoutType; label: string; emoji: string }[] = [
    { value: 'RUN', label: 'Carrera', emoji: '🏃' },
    { value: 'RIDE', label: 'Ciclismo', emoji: '🚴' },
    { value: 'SWIM', label: 'Natación', emoji: '🏊' },
    { value: 'STRENGTH', label: 'Fuerza', emoji: '💪' },
    { value: 'YOGA', label: 'Yoga', emoji: '🧘' },
    { value: 'OTHER', label: 'Otro', emoji: '⚡' },
  ];

  const intensityLevels: { value: IntensityLevel; label: string; color: string }[] = [
    { value: 'EASY', label: 'Fácil', color: '#4CAF50' },
    { value: 'MODERATE', label: 'Moderado', color: '#FF9800' },
    { value: 'HARD', label: 'Difícil', color: '#F44336' },
    { value: 'RACE', label: 'Competición', color: '#9C27B0' },
  ];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'El título es obligatorio');
      return;
    }

    if (!params.athleteId) {
      Alert.alert('Error', 'No se ha seleccionado un atleta');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        date: date.toISOString(),
        type,
        distance: distance ? parseFloat(distance) : null,
        duration: duration ? parseInt(duration) : null,
        intensity,
        notes: notes.trim() || null,
        assignedTo: params.athleteId,
      };

      await api.post('/workouts', payload);
      Alert.alert('¡Creado!', 'Entrenamiento creado correctamente', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo crear el entrenamiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Nuevo Entrenamiento</Text>
          {params.athleteName && (
            <Text style={styles.headerSubtitle}>Para {params.athleteName}</Text>
          )}
        </View>
      </View>

      {/* Form */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Title */}
        <View style={styles.section}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Rodaje suave 10km"
            value={title}
            onChangeText={setTitle}
            editable={!loading}
          />
        </View>

        {/* Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Tipo de Entrenamiento</Text>
          <View style={styles.typeGrid}>
            {workoutTypes.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[styles.typeButton, type === item.value && styles.typeButtonActive]}
                onPress={() => setType(item.value)}
                disabled={loading}
              >
                <Text style={styles.typeEmoji}>{item.emoji}</Text>
                <Text style={[styles.typeText, type === item.value && styles.typeTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Fecha</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
            disabled={loading}
          >
            <Calendar size={20} color={Colors.gray} />
            <Text style={styles.dateText}>
              {date.toLocaleDateString('es-ES', {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}
        </View>

        {/* Distance & Duration */}
        <View style={styles.row}>
          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Distancia (km)</Text>
            <TextInput
              style={styles.input}
              placeholder="10.5"
              value={distance}
              onChangeText={setDistance}
              keyboardType="decimal-pad"
              editable={!loading}
            />
          </View>

          <View style={[styles.section, styles.halfWidth]}>
            <Text style={styles.label}>Duración (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="60"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
              editable={!loading}
            />
          </View>
        </View>

        {/* Intensity */}
        <View style={styles.section}>
          <Text style={styles.label}>Intensidad</Text>
          <View style={styles.intensityContainer}>
            {intensityLevels.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.intensityButton,
                  intensity === item.value && { backgroundColor: item.color },
                ]}
                onPress={() => setIntensity(item.value)}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.intensityText,
                    intensity === item.value && styles.intensityTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe el objetivo y estructura del entrenamiento..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            editable={!loading}
          />
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notas adicionales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Indicaciones especiales para el atleta..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={3}
            editable={!loading}
          />
        </View>

        {/* Create Button */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.paper} />
          ) : (
            <Text style={styles.createButtonText}>Crear Entrenamiento</Text>
          )}
        </TouchableOpacity>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: Colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.paper,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeButton: {
    width: '30%',
    backgroundColor: Colors.paper,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.lightGray,
  },
  typeButtonActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
  },
  typeTextActive: {
    color: Colors.paper,
  },
  dateButton: {
    backgroundColor: Colors.paper,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  dateText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  intensityContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  intensityButton: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gray,
  },
  intensityTextActive: {
    color: Colors.paper,
  },
  createButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: Colors.paper,
    fontSize: 16,
    fontWeight: '700',
  },
});
