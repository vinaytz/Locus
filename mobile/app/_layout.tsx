import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { ProgressProvider } from '@/context/ProgressContext';
import { CourseProvider } from '@/context/CourseContext';
import { colors } from '@/theme/colors';

// Web-only: kill the browser's yellow/white autofill background on TextInput
// and disable text selection app-wide so double-tap doesn't highlight UI labels.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const id = 'locus-global-css';
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = `
      /* Disable text selection everywhere except real text inputs. */
      html, body, #root, * {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-tap-highlight-color: transparent;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        user-select: text;
      }
      /* Neutralise Chrome/Safari autofill yellow background. */
      input:-webkit-autofill,
      input:-webkit-autofill:hover,
      input:-webkit-autofill:focus,
      input:-webkit-autofill:active {
        -webkit-text-fill-color: ${colors.text} !important;
        -webkit-box-shadow: 0 0 0 1000px ${colors.bgElevated} inset !important;
        caret-color: ${colors.text} !important;
        transition: background-color 9999s ease-in-out 0s;
      }
      input { background-color: transparent !important; }
      /* Kill the white focus ring on TextInput / textarea on web. */
      input, textarea, select { outline: none !important; box-shadow: none; }
      input:focus, textarea:focus, select:focus { outline: none !important; }
    `;
    document.head.appendChild(style);
  }
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ProgressProvider>
            <CourseProvider>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                  animation: 'fade',
                }}
              />
            </CourseProvider>
          </ProgressProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
