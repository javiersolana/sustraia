import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

WebBrowser.maybeCompleteAuthSession();

// Strava OAuth Configuration
const STRAVA_CLIENT_ID = '173866'; // From your .env
const STRAVA_REDIRECT_URI = AuthSession.makeRedirectUri({
  scheme: 'sustraia',
  path: 'strava-callback',
});

const STRAVA_AUTHORIZE_URL = 'https://www.strava.com/oauth/mobile/authorize';
const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';

export interface StravaAuthResult {
  success: boolean;
  athleteId?: string;
  error?: string;
}

export const stravaService = {
  /**
   * Initiate Strava OAuth flow
   */
  connect: async (): Promise<StravaAuthResult> => {
    try {
      // Create authorization request
      const authUrl = `${STRAVA_AUTHORIZE_URL}?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        STRAVA_REDIRECT_URI
      )}&response_type=code&approval_prompt=auto&scope=read,activity:read_all,activity:write`;

      console.log('Opening Strava auth URL:', authUrl);
      console.log('Redirect URI:', STRAVA_REDIRECT_URI);

      // Open browser for authentication
      const result = await WebBrowser.openAuthSessionAsync(authUrl, STRAVA_REDIRECT_URI);

      if (result.type === 'success') {
        const { url } = result;
        const code = new URL(url).searchParams.get('code');

        if (!code) {
          return { success: false, error: 'No authorization code received' };
        }

        // Exchange code for tokens via backend
        const response = await api.post('/strava/exchange', { code });

        if (response.data.success) {
          await AsyncStorage.setItem('strava_connected', 'true');
          return {
            success: true,
            athleteId: response.data.athleteId,
          };
        }

        return { success: false, error: 'Failed to exchange code' };
      }

      if (result.type === 'cancel') {
        return { success: false, error: 'User cancelled' };
      }

      return { success: false, error: 'Authentication failed' };
    } catch (error: any) {
      console.error('Strava OAuth error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error',
      };
    }
  },

  /**
   * Disconnect Strava
   */
  disconnect: async (): Promise<boolean> => {
    try {
      await api.post('/strava/disconnect');
      await AsyncStorage.removeItem('strava_connected');
      return true;
    } catch (error) {
      console.error('Error disconnecting Strava:', error);
      return false;
    }
  },

  /**
   * Check if Strava is connected
   */
  isConnected: async (): Promise<boolean> => {
    try {
      const response = await api.get('/strava/status');
      return response.data.connected || false;
    } catch (error) {
      return false;
    }
  },

  /**
   * Manually sync Strava activities
   */
  syncActivities: async (): Promise<{ success: boolean; count?: number; error?: string }> => {
    try {
      const response = await api.post('/strava/sync');
      return {
        success: true,
        count: response.data.activitiesSynced,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Sync failed',
      };
    }
  },
};
