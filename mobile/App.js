import './src/i18n'; // init i18n before anything else
import { registerRootComponent } from 'expo';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SystemBars } from 'react-native-edge-to-edge';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <SystemBars style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

// registerRootComponent mounts to #root on web and calls AppRegistry on native
registerRootComponent(App);
