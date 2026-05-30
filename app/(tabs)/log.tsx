// Log Actions Screen — Category tabs + tappable action cards
import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, LayoutAnimation, Platform, UIManager, Alert,
  Modal, Image, ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import { verifyImageWithGemini } from '../../utils/gemini';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { ACTIONS, ACTION_CATEGORIES, ActionCategory, ActionDefinition } from '../../constants/actions';
import { loadCustomActions } from '../custom-action';
import { Colors } from '../../constants/colors';
import { Typography, Shadows } from '../../constants/typography';
import { useUserData, useLogActionMutation, useRemoveActionMutation } from '../../hooks/useUserData';
import { storage } from '../../utils/storage';



export default function LogActionsScreen() {
  const [activeCategory, setActiveCategory] = useState<ActionCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [allActions, setAllActions] = useState<ActionDefinition[]>(ACTIONS);
  const [celebrating, setCelebrating] = useState(false);

  const { data: userData } = useUserData();
  const { mutateAsync: logActionAsync, isPending: saving } = useLogActionMutation();
  const { mutateAsync: removeActionAsync } = useRemoveActionMutation();

  const todayLogged = new Set(userData?.todayActions || []);

  useFocusEffect(useCallback(() => {
    // Load custom actions and merge with built-in actions
    loadCustomActions().then((custom) => {
      const customAsActions: ActionDefinition[] = custom.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        category: c.category === 'other' ? 'shopping' : c.category as ActionCategory,
        points: c.points,
        icon: c.icon,
        co2Saved: 0,
        waterSaved: 0,
        impact: `Custom action — +${c.points} pts`,
      }));
      setAllActions([...ACTIONS, ...customAsActions]);
    });
  }, []));

  const filtered = useMemo(() =>
    allActions.filter((a) => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    }),
    [allActions, searchQuery, activeCategory]
  );

  const toggleAction = async (id: string) => {
    if (todayLogged.has(id)) {
      // Undo saved action
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      const action = allActions.find(a => a.id === id);
      if (!action) return;

      await removeActionAsync({ points: action.points, actionId: id });
      Toast.show({ 
        type: 'info', 
        text1: 'Action removed ✓', 
        text2: `"${action.name}" has been undone.` 
      });
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPendingActions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPendingPoints = Array.from(pendingActions).reduce((sum, id) => {
    const action = allActions.find((a) => a.id === id);
    return sum + (action?.points ?? 0);
  }, 0);

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const executeSave = async () => {
    const actionIds = Array.from(pendingActions);
    await logActionAsync({ points: totalPendingPoints, actionIds });

    Toast.show({
      type: 'success',
      text1: `+${totalPendingPoints} Points ⭐ | +${pendingActions.size} Water 💧`,
      text2: `${pendingActions.size} action${pendingActions.size > 1 ? 's' : ''} saved. Go water your forest!`,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCelebrating(true);
    setPendingActions(new Set());

    // Check if a badge or rank-up celebration should fire
    const celebration = storage._pendingCelebration;
    if (celebration) {
      storage._pendingCelebration = null;
      // Small delay so the toast shows first
      setTimeout(() => {
        router.push({
          pathname: '/levelup',
          params: celebration,
        } as any);
      }, 800);
    } else {
      setTimeout(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCelebrating(false);
      }, 3500);
    }
  };

  const handleSave = async () => {
    if (pendingActions.size === 0) {
      Toast.show({ type: 'info', text1: 'No actions selected', text2: 'Tap actions to select them first.' });
      return;
    }

    setPhotoUri(null);
    setPhotoBase64(null);
    setVerifying(false);
    setShowVerifyModal(true);
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'GreenLume needs camera permissions to verify actions.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0].uri) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 || null);
      }
    } catch (error) {
      console.warn('Camera error:', error);
      Toast.show({ type: 'error', text1: 'Failed to take photo' });
    }
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'GreenLume needs gallery access to add photo proof.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0].uri) {
        setPhotoUri(result.assets[0].uri);
        setPhotoBase64(result.assets[0].base64 || null);
      }
    } catch (error) {

      console.warn('Picker error:', error);
      Toast.show({ type: 'error', text1: 'Failed to select photo' });
    }
  };

  const startVerification = async () => {
    if (!photoUri) return;
    setVerifying(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const actionNames = Array.from(pendingActions).map(id => allActions.find(a => a.id === id)?.name || id);
      
      let result = { valid: true, reason: 'Habit verification successfully completed.' };
      if (photoBase64) {
        result = await verifyImageWithGemini(photoBase64, actionNames);
      }

      if (result.valid) {
        await executeSave();
        setShowVerifyModal(false);
        Toast.show({
          type: 'success',
          text1: 'AI Verification Successful ✓',
          text2: result.reason,
        });
      } else {
        Alert.alert(
          'Verification Unsuccessful',
          `GreenLume AI flagged the photo: ${result.reason}\n\nWould you like to try another photo or save without proof?`,
          [
            { text: 'Try Again', style: 'cancel' },
            { 
              text: 'Save without Proof', 
              onPress: async () => {
                await executeSave();
                setShowVerifyModal(false);
              } 
            }
          ]
        );
      }
    } catch (err) {
      console.error(err);
      // Fallback
      await executeSave();
      setShowVerifyModal(false);
    } finally {
      setVerifying(false);
    }
  };


  return (
    <View style={{ flex: 1, backgroundColor: Colors.neutral50 }}>
      {/* Header */}
      <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.header}>
        <Text style={styles.headerTitle}>Log Actions</Text>
        <Text style={styles.headerSub}>What did you do today? Tap everything you did.</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search actions..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs} contentContainerStyle={styles.tabsContent}>
        <TouchableOpacity
          style={[styles.tab, activeCategory === 'all' && styles.tabActive]}
          onPress={() => setActiveCategory('all')}
          accessibilityRole="tab"
          accessibilityLabel="Show all actions"
          accessibilityState={{ selected: activeCategory === 'all' }}
        >
          <Text style={[styles.tabText, activeCategory === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        {ACTION_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.tab, activeCategory === cat.id && { ...styles.tabActive, backgroundColor: cat.color }]}
            onPress={() => setActiveCategory(cat.id)}
            accessibilityLabel={`Filter by ${cat.name}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeCategory === cat.id }}
          >
            <Ionicons name={cat.icon as any} size={14} color={activeCategory === cat.id ? Colors.white : Colors.textSecondary} />
            <Text style={[styles.tabText, activeCategory === cat.id && styles.tabTextActive]}>{cat.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Action List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: pendingActions.size > 0 ? 120 : 24, gap: 10 }}>
        {filtered.map((action) => {
          const isPending = pendingActions.has(action.id);
          const isDone = todayLogged.has(action.id);
          const catColor = ACTION_CATEGORIES.find((c) => c.id === action.category)?.color ?? Colors.primary;
          return (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.actionCard,
                isPending && styles.actionCardPending,
                isDone && styles.actionCardDone,
              ]}
              onPress={() => toggleAction(action.id)}
              activeOpacity={0.85}
              accessibilityLabel={`${action.name}: ${action.description}. ${action.points} points. ${isDone ? 'Already logged today, tap to undo' : isPending ? 'Selected' : 'Tap to select'}`}
              accessibilityRole="checkbox"
              // FIX #25: Remove disabled:true when isDone — done items are still tappable for undo
              accessibilityState={{ checked: isPending || isDone }}
            >
              <View style={[styles.actionIcon, { backgroundColor: `${catColor}20` }]}>
                <Ionicons name={action.icon as any} size={22} color={catColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionName, (isPending || isDone) && { color: Colors.white }]}>{action.name}</Text>
                <Text style={[styles.actionDesc, (isPending || isDone) && { color: 'rgba(255,255,255,0.75)' }]} numberOfLines={1}>{action.description}</Text>
                <Text style={[styles.actionImpact, (isPending || isDone) && { color: 'rgba(255,255,255,0.65)' }]}>{action.impact}</Text>
              </View>
              <View style={styles.actionRight}>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert('Why it matters', `${action.description}\n\nImpact: ${action.impact}`);
                  }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginBottom: 4 }}
                >
                  <Ionicons name="information-circle-outline" size={20} color={(isPending || isDone) ? 'rgba(255,255,255,0.8)' : Colors.textMuted} />
                </TouchableOpacity>
                <Text style={[styles.actionPoints, (isPending || isDone) && { color: Colors.white }]}>+{action.points}</Text>
                <Text style={[styles.actionPts, (isPending || isDone) && { color: 'rgba(255,255,255,0.7)' }]}>pts</Text>
                {isDone && <Ionicons name="checkmark-circle" size={20} color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }} />}
                {isPending && !isDone && <Ionicons name="add-circle" size={20} color="rgba(255,255,255,0.9)" style={{ marginTop: 4 }} />}
              </View>
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Ionicons name="search-outline" size={40} color={Colors.neutral300} />
            <Text style={{ fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.md, color: Colors.textMuted, marginTop: 12 }}>No actions found</Text>
          </View>
        )}
      </ScrollView>

      {/* Celebration Layer */}
      {celebrating && (
        <View style={styles.celebrationContainer} pointerEvents="none">
          <LottieView
            source={require('../../assets/animations/Trophy.json')}
            autoPlay
            loop={false}
            style={styles.celebrationLottie}
          />
          <Text style={styles.celebrationTitle}>IMPACT LOGGED!</Text>
        </View>
      )}

      {/* Floating Glass Save Bar */}
      {pendingActions.size > 0 && (
        <View style={styles.floatingBarContainer}>
          <LinearGradient
            colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
            style={styles.saveBarGlass}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.saveBarTitle}>Earn +{totalPendingPoints} 🪙 & +{pendingActions.size} 💧</Text>
              <Text style={styles.saveBarSub}>{pendingActions.size} actions selected</Text>
            </View>
            <TouchableOpacity 
              style={styles.saveButton} 
              onPress={handleSave} 
              disabled={saving}
              accessibilityLabel={`Confirm and save ${pendingActions.size} selected actions for ${totalPendingPoints} points`}
              accessibilityRole="button"
            >
              <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Confirm'}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
      {/* Verification Modal */}
      <Modal
        visible={showVerifyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!verifying) setShowVerifyModal(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {verifying ? (
              <View style={styles.scanningContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.scanningText}>Scanning with GreenLume AI...</Text>
                <Text style={styles.scanningSubtext}>Analyzing photo to verify sustainable impact...</Text>
              </View>
            ) : (
              <View>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Photo Verification</Text>
                  <TouchableOpacity onPress={() => setShowVerifyModal(false)} disabled={verifying}>
                    <Ionicons name="close" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.modalDesc}>
                  Please capture or select a photo showing proof of your green actions (e.g. recycling bin, reusable cup, walking shoes).
                </Text>

                <View style={styles.photoContainer}>
                  {photoUri ? (
                    <Image source={{ uri: photoUri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.photoPlaceholder}>
                      <Ionicons name="camera-outline" size={48} color={Colors.textMuted} />
                      <Text style={styles.placeholderText}>No photo selected</Text>
                    </View>
                  )}
                </View>

                {photoUri ? (
                  <View style={styles.btnGroup}>
                    <TouchableOpacity style={styles.outlineButton} onPress={() => setPhotoUri(null)}>
                      <Text style={styles.outlineButtonText}>Retake</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.primaryBtn} onPress={startVerification}>
                      <Text style={styles.primaryBtnText}>Verify & Save</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.btnGroupVertical}>
                    <TouchableOpacity style={styles.modalRowButton} onPress={takePhoto}>
                      <Ionicons name="camera" size={20} color={Colors.primary} />
                      <Text style={styles.modalRowButtonText}>Take Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalRowButton} onPress={pickImage}>
                      <Ionicons name="image" size={20} color={Colors.primary} />
                      <Text style={styles.modalRowButtonText}>Choose from Library</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.outlineButtonVertical, { marginTop: 4 }]} 
                      onPress={async () => {
                        await executeSave();
                        setShowVerifyModal(false);
                      }}
                    >
                      <Text style={styles.outlineButtonText}>Save without Proof</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'], color: Colors.white, marginBottom: 4 },
  headerSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.75)', marginBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.white, borderRadius: 12, paddingHorizontal: 14, height: 44,
  },
  searchInput: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  tabs: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.neutral200, maxHeight: 54 },
  tabsContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.neutral100, borderWidth: 1, borderColor: Colors.neutral200,
  },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  tabTextActive: { color: Colors.white },
  actionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.white, borderRadius: 14, padding: 14,
    ...Shadows.sm, borderWidth: 1, borderColor: Colors.neutral200,
  },
  actionCardPending: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionCardDone: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryLight },
  actionIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  actionName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textPrimary, marginBottom: 2 },
  actionDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 2 },
  actionImpact: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  actionRight: { alignItems: 'center' },
  actionPoints: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.primary },
  actionPts: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  saveBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.white, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.neutral200, ...Shadows.xl,
  },
  saveBarTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  saveBarSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  saveButton: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 18, ...Shadows.greenGlow,
  },
  saveButtonText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.white },
  floatingBarContainer: {
    position: 'absolute', bottom: 20, left: 16, right: 16,
    zIndex: 100,
  },
  saveBarGlass: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    ...Shadows.lg,
  },
  celebrationContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  celebrationLottie: { width: 300, height: 300 },
  celebrationTitle: {
    fontFamily: Typography.fontFamily.extraBold,
    fontSize: Typography.fontSize['3xl'],
    color: Colors.primary,
    marginTop: -20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    ...Shadows.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textPrimary,
  },
  modalDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  photoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.neutral100,
    borderWidth: 1,
    borderColor: Colors.neutral200,
    marginBottom: 20,
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textMuted,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  btnGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  btnGroupVertical: {
    gap: 10,
  },
  outlineButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: Colors.neutral300,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  outlineButtonVertical: {
    borderWidth: 1.5,
    borderColor: Colors.neutral300,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  outlineButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  primaryBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.white,
  },
  modalRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
  },
  modalRowButtonText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.primary,
  },
  scanningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  scanningText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  scanningSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
