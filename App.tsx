import React, { useState, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import NewNoteScreen from './src/screens/NewNoteScreen';
import NotesListScreen from './src/screens/NotesListScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { RootTabParamList } from './src/types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function App() {
  const [apiKey, setApiKey] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleNoteSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#e0e0e0',
            paddingBottom: 4,
          },
        }}
      >
        <Tab.Screen
          name="Notes"
          options={{
            tabBarLabel: 'Заметки',
            tabBarIcon: ({ color, size }) => (
              <TabIcon icon="📝" size={size} />
            ),
          }}
        >
          {() => <NotesListScreen refreshKey={refreshKey} />}
        </Tab.Screen>
        <Tab.Screen
          name="NewNote"
          options={{
            tabBarLabel: 'Новая',
            tabBarIcon: ({ color, size }) => (
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
            tabBarLabel: 'Настройки',
            tabBarIcon: ({ color, size }) => (
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
  const React = require('react');
  const { Text } = require('react-native');
  return <Text style={{ fontSize: size - 4 }}>{icon}</Text>;
}
