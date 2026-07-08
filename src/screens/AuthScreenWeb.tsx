import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  skipAuth,
  User,
} from '../services/firebase-web';
import { useThemeContext } from '../config/ThemeContext';
import { ThemeColors } from '../config/theme';

interface Props {
  onAuthComplete: () => void;
}

export default function AuthScreenWeb({ onAuthComplete }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const { colors } = useThemeContext();
  const styles = createStyles(colors);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (user) {
        onAuthComplete();
      }
    });

    return unsubscribe;
  }, []);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
      showAlert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(email.trim(), password);
      }
      onAuthComplete();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      let userMessage = 'Authentication error';

      if (message.includes('auth/email-already-in-use')) {
        userMessage = 'Email already in use';
      } else if (message.includes('auth/invalid-email')) {
        userMessage = 'Invalid email';
      } else if (message.includes('auth/user-not-found')) {
        userMessage = 'User not found';
      } else if (message.includes('auth/wrong-password')) {
        userMessage = 'Wrong password';
      } else if (message.includes('auth/weak-password')) {
        userMessage = 'Weak password';
      }

      showAlert('Error', userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    skipAuth();
    onAuthComplete();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>AI Notes</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to your account' : 'Create an account'}
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>
                {isLogin ? 'Sign in' : 'Sign up'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchBtn}
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Authentication is needed to sync notes between devices
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    icon: {
      fontSize: 64,
      marginBottom: 16,
    },
    title: {
      fontSize: 32,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    form: {
      width: '100%',
      maxWidth: 320,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      marginBottom: 12,
    },
    btn: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 4,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16,
    },
    switchBtn: {
      marginTop: 16,
      alignItems: 'center',
    },
    switchText: {
      color: colors.primary,
      fontSize: 14,
    },
    skipBtn: {
      marginTop: 32,
      paddingVertical: 12,
      paddingHorizontal: 24,
    },
    skipText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    hint: {
      color: colors.textTertiary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 16,
      maxWidth: 280,
    },
  });
}
