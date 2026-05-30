// Auth Screen — Google OAuth, Email/Password, and Guest Mode
import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Dimensions, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { signInWithGoogle } from '../utils/googleAuth';
import { savePendingReferralCode, redeemReferralCode } from '../utils/referral';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(40)).current;
  const orb1 = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideUp, { toValue: 0, damping: 20, stiffness: 100, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orb1, { toValue: 1.15, duration: 3000, useNativeDriver: true }),
        Animated.timing(orb1, { toValue: 0.9, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // --- Email + Password Auth ---
  const handleEmailAuth = async () => {
    // FIX #9: Email format validation
    const emailValid = /\S+@\S+\.\S+/.test(email.trim());
    if (!email.trim() || !emailValid) {
      setEmailError('Please enter a valid email address.');
      return;
    } else {
      setEmailError('');
    }

    // FIX #8: Password minimum length validation
    if (!password || (!isLogin && password.length < 8)) {
      setPasswordError(isLogin ? 'Please enter your password.' : 'Password must be at least 8 characters.');
      return;
    } else if (!password) {
      setPasswordError('Please enter your password.');
      return;
    } else {
      setPasswordError('');
    }

    setLoading('email');
    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        
        await storage.setAuthenticated(data.user?.email?.split('@')[0] || 'User', 'email', data.user!.id);
        await storage.restoreFromSupabase(true);
        Toast.show({ type: 'success', text1: 'Welcome back! 🌿' });
        router.replace('/(tabs)'); // Route to tabs directly
      } else {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;

        await storage.setAuthenticated(data.user?.email?.split('@')[0] || 'User', 'email', data.user!.id);

        // Redeem referral code if one was entered
        if (referralCode.trim()) {
          await savePendingReferralCode(referralCode.trim());
          const redeemed = await redeemReferralCode(data.user!.id);
          Toast.show({
            type: redeemed ? 'success' : 'info',
            text1: redeemed ? 'Referral code applied! +50 pts 🎉' : 'Invalid referral code',
            text2: redeemed ? 'Both you and your friend earned bonus GreenLume Points!' : 'The code you entered was not recognised.',
          });
        } else {
          Toast.show({ type: 'success', text1: 'Account created! 🎉', text2: 'Welcome to GreenLume!' });
        }

        router.replace('/onboarding');
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Authentication Failed', text2: err.message });
    } finally {
      setLoading(null);
    }
  };

  // --- Guest Mode (local-only, no Supabase) ---
  const handleGuestMode = async () => {
    setLoading('guest');
    await storage.setAuthenticated('Guest', 'guest', 'guest_' + Date.now());
    setLoading(null);
    router.replace('/onboarding');
  };

  // --- Google Sign-In ---
  const handleGoogleAuth = async () => {
    setLoading('google');
    await signInWithGoogle();
    setLoading(null);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primary95, '#dff0e3', Colors.primary90]} style={StyleSheet.absoluteFill} />

      {/* Decorative circles */}
      <Animated.View style={[styles.orb, styles.orb1, { transform: [{ scale: orb1 }] }]} />
      <Animated.View style={[styles.orb, styles.orb2]} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, width: '100%' }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }} showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.content, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
            {/* Logo */}
            <Image source={require('../assets/images/logo_color.png')} style={styles.logo} resizeMode="contain" />

            <View style={styles.headerText}>
              <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join GreenLume'}</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Sign in to continue your sustainability journey' : 'Create an account to start tracking impacts'}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.formContainer}>
              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={20} color={emailError ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={Colors.neutral400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); }}
                  accessibilityLabel="Email address"
                />
              </View>
              {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={20} color={passwordError ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.neutral400}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); }}
                  accessibilityLabel="Password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
              {!!passwordError && <Text style={styles.fieldError}>{passwordError}</Text>}
              {!isLogin && !passwordError && (
                <Text style={styles.passwordHint}>Minimum 8 characters</Text>
              )}

              {/* Referral code — only shown during signup */}
              {!isLogin && (
                <View style={styles.referralWrap}>
                  <Ionicons name="gift-outline" size={20} color={Colors.primary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Invite code (optional)"
                    placeholderTextColor={Colors.neutral400}
                    autoCapitalize="characters"
                    value={referralCode}
                    onChangeText={setReferralCode}
                    accessibilityLabel="Referral invite code"
                  />
                </View>
              )}

              <TouchableOpacity
                style={[styles.authButton, styles.emailButton]}
                onPress={handleEmailAuth}
                disabled={loading !== null}
                activeOpacity={0.8}
              >
                {loading === 'email' ? (
                  <Text style={styles.emailButtonText}>Processing...</Text>
                ) : (
                  <Text style={styles.emailButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.toggleRow} onPress={() => { setIsLogin(!isLogin); setEmailError(''); setPasswordError(''); }} activeOpacity={0.6}>
                <Text style={styles.toggleText}>
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                  <Text style={styles.toggleTextBold}>{isLogin ? 'Sign up' : 'Log in'}</Text>
                </Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Other Auth Buttons */}
            <View style={styles.buttonsContainer}>
              {/* Google */}
              <TouchableOpacity
                style={[styles.authButton, styles.googleButton]}
                onPress={handleGoogleAuth}
                disabled={loading !== null}
                activeOpacity={0.9}
              >
                <View style={styles.googleIcon}>
                  <Image source={require('../assets/images/google_g.png')} style={styles.googleImage} />
                </View>
                <Text style={styles.googleText}>Sign {isLogin ? 'in' : 'up'} with Google</Text>
              </TouchableOpacity>

              {/* Guest Mode */}
              <TouchableOpacity
                onPress={handleGuestMode}
                disabled={loading !== null}
                activeOpacity={0.8}
                style={{ marginTop: 8 }}
              >
                <Text style={styles.guestText}>Continue as Guest</Text>
              </TouchableOpacity>
            </View>

            {/* Privacy — FIX #10: Terms and Privacy links are now tappable */}
            <Text style={styles.privacy}>
              By continuing, you agree to our{' '}
              <Text style={styles.link} onPress={() => router.push('/terms-of-service' as any)}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.link} onPress={() => router.push('/privacy-policy' as any)}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary95, alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', borderRadius: 9999 },
  orb1: { top: -60, right: -60, width: 200, height: 200, backgroundColor: 'rgba(46,125,50,0.12)' },
  orb2: { bottom: -80, left: -80, width: 240, height: 240, backgroundColor: 'rgba(102,187,106,0.10)' },
  content: { width: '100%', alignItems: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  logo: { width: 280, height: 140, marginBottom: 24 },
  headerText: { alignItems: 'center', marginBottom: 24 },
  title: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'], color: Colors.textPrimary, marginBottom: 8 },
  subtitle: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: 20, lineHeight: 20 },
  formContainer: { width: '100%', gap: 14, marginBottom: 24 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', paddingHorizontal: 16, height: 54, ...Shadows.sm },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md, color: Colors.textPrimary, height: '100%' },
  authButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 14, height: 54, ...Shadows.md },
  emailButton: { backgroundColor: Colors.primary, marginTop: 4 },
  emailButtonText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.white },
  toggleRow: { alignItems: 'center', paddingVertical: 6 },
  toggleText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  toggleTextBold: { fontFamily: Typography.fontFamily.bold, color: Colors.primary },
  buttonsContainer: { width: '100%', gap: 12 },
  googleButton: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.neutral200 },
  googleIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  googleImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  googleText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20, width: '100%', paddingHorizontal: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(0,0,0,0.1)' },
  dividerText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  guestText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.primary, textAlign: 'center', paddingVertical: 4 },
  privacy: { fontFamily: Typography.fontFamily.regular, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: 32, lineHeight: 16 },
  link: { color: Colors.primary, fontFamily: Typography.fontFamily.medium },
  fieldError: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: Colors.error, marginTop: -8 },
  passwordHint: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginTop: -8 },
  referralWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary90, borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, paddingHorizontal: 16, height: 54 },
});
