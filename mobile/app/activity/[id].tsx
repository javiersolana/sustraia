import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import {
  ArrowLeft,
  MapPin,
  Timer,
  TrendingUp,
  Heart,
  Zap,
  Award,
  Calendar,
  Camera,
  X,
  Edit3,
  Save,
  Share2,
} from 'lucide-react-native';
import api from '../../lib/api';
import Colors from '../../constants/Colors';

const { width } = Dimensions.get('window');

interface ActivityDetail {
  id: string;
  title: string;
  label: string;
  completedAt: string;
  actualDuration?: number;
  actualDistance?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  calories?: number;
  feeling?: string;
  notes?: string;
  stravaId?: string;
  stravaType?: string;
  workoutStructure?: any;
  humanReadable?: string;
  photos?: string[];
}

export default function ActivityDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');

  useEffect(() => {
    loadActivity();
  }, [params.id]);

  const loadActivity = async () => {
    try {
      const response = await api.get(`/workouts/completed/${params.id}`);
      setActivity(response.data);
      setPhotos(response.data.photos || []);
      setEditedNotes(response.data.notes || '');
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permisos necesarios',
          'Necesitamos permisos para acceder a tus fotos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadPhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
    }
  };

  const uploadPhoto = async (uri: string) => {
    try {
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'photo.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('photo', {
        uri,
        name: filename,
        type,
      } as any);

      const response = await api.post(
        `/workouts/completed/${params.id}/photos`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setPhotos([...photos, response.data.photoUrl]);
      Alert.alert('Éxito', 'Foto subida correctamente');
    } catch (error) {
      console.error('Error uploading photo:', error);
      Alert.alert('Error', 'No se pudo subir la foto');
    }
  };

  const deletePhoto = async (photoUrl: string, index: number) => {
    try {
      await api.delete(`/workouts/completed/${params.id}/photos/${index}`);
      setPhotos(photos.filter((_, i) => i !== index));
      Alert.alert('Éxito', 'Foto eliminada');
    } catch (error) {
      console.error('Error deleting photo:', error);
      Alert.alert('Error', 'No se pudo eliminar la foto');
    }
  };

  const saveNotes = async () => {
    try {
      await api.patch(`/workouts/completed/${params.id}`, {
        notes: editedNotes,
      });

      setActivity({
        ...activity!,
        notes: editedNotes,
      });

      setIsEditingNotes(false);
      Alert.alert('Éxito', 'Notas guardadas correctamente');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'No se pudieron guardar las notas');
    }
  };

  const shareActivity = async () => {
    try {
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert('Error', 'Compartir no está disponible en este dispositivo');
        return;
      }

      const shareText = generateShareText();

      // Create a temporary text file to share
      const message = `
🏃‍♂️ ${activity?.title || 'Actividad'}

${activity?.label ? `📌 ${activity.label}` : ''}

${activity?.actualDistance ? `📍 Distancia: ${activity.actualDistance.toFixed(2)} km` : ''}
${activity?.actualDuration ? `⏱️ Tiempo: ${formatDuration(activity.actualDuration)}` : ''}
${activity?.actualDistance && activity?.actualDuration ? `⚡ Ritmo: ${formatPace(activity.actualDistance, activity.actualDuration)}` : ''}
${activity?.avgHeartRate ? `❤️ FC Media: ${activity.avgHeartRate} bpm` : ''}
${activity?.calories ? `🔥 Calorías: ${activity.calories}` : ''}

${activity?.notes ? `\n💭 "${activity.notes}"` : ''}

📅 ${activity?.completedAt ? formatDate(activity.completedAt) : ''}

Entrenamiento con SUSTRAIA 💪
      `.trim();

      // Use the native share dialog
      await Sharing.shareAsync('data:text/plain;base64,' + btoa(message), {
        dialogTitle: 'Compartir actividad',
        mimeType: 'text/plain',
      });
    } catch (error) {
      console.error('Error sharing activity:', error);
      Alert.alert('Error', 'No se pudo compartir la actividad');
    }
  };

  const generateShareText = () => {
    if (!activity) return '';

    let text = `🏃‍♂️ ${activity.title || 'Actividad'}\n\n`;

    if (activity.label) text += `📌 ${activity.label}\n`;
    if (activity.actualDistance) text += `📍 ${activity.actualDistance.toFixed(2)} km\n`;
    if (activity.actualDuration) text += `⏱️ ${formatDuration(activity.actualDuration)}\n`;
    if (activity.avgHeartRate) text += `❤️ FC Media: ${activity.avgHeartRate} bpm\n`;
    if (activity.calories) text += `🔥 ${activity.calories} cal\n`;

    text += `\n📅 ${formatDate(activity.completedAt)}\n`;
    text += '\n💪 Entrenamiento con SUSTRAIA';

    return text;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const formatPace = (distance?: number, duration?: number) => {
    if (!distance || !duration) return '--';
    const paceMinPerKm = duration / 60 / distance;
    const mins = Math.floor(paceMinPerKm);
    const secs = Math.floor((paceMinPerKm - mins) * 60);
    return `${mins}:${secs.toString().padStart(2, '0')} /km`;
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (!activity) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Actividad no encontrada</Text>
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
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{activity.title || 'Actividad'}</Text>
          <Text style={styles.headerSubtitle}>
            {formatDate(activity.completedAt)} • {formatTime(activity.completedAt)}
          </Text>
        </View>
        <TouchableOpacity style={styles.shareButton} onPress={shareActivity}>
          <Share2 size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Label Badge */}
        <View
          style={[styles.labelBadge, { backgroundColor: getLabelColor(activity.label) }]}
        >
          <Text style={styles.labelText}>{activity.label}</Text>
        </View>

        {/* Primary Stats Grid */}
        <View style={styles.primaryStatsGrid}>
          {activity.actualDistance && (
            <View style={styles.primaryStat}>
              <View style={[styles.primaryStatIcon, { backgroundColor: '#E3F2FD' }]}>
                <MapPin size={32} color="#2196F3" />
              </View>
              <Text style={styles.primaryStatValue}>
                {activity.actualDistance.toFixed(2)}
              </Text>
              <Text style={styles.primaryStatLabel}>Kilómetros</Text>
            </View>
          )}

          {activity.actualDuration && (
            <View style={styles.primaryStat}>
              <View style={[styles.primaryStatIcon, { backgroundColor: '#FFF3E0' }]}>
                <Timer size={32} color="#FF9800" />
              </View>
              <Text style={styles.primaryStatValue}>
                {formatDuration(activity.actualDuration)}
              </Text>
              <Text style={styles.primaryStatLabel}>Duración</Text>
            </View>
          )}
        </View>

        {/* Secondary Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>Métricas</Text>

          <View style={styles.statsGrid}>
            {activity.avgHeartRate && (
              <View style={styles.statItem}>
                <Heart size={20} color={Colors.gray} />
                <Text style={styles.statValue}>{activity.avgHeartRate}</Text>
                <Text style={styles.statLabel}>FC Media (bpm)</Text>
              </View>
            )}

            {activity.maxHeartRate && (
              <View style={styles.statItem}>
                <TrendingUp size={20} color={Colors.gray} />
                <Text style={styles.statValue}>{activity.maxHeartRate}</Text>
                <Text style={styles.statLabel}>FC Máxima (bpm)</Text>
              </View>
            )}

            {activity.calories && (
              <View style={styles.statItem}>
                <Zap size={20} color={Colors.gray} />
                <Text style={styles.statValue}>{activity.calories}</Text>
                <Text style={styles.statLabel}>Calorías</Text>
              </View>
            )}

            {activity.actualDistance && activity.actualDuration && (
              <View style={styles.statItem}>
                <Award size={20} color={Colors.gray} />
                <Text style={styles.statValue}>
                  {formatPace(activity.actualDistance, activity.actualDuration)}
                </Text>
                <Text style={styles.statLabel}>Ritmo Medio</Text>
              </View>
            )}
          </View>
        </View>

        {/* Human Readable Description */}
        {activity.humanReadable && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Análisis del Entrenamiento</Text>
            <Text style={styles.descriptionText}>{activity.humanReadable}</Text>
          </View>
        )}

        {/* Photos Section */}
        <View style={styles.card}>
          <View style={styles.photoHeader}>
            <Text style={styles.cardTitle}>Fotos</Text>
            <TouchableOpacity style={styles.addPhotoButton} onPress={pickImage}>
              <Camera size={20} color={Colors.accent} />
              <Text style={styles.addPhotoText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
              {photos.map((photoUrl, index) => (
                <View key={index} style={styles.photoContainer}>
                  <Image source={{ uri: photoUrl }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.deletePhotoButton}
                    onPress={() => {
                      Alert.alert(
                        'Eliminar foto',
                        '¿Estás seguro de que quieres eliminar esta foto?',
                        [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => deletePhoto(photoUrl, index) },
                        ]
                      );
                    }}
                  >
                    <X size={16} color={Colors.paper} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.emptyPhotosText}>
              No hay fotos. Toca "Agregar" para subir una foto de tu entrenamiento.
            </Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.card}>
          <View style={styles.notesHeader}>
            <Text style={styles.cardTitle}>Notas</Text>
            {!isEditingNotes ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditingNotes(true)}
              >
                <Edit3 size={18} color={Colors.accent} />
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={saveNotes}
              >
                <Save size={18} color={Colors.paper} />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            )}
          </View>

          {isEditingNotes ? (
            <TextInput
              style={styles.notesInput}
              value={editedNotes}
              onChangeText={setEditedNotes}
              placeholder="Escribe tus notas sobre el entrenamiento..."
              placeholderTextColor={Colors.gray}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          ) : (
            <Text style={styles.descriptionText}>
              {activity.notes || 'Sin notas. Toca "Editar" para agregar notas sobre tu entrenamiento.'}
            </Text>
          )}
        </View>

        {/* Feeling */}
        {activity.feeling && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sensaciones</Text>
            <Text style={styles.descriptionText}>{activity.feeling}</Text>
          </View>
        )}

        {/* Strava Link */}
        {activity.stravaId && (
          <View style={styles.card}>
            <View style={styles.stravaHeader}>
              <Text style={styles.cardTitle}>Strava</Text>
              <View style={styles.stravaBadge}>
                <Text style={styles.stravaText}>Sincronizado</Text>
              </View>
            </View>
            <Text style={styles.stravaId}>ID: {activity.stravaId}</Text>
            {activity.stravaType && (
              <Text style={styles.stravaType}>Tipo: {activity.stravaType}</Text>
            )}
          </View>
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
  errorText: {
    fontSize: 16,
    color: Colors.gray,
    fontWeight: '500',
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
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.gray,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  labelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 24,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.paper,
    textTransform: 'uppercase',
  },
  primaryStatsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  primaryStat: {
    flex: 1,
    backgroundColor: Colors.paper,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryStatIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryStatValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 4,
  },
  primaryStatLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.gray,
  },
  statsCard: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    width: (width - 80) / 2,
    backgroundColor: Colors.base,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.gray,
    textAlign: 'center',
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
  descriptionText: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  stravaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stravaBadge: {
    backgroundColor: '#FC4C02',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  stravaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.paper,
  },
  stravaId: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
    marginBottom: 4,
  },
  stravaType: {
    fontSize: 14,
    color: Colors.gray,
    fontWeight: '500',
  },
  photoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.base,
    borderRadius: 10,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  photosScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  photoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  photo: {
    width: 200,
    height: 200,
    borderRadius: 16,
    backgroundColor: Colors.base,
  },
  deletePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotosText: {
    fontSize: 14,
    color: Colors.gray,
    textAlign: 'center',
    paddingVertical: 20,
    lineHeight: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.base,
    borderRadius: 10,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.accent,
    borderRadius: 10,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.paper,
  },
  notesInput: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
    backgroundColor: Colors.base,
    borderRadius: 12,
    padding: 12,
    minHeight: 120,
    fontFamily: 'System',
  },
});
