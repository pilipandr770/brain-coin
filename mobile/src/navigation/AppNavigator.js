import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../context/AuthContext';

import LoadingScreen    from '../screens/LoadingScreen';
import LoginScreen      from '../screens/LoginScreen';
import RegisterScreen   from '../screens/RegisterScreen';
import WelcomeScreen    from '../screens/WelcomeScreen';
import Impressum        from '../screens/legal/Impressum';
import Datenschutz      from '../screens/legal/Datenschutz';
import AGB              from '../screens/legal/AGB';

import ParentDashboard  from '../screens/parent/ParentDashboard';
import CreateChild      from '../screens/parent/CreateChild';
import ParentStats      from '../screens/parent/ParentStats';
import InviteScreen     from '../screens/parent/InviteScreen';
import CreateContract   from '../screens/parent/CreateContract';

import ChildHome        from '../screens/child/ChildHome';
import QuizScreen       from '../screens/child/QuizScreen';
import Leaderboard      from '../screens/child/Leaderboard';
import ConnectParent    from '../screens/child/ConnectParent';
import ProfileScreen    from '../screens/child/ProfileScreen';
import FriendsScreen    from '../screens/child/FriendsScreen';
import ChatScreen       from '../screens/child/ChatScreen';
import MistakeReview    from '../screens/child/MistakeReview';

import ContentSettings   from '../screens/parent/ContentSettings';
import SubscriptionScreen from '../screens/parent/SubscriptionScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

function ParentTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard:      'home-outline',
            AddChild:       'person-add-outline',
            Invite:         'link-outline',
            NewContract:    'document-text-outline',
            Subscription:   'wallet-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor:   '#1d4ed8',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Dashboard"    component={ParentDashboard}   options={{ title: t('nav.dashboard') }} />
      <Tab.Screen name="NewContract"  component={CreateContract}     options={{ title: t('contract.new') }} />
      <Tab.Screen name="AddChild"     component={CreateChild}        options={{ title: t('parent.addChild') }} />
      <Tab.Screen name="Invite"       component={InviteScreen}       options={{ title: t('parent.generateInvite') }} />
      <Tab.Screen name="Subscription" component={SubscriptionScreen} options={{ title: 'Abo' }} />
    </Tab.Navigator>
  );
}

function ChildTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home:        'game-controller-outline',
            Leaderboard: 'trophy-outline',
            Friends:     'people-outline',
            Profile:     'person-circle-outline',
          };
          return <Ionicons name={icons[route.name] || 'ellipse-outline'} size={size} color={color} />;
        },
        tabBarActiveTintColor:   '#7c3aed',
        tabBarInactiveTintColor: '#64748b',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home"        component={ChildHome}     options={{ title: t('nav.home') }} />
      <Tab.Screen name="Leaderboard" component={Leaderboard}   options={{ title: t('nav.leaderboard') }} />
      <Tab.Screen name="Friends"     component={FriendsScreen} options={{ title: 'Freunde' }} />
      <Tab.Screen name="Profile"     component={ProfileScreen} options={{ title: t('nav.profile') }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) return (
    <View style={styles.fill}>
      <LoadingScreen />
    </View>
  );

  return (
    <View style={styles.fill}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Welcome"     component={WelcomeScreen} />
            <Stack.Screen name="Login"       component={LoginScreen} />
            <Stack.Screen name="Register"    component={RegisterScreen} />
            <Stack.Screen name="Impressum"   component={Impressum} />
            <Stack.Screen name="Datenschutz" component={Datenschutz} />
            <Stack.Screen name="AGB"         component={AGB} />
          </>
        ) : user.role === 'parent' || user.role === 'admin' ? (
          <>
            <Stack.Screen name="ParentMain"       component={ParentTabs} />
            <Stack.Screen name="Stats"             component={ParentStats}
              options={{ headerShown: true, title: 'Statistik' }} />
            <Stack.Screen name="ContentSettings"   component={ContentSettings}
              options={{ headerShown: true, title: 'Einstellungen' }} />
            <Stack.Screen name="CreateContract"    component={CreateContract}
              options={{ headerShown: true, title: 'Neuer Vertrag' }} />
          </>
        ) : (
          <>
            <Stack.Screen name="ChildMain"     component={ChildTabs} />
            <Stack.Screen name="Quiz"          component={QuizScreen}
              options={{ headerShown: true, title: 'Quiz' }} />
            <Stack.Screen name="MistakeReview" component={MistakeReview}
              options={{ headerShown: false }} />
            <Stack.Screen name="Chat"          component={ChatScreen}
              options={{ headerShown: true, title: 'Chat' }} />
            <Stack.Screen name="ConnectParent" component={ConnectParent}
              options={{ headerShown: true, title: 'Elternteil verbinden' }} />
          </>
        )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, width: '100%', height: '100%' },
});

