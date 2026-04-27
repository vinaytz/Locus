import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

// Boot screen: choose where to land based on auth + enrollment state.
export default function Index() {
  const { user, enrollments, ready } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.green} />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth" />;
  const hasEnrollment =
    !!enrollments && (enrollments.exams.length > 0 || enrollments.subjects.length > 0);
  if (!hasEnrollment) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/home" />;
}
