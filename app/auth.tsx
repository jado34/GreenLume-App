// Auth Screen — Multi-view (Welcome, Sign In, Create Account) with Figma pixel-perfect design
import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { storage } from '../utils/storage';
import { supabase } from '../utils/supabase';
import { signInWithGoogle } from '../utils/googleAuth';
import { savePendingReferralCode, redeemReferralCode } from '../utils/referral';
import { Typography } from '../constants/typography';

const { width, height } = Dimensions.get('window');

type AuthMode = 'welcome' | 'signin' | 'signup';

export default function AuthScreen() {
  const [authMode, setAuthMode] = useState<AuthMode>('welcome');
  const [loading, setLoading] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Focused Field State for Professional Inputs
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  // Error States
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const changeAuthMode = (newMode: AuthMode) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    setAuthMode(newMode);
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFocusedInput(null);
  };

  const handleEmailAuth = async () => {
    let isValid = true;

    if (authMode === 'signup' && !name.trim()) {
      setNameError('Please enter your name.');
      isValid = false;
    } else {
      setNameError('');
    }

    const emailValid = /\S+@\S+\.\S+/.test(email.trim());
    if (!email.trim() || !emailValid) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    } else {
      setEmailError('');
    }

    if (!password || (authMode === 'signup' && password.length < 8)) {
      setPasswordError(authMode === 'signin' ? 'Please enter your password.' : 'Password must be at least 8 characters.');
      isValid = false;
    } else {
      setPasswordError('');
    }

    if (authMode === 'signup' && password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    if (!isValid) return;

    setLoading('email');
    try {
      if (authMode === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;

        const userName = data.user?.user_metadata?.full_name || data.user?.email?.split('@')[0] || 'User';
        await storage.setAuthenticated(userName, 'email', data.user!.id);
        await storage.restoreFromSupabase(true);
        Toast.show({ type: 'success', text1: 'Welcome back! 🌿' });
        router.replace('/(tabs)');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
            },
          },
        });
        if (error) throw error;

        await storage.setAuthenticated(name.trim() || 'User', 'email', data.user!.id);

        if (referralCode.trim()) {
          await savePendingReferralCode(referralCode.trim());
          const redeemed = await redeemReferralCode(data.user!.id);
          Toast.show({
            type: redeemed ? 'success' : 'info',
            text1: redeemed ? 'Referral code applied! +50 pts 🎉' : 'Invalid referral code',
            text2: redeemed
              ? 'Both you and your friend earned bonus GreenLume Points!'
              : 'The code you entered was not recognised.',
          });
        } else {
          Toast.show({ type: 'success', text1: 'Account created! 🎉', text2: 'Welcome to GreenLume!' });
        }

        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Authentication Failed', text2: err.message });
    } finally {
      setLoading(null);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading('google');
    await signInWithGoogle();
    setLoading(null);
  };

  const handleGuestAuth = async () => {
    setLoading('guest');
    try {
      await storage.setAuthenticated('Guest User', 'guest', 'guest_123');
      Toast.show({ type: 'success', text1: 'Welcome Guest! 🌿', text2: 'Exploring in Guest Mode' });
      router.replace('/(tabs)');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Guest Mode Failed', text2: err?.message || 'Error logging in as guest' });
    } finally {
      setLoading(null);
    }
  };

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setEmailError('Please enter your email above to reset password.');
      return;
    }
    Alert.alert('Reset Password', `A password reset link will be sent to ${email.trim()}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Send Link',
        onPress: async () => {
          try {
            await supabase.auth.resetPasswordForEmail(email.trim());
            Toast.show({ type: 'success', text1: 'Reset Email Sent 📧', text2: 'Check your inbox for instructions.' });
          } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Reset Failed', text2: err.message });
          }
        },
      },
    ]);
  };

  const handleHelp = () => {
    Alert.alert('Need Help?', 'Contact GreenLume support at support@greenlume.app for assistance.', [
      { text: 'OK' },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Dynamic Screen Background */}
      {authMode === 'welcome' ? (
        <View style={styles.welcomeBgContainer} />
      ) : (
        <Image
          source={
            authMode === 'signin'
              ? require('../assets/images/auth_bg_signin.png')
              : require('../assets/images/auth_bg_signup.png')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>

            {/* ==================== VIEW 1: WELCOME SCREEN ==================== */}
            {authMode === 'welcome' && (
              <View style={styles.welcomeContainer}>
                {/* Header Artwork Banner */}
                <View style={styles.welcomeImageWrap}>
                  <Image
                    source={require('../assets/images/welcome_header_bg.png')}
                    style={styles.welcomeImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Content Section */}
                <View style={styles.welcomeBody}>
                  <Text style={styles.welcomeTitle}>
                    Welcome to <Text style={styles.welcomeTitleBrand}>GreenLume</Text>
                  </Text>

                  <Text style={styles.welcomeSubtitle}>
                    Thousands of small actions become{'\n'}one powerful impact.
                  </Text>

                  {/* Google Button */}
                  <TouchableOpacity
                    style={styles.welcomeGoogleBtn}
                    onPress={handleGoogleAuth}
                    disabled={loading !== null}
                    activeOpacity={0.85}
                  >
                    <Image
                      source={require('../assets/images/google_g.png')}
                      style={styles.welcomeGoogleIcon}
                    />
                    <Text style={styles.welcomeGoogleBtnText}>Continue with Google</Text>
                  </TouchableOpacity>

                  {/* Divider */}
                  <View style={styles.welcomeDividerRow}>
                    <View style={styles.welcomeDividerLine} />
                    <Text style={styles.welcomeDividerText}>Or continue with</Text>
                    <View style={styles.welcomeDividerLine} />
                  </View>

                  {/* Apple Button */}
                  <TouchableOpacity
                    style={styles.welcomeGreyBtn}
                    onPress={handleGoogleAuth}
                    disabled={loading !== null}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-apple" size={20} color="#1e293b" style={{ marginRight: 8 }} />
                    <Text style={styles.welcomeGreyBtnText}>Continue with Apple</Text>
                  </TouchableOpacity>

                  {/* Enter Email Button */}
                  <TouchableOpacity
                    style={styles.welcomeGreyBtn}
                    onPress={() => changeAuthMode('signin')}
                    disabled={loading !== null}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="mail-outline" size={20} color="#1e293b" style={{ marginRight: 8 }} />
                    <Text style={styles.welcomeGreyBtnText}>Enter your Email</Text>
                  </TouchableOpacity>

                  {/* Continue as Guest Button */}
                  <TouchableOpacity
                    style={[styles.welcomeGreyBtn, { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' }]}
                    onPress={handleGuestAuth}
                    disabled={loading !== null}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="person-outline" size={20} color="#2D7A40" style={{ marginRight: 8 }} />
                    <Text style={[styles.welcomeGreyBtnText, { color: '#2D7A40', fontFamily: Typography.fontFamily.bold }]}>
                      {loading === 'guest' ? 'Entering Guest Mode...' : 'Continue as Guest'}
                    </Text>
                  </TouchableOpacity>

                  {/* Already have an account link */}
                  <TouchableOpacity
                    style={styles.welcomeFooterRow}
                    onPress={() => changeAuthMode('signin')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.welcomeFooterText}>
                      Already have an account?{' '}
                      <Text style={styles.welcomeFooterHighlight}>Sign in.</Text>
                    </Text>
                  </TouchableOpacity>

                  {/* Security Footer Note */}
                  <View style={styles.securityFooter}>
                    <Text style={styles.securityBold}>Your data is safe with us.</Text>
                    <Text style={styles.securitySub}>We respect your privacy and will never share your data.</Text>
                  </View>
                </View>
              </View>
            )}

            {/* ==================== VIEW 2 & 3: SIGN IN & CREATE ACCOUNT ==================== */}
            {authMode !== 'welcome' && (
              <View style={styles.authContainer}>
                {/* Top Navigation Bar */}
                <View style={styles.topNav}>
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => changeAuthMode('welcome')}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-back" size={24} color="#1e293b" />
                  </TouchableOpacity>

                  {authMode === 'signin' && (
                    <TouchableOpacity onPress={handleHelp} activeOpacity={0.7}>
                      <Text style={styles.helpText}>Need help?</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Header Content with controlled width so top artwork doesn't overlap text */}
                <View style={styles.headerSection}>
                  {authMode === 'signup' && <Text style={styles.leafIconHeader}>🌿</Text>}

                  <Text style={styles.title}>
                    {authMode === 'signin' ? (
                      <>
                        Welcome{'\n'}back <Text style={styles.leafEmoji}>🌿</Text>
                      </>
                    ) : (
                      <>
                        Create your{'\n'}Greenlume{'\n'}account
                      </>
                    )}
                  </Text>

                  <Text style={styles.subtitle}>
                    {authMode === 'signin'
                      ? 'Lets continue making\na difference'
                      : 'Start your green journey\nand make an impact.'}
                  </Text>
                </View>

                {/* Form Section — Custom spacing per mode: Sign Up inputs pulled up closer to image, Sign In inputs slightly down */}
                <View style={[styles.formSection, authMode === 'signup' ? styles.formSectionSignUp : styles.formSectionSignIn]}>
                  {/* Name Field (Sign Up only) */}
                  {authMode === 'signup' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>What should we call you?</Text>
                      <View
                        style={[
                          styles.inputBox,
                          focusedInput === 'name' && styles.inputBoxFocused,
                          !!nameError && styles.inputBoxError,
                        ]}
                      >
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color={focusedInput === 'name' ? '#2D7A40' : '#94a3b8'}
                          style={styles.fieldIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter name/nickname"
                          placeholderTextColor="#94a3b8"
                          value={name}
                          onFocus={() => setFocusedInput('name')}
                          onBlur={() => setFocusedInput(null)}
                          onChangeText={(t) => {
                            setName(t);
                            if (nameError) setNameError('');
                          }}
                        />
                      </View>
                      {!!nameError && <Text style={styles.errorText}>{nameError}</Text>}
                    </View>
                  )}

                  {/* Email Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <View
                      style={[
                        styles.inputBox,
                        focusedInput === 'email' && styles.inputBoxFocused,
                        !!emailError && styles.inputBoxError,
                      ]}
                    >
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color={focusedInput === 'email' ? '#2D7A40' : '#94a3b8'}
                        style={styles.fieldIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your email"
                        placeholderTextColor="#94a3b8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onFocus={() => setFocusedInput('email')}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={(t) => {
                          setEmail(t);
                          if (emailError) setEmailError('');
                        }}
                      />
                    </View>
                    {!!emailError && <Text style={styles.errorText}>{emailError}</Text>}
                  </View>

                  {/* Password Field */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View
                      style={[
                        styles.inputBox,
                        focusedInput === 'password' && styles.inputBoxFocused,
                        !!passwordError && styles.inputBoxError,
                      ]}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color={focusedInput === 'password' ? '#2D7A40' : '#94a3b8'}
                        style={styles.fieldIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder={authMode === 'signin' ? 'Enter your password' : 'Create a password'}
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        value={password}
                        onFocus={() => setFocusedInput('password')}
                        onBlur={() => setFocusedInput(null)}
                        onChangeText={(t) => {
                          setPassword(t);
                          if (passwordError) setPasswordError('');
                        }}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                      </TouchableOpacity>
                    </View>
                    {!!passwordError && <Text style={styles.errorText}>{passwordError}</Text>}
                  </View>

                  {/* Confirm Password Field (Sign Up only) */}
                  {authMode === 'signup' && (
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Confirm Password</Text>
                      <View
                        style={[
                          styles.inputBox,
                          focusedInput === 'confirmPassword' && styles.inputBoxFocused,
                          !!confirmPasswordError && styles.inputBoxError,
                        ]}
                      >
                        <Ionicons
                          name="lock-closed-outline"
                          size={20}
                          color={focusedInput === 'confirmPassword' ? '#2D7A40' : '#94a3b8'}
                          style={styles.fieldIcon}
                        />
                        <TextInput
                          style={styles.textInput}
                          placeholder="Confirm your password"
                          placeholderTextColor="#94a3b8"
                          secureTextEntry={!showConfirmPassword}
                          value={confirmPassword}
                          onFocus={() => setFocusedInput('confirmPassword')}
                          onBlur={() => setFocusedInput(null)}
                          onChangeText={(t) => {
                            setConfirmPassword(t);
                            if (confirmPasswordError) setConfirmPasswordError('');
                          }}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeBtn}>
                          <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                      {!!confirmPasswordError && <Text style={styles.errorText}>{confirmPasswordError}</Text>}
                    </View>
                  )}

                  {/* Sign In Extras: Forgot password & Remember me */}
                  {authMode === 'signin' && (
                    <View style={styles.optionsRow}>
                      <TouchableOpacity
                        style={styles.rememberMeRow}
                        onPress={() => setRememberMe(!rememberMe)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                          {rememberMe && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                        </View>
                        <Text style={styles.rememberMeText}>Remember me</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleForgotPassword} activeOpacity={0.7}>
                        <Text style={styles.forgotPasswordText}>Forgot password?</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={styles.submitBtn}
                    onPress={handleEmailAuth}
                    disabled={loading !== null}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.submitBtnText}>
                      {loading === 'email'
                        ? 'Processing...'
                        : authMode === 'signin'
                        ? 'Sign In'
                        : 'Create Account'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" style={styles.submitArrow} />
                  </TouchableOpacity>

                  {/* Or Divider */}
                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  {/* Social Login Row */}
                  <View style={styles.socialRow}>
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={handleGoogleAuth}
                      disabled={loading !== null}
                      activeOpacity={0.8}
                    >
                      <Image
                        source={require('../assets/images/google_g.png')}
                        style={styles.googleIcon}
                      />
                      <Text style={styles.socialBtnText}>Continue with Google</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={handleGoogleAuth}
                      disabled={loading !== null}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="logo-apple" size={18} color="#0f172a" style={{ marginRight: 6 }} />
                      <Text style={styles.socialBtnText}>Continue with Apple</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Bottom Toggle Link */}
                  <TouchableOpacity
                    style={styles.toggleRow}
                    onPress={() => changeAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.toggleText}>
                      {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                      <Text style={styles.toggleHighlight}>
                        {authMode === 'signin' ? 'Sign up' : 'Sign in'}
                      </Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  welcomeBgContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight ? StatusBar.currentHeight + 8 : 28,
    paddingBottom: 28,
  },

  /* --- WELCOME SCREEN STYLES --- */
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  welcomeImageWrap: {
    width: width,
    height: Math.min(height * 0.38, 320),
    backgroundColor: '#ffffff',
  },
  welcomeImage: {
    width: '100%',
    height: '100%',
  },
  welcomeBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 20,
  },
  welcomeTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 28,
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeTitleBrand: {
    fontFamily: Typography.fontFamily.bold,
    color: '#15803d',
  },
  welcomeSubtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
  },
  welcomeGoogleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eaf7ed',
    borderWidth: 1,
    borderColor: '#d1fae5',
    height: 52,
    borderRadius: 16,
    width: '100%',
    marginBottom: 14,
  },
  welcomeGoogleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
    resizeMode: 'contain',
  },
  welcomeGoogleBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#15803d',
  },
  welcomeDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
    width: '100%',
    paddingHorizontal: 8,
  },
  welcomeDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  welcomeDividerText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 12,
    color: '#94a3b8',
    marginHorizontal: 12,
  },
  welcomeGreyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    height: 52,
    borderRadius: 16,
    width: '100%',
    marginBottom: 12,
  },
  welcomeGreyBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 15,
    color: '#334155',
  },
  welcomeFooterRow: {
    paddingVertical: 12,
    marginTop: 4,
  },
  welcomeFooterText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: '#64748b',
  },
  welcomeFooterHighlight: {
    fontFamily: Typography.fontFamily.bold,
    color: '#15803d',
  },
  securityFooter: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 16,
  },
  securityBold: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: '#1e293b',
    marginBottom: 2,
  },
  securitySub: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },

  /* --- AUTH SCREENS STYLES (SIGN IN & CREATE ACCOUNT) --- */
  authContainer: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    height: 44,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 14,
    color: '#2D7A40',
  },
  headerSection: {
    paddingHorizontal: 28,
    marginTop: 8,
    marginBottom: 0,
    maxWidth: width * 0.54,
  },
  leafIconHeader: {
    fontSize: 22,
    marginBottom: 4,
  },
  title: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 30,
    lineHeight: 36,
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  leafEmoji: {
    fontSize: 24,
  },
  subtitle: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
  },
  formSection: {
    paddingHorizontal: 24,
  },
  formSectionSignIn: {
    marginTop: Math.max(145, height * 0.17),
  },
  formSectionSignUp: {
    marginTop: Math.max(65, height * 0.075),
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: '#1e293b',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  inputBoxFocused: {
    borderColor: '#2D7A40',
    shadowColor: '#2D7A40',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  inputBoxError: {
    borderColor: '#ef4444',
  },
  fieldIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  errorText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    marginLeft: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
    marginBottom: 16,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2D7A40',
    borderColor: '#2D7A40',
  },
  rememberMeText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 13,
    color: '#334155',
  },
  forgotPasswordText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 13,
    color: '#2D7A40',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2D7A40',
    height: 54,
    borderRadius: 16,
    marginTop: 6,
    shadowColor: '#2D7A40',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 16,
    color: '#ffffff',
  },
  submitArrow: {
    marginLeft: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    paddingHorizontal: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
    opacity: 0.6,
  },
  dividerText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 12,
    color: '#94a3b8',
    marginHorizontal: 12,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain',
  },
  socialBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: 12,
    color: '#334155',
  },
  toggleRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  toggleText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: 14,
    color: '#475569',
  },
  toggleHighlight: {
    fontFamily: Typography.fontFamily.bold,
    color: '#2D7A40',
  },
});

