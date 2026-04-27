import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/api/client';
import { DuoButton } from '@/components/DuoButton';
import { colors } from '@/theme/colors';
import { typography } from '@/theme/typography';

export default function AuthScreen() {
  const { register, login, loading } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      if (mode === 'register') {
        if (!name.trim() || name.trim().length < 2) throw new ApiError(400, 'Name must be 2+ chars');
        if (password.length < 8) throw new ApiError(400, 'Password must be 8+ chars');
        await register({ email: email.trim(), password, displayName: name.trim() });
      } else {
        await login({ email: email.trim(), password });
      }
      router.replace('/');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  const isRegister = mode === 'register';
  const disabled =
    submitting ||
    loading ||
    !email.trim() ||
    !password ||
    (isRegister && !name.trim());

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <Text style={styles.mascot}>🦉</Text>
          <Text style={styles.title}>Locus — learn smarter, level up daily.</Text>
        </View>

        <View style={styles.actions}>
          {!!errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={colors.red} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
          {isRegister && (
            <View style={styles.input}>
              <Ionicons name="person" size={18} color={colors.textMuted} />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textDim}
                style={styles.field}
              />
            </View>
          )}
          <View style={styles.input}>
            <Ionicons name="mail" size={18} color={colors.textMuted} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={colors.textDim}
              style={styles.field}
            />
          </View>
          <View style={styles.input}>
            <Ionicons name="lock-closed" size={18} color={colors.textMuted} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 8)"
              secureTextEntry
              autoCapitalize="none"
              placeholderTextColor={colors.textDim}
              style={styles.field}
            />
          </View>

          <DuoButton
            label={isRegister ? 'Create account' : 'Log in'}
            onPress={submit}
            disabled={disabled}
          />
          <Pressable onPress={() => setMode(isRegister ? 'login' : 'register')}>
            <Text style={styles.altText}>
              {isRegister ? 'I ALREADY HAVE AN ACCOUNT' : 'CREATE NEW ACCOUNT'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24 },
  mascot: { fontSize: 96 },
  title: { ...typography.h1, color: colors.text, textAlign: 'center', paddingHorizontal: 12 },
  actions: { gap: 12, paddingBottom: 24 },
  altText: {
    color: colors.blue,
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 0.8,
    
    paddingVertical: 8,
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 0,
    borderColor: 'transparent',
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  field: { flex: 1, color: colors.text, ...typography.body },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#2A0F12',
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: { ...typography.body, color: colors.red, flex: 1, fontWeight: '700' },
});
