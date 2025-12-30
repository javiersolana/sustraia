/**
 * SUSTRAIA API Client
 * Type-safe API client for frontend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ATLETA' | 'COACH';
  createdAt: string;
  coachId?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Workout {
  id: string;
  date: string;
  type: 'RUN' | 'RIDE' | 'SWIM' | 'STRENGTH' | 'YOGA' | 'OTHER';
  title: string;
  description?: string;
  distance?: number;
  duration?: number;
  intensity?: 'easy' | 'moderate' | 'hard' | 'race';
  notes?: string;
  creator?: { id: string; name: string };
  athlete?: { id: string; name: string; email: string };
  completedVersion?: CompletedWorkout;
}

export interface CompletedWorkout {
  id: string;
  workoutId?: string;
  userId: string;
  title?: string;
  label?: string;
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
  classificationConfidence?: 'high' | 'medium' | 'low';
  humanReadable?: string;
  workout?: Workout;
  user?: { id: string; name: string; email: string };
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  read: boolean;
  createdAt: string;
  from?: { id: string; name: string; role: string };
  to?: { id: string; name: string; role: string };
}

export interface Stats {
  totalWorkouts: number;
  totalDistance: number;
  totalDuration: number;
  weeklyWorkouts: number;
  weeklyDistance: number;
  weeklyDuration: number;
  monthlyWorkouts: number;
  monthlyDistance: number;
  monthlyDuration: number;
}

export type BlockType = 'WARMUP' | 'RUN' | 'INTERVALS' | 'REST' | 'COOLDOWN';
export type TargetType = 'HEART_RATE' | 'PACE' | 'OPEN';

export interface TrainingBlock {
  id?: string;
  order: number;
  type: BlockType;
  durationSeconds?: number;
  distanceMeters?: number;
  // For intervals: repetition count and rest between reps
  repetitions?: number;
  restSeconds?: number;
  // Pace targets (seconds per km)
  paceMin?: number;
  paceMax?: number;
  // HR targets (bpm)
  hrMin?: number;
  hrMax?: number;
  // Legacy target fields (for backwards compatibility)
  targetType?: TargetType;
  targetMin?: number;
  targetMax?: number;
  notes?: string;
}

export interface TrainingPlan {
  id: string;
  coachId: string;
  athleteId: string;
  date: string;
  title: string;
  description?: string;
  blocks: TrainingBlock[];
  athlete?: { id: string; name: string; email: string };
  coach?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface StravaLap {
  id: number;
  name: string;
  elapsed_time: number;
  moving_time: number;
  distance: number;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  lap_index: number;
}

// API Error class
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: any[]
  ) {
    super(message);
  }
}

// API Client class
class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.error || 'Request failed',
        data.errors
      );
    }

    return data;
  }

  // Auth endpoints
  auth = {
    register: (email: string, password: string, name: string, role: 'ATLETA' | 'COACH') =>
      this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      }),

    login: (email: string, password: string) =>
      this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    getProfile: () => this.request<{ user: User }>('/auth/profile'),
  };

  // Workout endpoints
  workouts = {
    getAll: (page = 1, limit = 20) =>
      this.request<{ workouts: Workout[]; pagination: any }>(
        `/workouts?page=${page}&limit=${limit}`
      ),

    getById: (id: string) => this.request<{ workout: Workout }>(`/workouts/${id}`),

    create: (workout: Partial<Workout>) =>
      this.request<{ workout: Workout }>('/workouts', {
        method: 'POST',
        body: JSON.stringify(workout),
      }),

    update: (id: string, workout: Partial<Workout>) =>
      this.request<{ workout: Workout }>(`/workouts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(workout),
      }),

    delete: (id: string) =>
      this.request<{ success: boolean }>(`/workouts/${id}`, {
        method: 'DELETE',
      }),

    complete: (id: string, data: Partial<CompletedWorkout>) =>
      this.request<{ completedWorkout: CompletedWorkout }>(
        `/workouts/${id}/complete`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      ),
  };

  // Message endpoints
  messages = {
    send: (toId: string, content: string) =>
      this.request<{ message: Message }>('/messages', {
        method: 'POST',
        body: JSON.stringify({ toId, content }),
      }),

    getConversations: () =>
      this.request<{ conversations: any[] }>('/messages/conversations'),

    getWith: (userId: string, page = 1, limit = 50) =>
      this.request<{ messages: Message[] }>(
        `/messages/with/${userId}?page=${page}&limit=${limit}`
      ),

    markAsRead: (id: string) =>
      this.request<{ message: Message }>(`/messages/${id}/read`, {
        method: 'PATCH',
      }),

    getUnreadCount: () =>
      this.request<{ count: number }>('/messages/unread/count'),
  };

  // Strava endpoints
  strava = {
    getAuthUrl: () => this.request<{ authUrl: string }>('/strava/auth-url'),

    handleCallback: (code: string) =>
      this.request<{ success: boolean; athlete: any }>(
        `/strava/callback?code=${code}`
      ),

    getStatus: () =>
      this.request<{ connected: boolean; athleteId?: string }>(
        '/strava/status'
      ),

    getActivities: (page = 1, perPage = 30) =>
      this.request<{ activities: any[] }>(
        `/strava/activities?page=${page}&perPage=${perPage}`
      ),

    sync: (activityId: string, workoutId?: string) =>
      this.request<{ success: boolean }>('/strava/sync', {
        method: 'POST',
        body: JSON.stringify({ activityId, workoutId }),
      }),

    disconnect: () =>
      this.request<{ success: boolean }>('/strava/disconnect', {
        method: 'DELETE',
      }),

    importActivities: (weeks = 4) =>
      this.request<{
        success: boolean;
        imported: number;
        skipped: number;
        activities: { title: string; label: string }[];
      }>(`/strava/import?weeks=${weeks}`, {
        method: 'POST',
      }),

    getActivityLaps: (activityId: number) =>
      this.request<{ laps: StravaLap[] }>(
        `/strava/activities/${activityId}/laps`
      ),
  };

  // Training Plans endpoints
  trainingPlans = {
    create: (plan: Omit<TrainingPlan, 'id' | 'coachId' | 'createdAt' | 'updatedAt'>) =>
      this.request<TrainingPlan>('/training-plans', {
        method: 'POST',
        body: JSON.stringify(plan),
      }),

    getAll: (options?: { athleteId?: string; startDate?: string; endDate?: string }) => {
      const params = new URLSearchParams();
      if (options?.athleteId) params.append('athleteId', options.athleteId);
      if (options?.startDate) params.append('startDate', options.startDate);
      if (options?.endDate) params.append('endDate', options.endDate);
      const query = params.toString();
      return this.request<TrainingPlan[]>(`/training-plans${query ? `?${query}` : ''}`);
    },

    getById: (id: string) =>
      this.request<TrainingPlan>(`/training-plans/${id}`),

    update: (id: string, plan: Partial<Omit<TrainingPlan, 'id' | 'coachId'>>) =>
      this.request<TrainingPlan>(`/training-plans/${id}`, {
        method: 'PUT',
        body: JSON.stringify(plan),
      }),

    delete: (id: string) =>
      this.request<{ message: string }>(`/training-plans/${id}`, {
        method: 'DELETE',
      }),
  };

  // Stats endpoints
  stats = {
    get: () => this.request<{ stats: Stats }>('/stats'),

    getHistory: (metricName: string, days = 30) =>
      this.request<{ stats: any[] }>(
        `/stats/history/${metricName}?days=${days}`
      ),

    getDashboard: () =>
      this.request<{
        stats: Stats;
        upcomingWorkouts: Workout[];
        recentCompleted: CompletedWorkout[];
        unreadMessages: number;
      }>('/stats/dashboard'),

    getCoachDashboard: () =>
      this.request<{
        athletes: any[];
        recentWorkouts: Workout[];
        unreadMessages: number;
      }>('/stats/coach-dashboard'),

    getAthleteWorkouts: (athleteId: string) =>
      this.request<{ workouts: CompletedWorkout[] }>(
        `/stats/athlete/${athleteId}/workouts`
      ),

    getActivities: (page = 1, limit = 20) =>
      this.request<{
        activities: CompletedWorkout[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          pages: number;
        };
      }>(`/stats/activities?page=${page}&limit=${limit}`),

    getActivity: (id: string) =>
      this.request<{ activity: CompletedWorkout }>(`/stats/activities/${id}`),
  };

  // Admin endpoints
  admin = {
    getStats: () =>
      this.request<{
        stats: {
          totalUsers: number;
          totalAthletes: number;
          totalCoaches: number;
          totalWorkouts: number;
          totalCompleted: number;
        };
      }>('/admin/stats'),

    getAllUsers: () =>
      this.request<{
        users: Array<{
          id: string;
          email: string;
          name: string;
          role: string;
          createdAt: string;
          coachId?: string;
          coach?: { id: string; name: string; email: string };
          _count: { athletes: number };
        }>;
      }>('/admin/users'),

    getAllCoaches: () =>
      this.request<{
        coaches: Array<{
          id: string;
          email: string;
          name: string;
          createdAt: string;
          _count: { athletes: number };
        }>;
      }>('/admin/coaches'),

    createAthlete: (data: {
      email: string;
      password: string;
      name: string;
      coachId?: string;
      birthDate?: string;
      maxHeartRate?: number;
      restingHR?: number;
    }) =>
      this.request<{
        athlete: {
          id: string;
          email: string;
          name: string;
          role: string;
          createdAt: string;
          coachId?: string;
          birthDate?: string;
          maxHeartRate?: number;
          restingHR?: number;
          coach?: { id: string; name: string; email: string };
        };
      }>('/admin/athletes', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    createCoach: (data: { email: string; password: string; name: string }) =>
      this.request<{
        coach: {
          id: string;
          email: string;
          name: string;
          role: string;
          createdAt: string;
        };
      }>('/admin/coaches', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    updateUser: (
      id: string,
      data: {
        name?: string;
        coachId?: string | null;
        birthDate?: string;
        maxHeartRate?: number;
        restingHR?: number;
      }
    ) =>
      this.request<{
        user: {
          id: string;
          email: string;
          name: string;
          role: string;
          createdAt: string;
          coachId?: string;
          coach?: { id: string; name: string; email: string };
        };
      }>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    deleteUser: (id: string) =>
      this.request<{ success: boolean; message: string }>(
        `/admin/users/${id}`,
        {
          method: 'DELETE',
        }
      ),
  };
}

// Export singleton instance
export const api = new ApiClient();

// Export helper hooks for React
export function useAuth() {
  const login = async (email: string, password: string) => {
    const response = await api.auth.login(email, password);
    api.setToken(response.token);
    return response;
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: 'ATLETA' | 'COACH'
  ) => {
    const response = await api.auth.register(email, password, name, role);
    api.setToken(response.token);
    return response;
  };

  const logout = () => {
    api.setToken(null);
  };

  const isAuthenticated = () => {
    return !!api.getToken();
  };

  return { login, register, logout, isAuthenticated };
}
