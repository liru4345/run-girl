import React, { useContext, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './styles/colors';
import { AuthProvider, AuthContext } from './services/authContext';
import { initGlympse, startGlympse } from './services/glympse';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProfileScreen from './screens/ProfileScreen';
import FeedScreen from './screens/FeedScreen';
import FriendsScreen from './screens/FriendsScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import StartRunScreen from './screens/StartRunScreen';
import RunRecapScreen from './screens/RunRecapScreen';
import CalendarScreen from './screens/CalendarScreen';
import UserPostsScreen from './screens/UserPostsScreen';
import AboutScreen from './screens/AboutScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Home: 'home',
  Feed: 'compass',
  StartRunTab: 'add-circle',
  Friends: 'search',
  Notifications: 'heart',
  Profile: 'person-circle',
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.gray400,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
          height: 56,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const name = TAB_ICONS[route.name] || 'ellipse';
          return (
            <Ionicons
              name={focused ? name : `${name}-outline`}
              size={route.name === 'Profile' ? size + 6 : size + 2}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={FeedScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="StartRunTab" component={StartRunScreen} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;
    initGlympse();
    startGlympse();
  }, [user]);

  if (loading) {
    return null;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="StartRun" component={StartRunScreen} />
          <Stack.Screen name="RunRecap" component={RunRecapScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="UserPosts" component={UserPostsScreen} />
          <Stack.Screen name="InfoScreen" component={HomeScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
