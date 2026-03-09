import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { initDatabase } from './src/database/database';
import { LoadingView } from './src/components/UI';
import { COLORS, FONTS, SPACING, RADIUS } from './src/styles/theme';

import LoginScreen from './src/screens/LoginScreen';
import QuizScreen from './src/screens/QuizScreen';
import QuizManageScreen from './src/screens/QuizManageScreen';

import VokabelLearnScreen from './src/screens/VokabelLearnScreen';
import AdminScreen from './src/screens/AdminScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, label, focused }) {
  return (
    <View style={[tabStyles.tabItem, focused && tabStyles.tabItemActive]}>
      <Text style={[tabStyles.tabEmoji, focused && tabStyles.tabEmojiActive]}>
        {emoji}
      </Text>
      <Text style={[tabStyles.tabLabel, focused && tabStyles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs({ route }) {
  const username = route?.params?.username || 'Spieler';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: tabStyles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        initialParams={{ username }}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🧠" label="Quiz" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="QuizVerwalten"
        component={QuizManageScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="Verwalten" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="VokabelLernen"
        component={VokabelLearnScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎓" label="Lernen" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Abmelden"
        component={View}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Login');
          },
        })}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🚪" label="Logout" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        await initDatabase();
        setDbReady(true);
      } catch (error) {
        console.error('Database init error:', error);
      }
    }
    init();
  }, []);

  if (!dbReady) {
    return <LoadingView message="Datenbank wird initialisiert..." />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Admin" component={AdminScreen} />
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabEmoji: {
    fontSize: 22,
    marginBottom: 2,
    opacity: 0.5,
  },
  tabEmojiActive: {
    opacity: 1,
    fontSize: 24,
  },
  tabLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: FONTS.weights.medium,
  },
  tabLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: FONTS.weights.bold,
  },
});
