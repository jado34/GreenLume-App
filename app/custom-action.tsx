// Custom Action Creator — Build your own eco-action and track it
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

type Category = 'transport' | 'food' | 'waste' | 'energy' | 'water' | 'other';

const CATEGORIES: { id: Category; name: string; icon: string; color: string }[] = [
  { id: 'transport', name: 'Transport', icon: 'bus', color: '#3b82f6' },
  { id: 'food', name: 'Food', icon: 'leaf', color: '#10b981' },
  { id: 'waste', name: 'Waste', icon: 'refresh-circle', color: '#8b5cf6' },
  { id: 'energy', name: 'Energy', icon: 'bulb', color: '#f59e0b' },
  { id: 'water', name: 'Water', icon: 'water', color: '#06b6d4' },
  { id: 'other', name: 'Other', icon: 'sparkles', color: '#ec4899' },
];

const POINT_OPTIONS = [5, 10, 15, 20, 25, 30, 40, 50];

const CUSTOM_ACTIONS_KEY = 'gs_custom_actions';

export interface CustomAction {
  id: string;
  name: string;
  description: string;
  category: Category;
  points: number;
  icon: string;
  color: string;
  createdAt: string;
}

export async function loadCustomActions(): Promise<CustomAction[]> {
  try {
    const raw = await AsyncStorage.getItem(CUSTOM_ACTIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveCustomAction(action: CustomAction): Promise<void> {
  const existing = await loadCustomActions();
  existing.push(action);
  await AsyncStorage.setItem(CUSTOM_ACTIONS_KEY, JSON.stringify(existing));
}

export default function CustomActionScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [points, setPoints] = useState(10);
  const [saving, setSaving] = useState(false);
  const [savedActions, setSavedActions] = useState<CustomAction[]>([]);
  const [showSaved, setShowSaved] = useState(false);

  const selectedCat = CATEGORIES.find(c => c.id === category)!;

  const handleSave = async () => {
    if (!name.trim()) {
      Toast.show({ type: 'error', text1: 'Name required', text2: 'Give your action a name.' });
      return;
    }
    setSaving(true);
    const action: CustomAction = {
      id: `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `My custom ${category} action`,
      category,
      points,
      icon: selectedCat.icon,
      color: selectedCat.color,
      createdAt: new Date().toISOString(),
    };
    await saveCustomAction(action);
    setSaving(false);
    Toast.show({ type: 'success', text1: `"${action.name}" created! ✓`, text2: `Worth +${points} pts. Find it in the Log screen.` });
    setName('');
    setDescription('');
    setPoints(10);
  };

  const loadSaved = async () => {
    const actions = await loadCustomActions();
    setSavedActions(actions);
    setShowSaved(true);
  };

  const deleteAction = async (id: string) => {
    Alert.alert('Delete Action', 'Remove this custom action?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const existing = await loadCustomActions();
          const filtered = existing.filter(a => a.id !== id);
          await AsyncStorage.setItem(CUSTOM_ACTIONS_KEY, JSON.stringify(filtered));
          setSavedActions(filtered);
          Toast.show({ type: 'info', text1: 'Action deleted' });
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: Colors.neutral50 }}
    >
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.header}>
          <TouchableOpacity onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Custom Action</Text>
          <Text style={styles.headerSub}>Create your own eco-action and earn points</Text>
        </LinearGradient>

        {/* Preview card */}
        <View style={styles.previewSection}>
          <Text style={styles.previewLabel}>PREVIEW</Text>
          <View style={[styles.previewCard, { borderColor: selectedCat.color }]}>
            <View style={[styles.previewIcon, { backgroundColor: `${selectedCat.color}18` }]}>
              <Ionicons name={selectedCat.icon as any} size={28} color={selectedCat.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{name || 'Action Name'}</Text>
              <Text style={styles.previewDesc} numberOfLines={1}>{description || 'Description...'}</Text>
            </View>
            <View style={styles.previewPts}>
              <Text style={[styles.previewPtsNum, { color: selectedCat.color }]}>+{points}</Text>
              <Text style={styles.previewPtsLabel}>pts</Text>
            </View>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>Action Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Composted today"
            placeholderTextColor={Colors.textMuted}
            maxLength={40}
          />
          <Text style={styles.charCount}>{name.length}/40</Text>

          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="Briefly describe what you did..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={100}
            textAlignVertical="top"
          />
          {/* FIX #21: Add character counter for description field to match name field UX */}
          <Text style={styles.charCount}>{description.length}/100</Text>

          <Text style={styles.formLabel}>Category</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryBtn, category === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Ionicons name={cat.icon as any} size={18} color={category === cat.id ? Colors.white : cat.color} />
                <Text style={[styles.categoryLabel, category === cat.id && { color: Colors.white }]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.formLabel}>Points Value</Text>
          <Text style={styles.formHint}>Choose how many points this action is worth</Text>
          <View style={styles.pointsGrid}>
            {POINT_OPTIONS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.pointsBtn, points === p && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
                onPress={() => setPoints(p)}
                activeOpacity={0.8}
              >
                <Text style={[styles.pointsLabel, points === p && { color: Colors.white }]}>+{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            <LinearGradient colors={['#2e7d32', '#388e3c']} style={styles.saveBtnGradient}>
              <Ionicons name="checkmark-circle" size={22} color={Colors.white} />
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Create Action'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* FIX #36: Toggle show/hide saved actions list */}
          <TouchableOpacity style={styles.viewSavedBtn} onPress={() => {
            if (!showSaved) {
              loadSaved();
            } else {
              setShowSaved(false);
            }
          }} activeOpacity={0.8}>
            <Ionicons name={showSaved ? 'chevron-up' : 'list'} size={18} color={Colors.primary} />
            <Text style={styles.viewSavedText}>{showSaved ? 'Hide Custom Actions' : 'View My Custom Actions'}</Text>
          </TouchableOpacity>
        </View>

        {/* Saved actions list */}
        {showSaved && (
          <View style={styles.savedSection}>
            <Text style={styles.savedTitle}>My Custom Actions</Text>
            {savedActions.length === 0 ? (
              <Text style={styles.savedEmpty}>No custom actions yet. Create one above!</Text>
            ) : (
              savedActions.map((action) => (
                <View key={action.id} style={styles.savedCard}>
                  <View style={[styles.savedIcon, { backgroundColor: `${action.color}18` }]}>
                    <Ionicons name={action.icon as any} size={22} color={action.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.savedName}>{action.name}</Text>
                    <Text style={styles.savedDesc}>{action.description}</Text>
                  </View>
                  <Text style={[styles.savedPts, { color: action.color }]}>+{action.points}</Text>
                  <TouchableOpacity onPress={() => deleteAction(action.id)} style={styles.deleteBtn}>
                    <Ionicons name="trash-outline" size={18} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['3xl'], color: Colors.white, marginBottom: 4 },
  headerSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.75)' },
  previewSection: { padding: 20, paddingBottom: 0 },
  previewLabel: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, color: Colors.textMuted, letterSpacing: 1, marginBottom: 10 },
  previewCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, borderRadius: 16, padding: 16, borderWidth: 1.5, ...Shadows.sm },
  previewIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  previewName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  previewDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted, marginTop: 2 },
  previewPts: { alignItems: 'center' },
  previewPtsNum: { fontFamily: Typography.fontFamily.extraBold, fontSize: Typography.fontSize['2xl'] },
  previewPtsLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  formSection: { padding: 20 },
  formLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 8, marginTop: 4 },
  formHint: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, marginBottom: 10, marginTop: -4 },
  charCount: { fontFamily: Typography.fontFamily.regular, fontSize: 10, color: Colors.textMuted, textAlign: 'right', marginBottom: 14, marginTop: -10 },
  input: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.neutral200, marginBottom: 4, ...Shadows.sm },
  inputMulti: { height: 90, textAlignVertical: 'top', marginBottom: 14 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.neutral200, ...Shadows.sm },
  categoryLabel: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textSecondary },
  pointsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  pointsBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.neutral200, ...Shadows.sm },
  pointsLabel: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.textSecondary },
  saveBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 14, ...Shadows.greenGlow },
  saveBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  saveBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.white },
  viewSavedBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  viewSavedText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.primary },
  savedSection: { paddingHorizontal: 20, paddingBottom: 20 },
  savedTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textPrimary, marginBottom: 14 },
  savedEmpty: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.md, color: Colors.textMuted, textAlign: 'center', paddingVertical: 20 },
  savedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.neutral200, ...Shadows.sm, marginBottom: 10 },
  savedIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  savedName: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, color: Colors.textPrimary },
  savedDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textMuted },
  savedPts: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl },
  deleteBtn: { padding: 4 },
});
