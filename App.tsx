import React, { useState, useCallback, useEffect } from 'react';
import { Text, ActivityIndicator, View, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import NewNoteScreen from './src/screens/NewNoteScreen';
import NotesListScreen from './src/screens/NotesListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { RootTabParamList } from './src/types';
import { ThemeProvider, useThemeContext } from './src/config/ThemeContext';
import { getNotes } from './src/services/storage';

const Tab = createBottomTabNavigator<RootTabParamList>();

const isWeb = Platform.OS === 'web';

let authModule: any;
let syncModule: any;

if (isWeb) {
  authModule = require('./src/services/firebase-web');
  syncModule = require('./src/services/firebase-web');
} else {
  authModule = require('@react-native-firebase/auth').default;
  syncModule = require('./src/services/sync');
}

function AppContent() {
  const [apiKey, setApiKey] = useState(() => {
    return process.env.EXPO_PUBLIC_DEEPSEEK_API_KEY || '';
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { colors, isDark } = useThemeContext();

  useEffect(() => {
    if (isWeb) {
      const unsubscribe = authModule.onAuthStateChanged((u: any) => {
        setUser(u);
        setLoading(false);
      });
      return unsubscribe;
    } else {
      const unsubscribe = authModule.onAuthStateChanged((firebaseUser: any) => {
        setUser(firebaseUser);
        setLoading(false);
      });
      return unsubscribe;
    }
  }, []);

  useEffect(() => {
    if (user) {
      syncData();
    }
  }, [user]);

  const syncData = async () => {
    try {
      if (isWeb) {
        const cloudNotes = await syncModule.fetchNotesFromCloud();
        const localNotes = await getNotes();
        await syncModule.mergeNotes(localNotes, cloudNotes);
      } else {
        const cloudNotes = await syncModule.fetchNotesFromCloud();
        const localNotes = await getNotes();
        await syncModule.mergeNotes(localNotes, cloudNotes);
      }
      setRefreshKey((k) => k + 1);
    } catch (err) {
      console.log('Sync error:', err);
    }
  };

  const handleNoteSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
    if (user) {
      if (isWeb) {
        syncModule.syncNotesToCloud().catch(console.log);
      } else {
        syncModule.syncNotesToCloud().catch(console.log);
      }
    }
  }, [user]);

  const handleAuthComplete = () => {
    const stored = localStorage.getItem('@firebase_user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    const AuthScreen = isWeb
      ? require('./src/screens/AuthScreenWeb').default
      : require('./src/screens/AuthScreen').default;

    return (
      <ThemeProvider>
        <AuthScreen onAuthComplete={handleAuthComplete} />
      </ThemeProvider>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            paddingBottom: 4,
          },
        }}
      >
        <Tab.Screen
          name="Notes"
          options={{
            tabBarLabel: 'Notes',
            tabBarIcon: ({ size }) => (
              <TabIcon icon="📝" size={size} />
            ),
          }}
        >
          {() => <NotesListScreen refreshKey={refreshKey} apiKey={apiKey} />}
        </Tab.Screen>
        <Tab.Screen
          name="NewNote"
          options={{
            tabBarLabel: 'New',
            tabBarIcon: ({ size }) => (
              <TabIcon icon="✨" size={size} />
            ),
          }}
        >
          {() => (
            <NewNoteScreen apiKey={apiKey} onNoteSaved={handleNoteSaved} />
          )}
        </Tab.Screen>
        <Tab.Screen
          name="Settings"
          options={{
            tabBarLabel: 'Settings',
            tabBarIcon: ({ size }) => (
              <TabIcon icon="⚙️" size={size} />
            ),
          }}
        >
          {() => (
            <SettingsScreen apiKey={apiKey} onApiKeyChange={setApiKey} />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function TabIcon({ icon, size }: { icon: string; size: number }) {
  return <Text style={{ fontSize: size - 4 }}>{icon}</Text>;
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
