import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScreenWrapper({ children }) {
  return (
    <SafeAreaView
      edges={['top']}
      style={{ flex: 1 }}
    >
      {children}
    </SafeAreaView>
  );
}