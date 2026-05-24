import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import { storage, UserData, Plant } from '../utils/storage';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';
import PlantIllustration from '../components/PlantIllustration';
import LottieView from 'lottie-react-native';

const { width } = Dimensions.get('window');

// Emojis for each stage
const STAGE_EMOJIS = {
  seed: '🌰',
  sprout: '🌱',
  sapling: '🌿',
  tree: '🌳',
  withered: '🪵',
};

export default function NurseryScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation state
  const [isWatering, setIsWatering] = useState(false);
  const [activeWateringPlant, setActiveWateringPlant] = useState<Plant | null>(null);

  const loadData = useCallback(async () => {
    const data = await storage.getUserData();
    setUserData(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleBuySeed = async () => {
    if ((userData?.coins ?? 0) < 50) {
      Toast.show({ type: 'error', text1: 'Not enough coins!', text2: 'Log more actions to earn coins.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    const success = await storage.buySeed();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Seed purchased! 🌰', text2: 'Plant it to start growing.' });
      loadData();
    }
  };

  const handlePlantSeed = async () => {
    if ((userData?.inventorySeeds ?? 0) < 1) {
      Toast.show({ type: 'info', text1: 'No seeds in inventory.', text2: 'Buy one from the store first!' });
      return;
    }
    if ((userData?.activeForest.length ?? 0) >= 16) {
      Toast.show({ type: 'info', text1: 'Forest is full!', text2: 'Maximum 16 plants allowed.' });
      return;
    }
    const success = await storage.plantSeed();
    if (success) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      loadData();
    }
  };

  const handleWaterPlant = async (plant: Plant) => {
    if (plant.stage === 'withered') {
      Toast.show({ type: 'error', text1: 'This plant has withered.', text2: 'It cannot be watered anymore.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if ((userData?.waterDroplets ?? 0) < 1) {
      Toast.show({ type: 'error', text1: 'Out of water! 💧', text2: 'Log a sustainable action today to earn water droplets.' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    // Trigger animation instead of instantly watering
    setActiveWateringPlant(plant);
    setIsWatering(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const executeWatering = async () => {
    if (!activeWateringPlant) return;
    
    const success = await storage.waterPlant(activeWateringPlant.id);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Toast.show({ type: 'success', text1: 'Watered! 💧', text2: 'Your plant is growing strong.' });
      loadData();
    }
    
    setIsWatering(false);
    setActiveWateringPlant(null);
  };

  if (!userData) return null;

  // Determine background color based on forest health (wither mechanic)
  const isDrought = userData.activeForest.some(p => p.stage === 'withered' || p.waterLevel <= 50);
  const bgColors = isDrought 
    ? ['#b45309', '#78350f'] // Arid/Dry colors for loss aversion
    : ['#10b981', '#064e3b']; // Lush green

  return (
    <View style={styles.container}>
      <LinearGradient colors={bgColors as any} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.title}>Virtual Nursery</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
        
        {/* Currency & Inventory Bar */}
        <View style={styles.statsPanel}>
          <View style={styles.statRow}>
            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>🪙</Text>
              <Text style={styles.statValue}>{userData.coins}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>💧</Text>
              <Text style={styles.statValue}>{userData.waterDroplets}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statEmoji}>🌰</Text>
              <Text style={styles.statValue}>{userData.inventorySeeds}</Text>
            </View>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={handleBuySeed}>
              <Text style={styles.actionBtnText}>Buy Seed (50 🪙)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionBtn, { backgroundColor: userData.inventorySeeds > 0 ? Colors.primary : Colors.neutral400 }]} 
              onPress={handlePlantSeed}
              disabled={userData.inventorySeeds === 0}
            >
              <Text style={styles.actionBtnText}>Plant Seed 🌰</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Forest Grid */}
        <View style={styles.forestCard}>
          <Text style={styles.forestTitle}>My Plants</Text>
          <Text style={styles.forestSubtitle}>Tap to water thirsty plants!</Text>
          
          {userData.activeForest.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>🏜️</Text>
              <Text style={styles.emptyText}>Your nursery is empty.</Text>
              <Text style={styles.emptySub}>Buy a seed and plant it to start your ecosystem!</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {userData.activeForest.map((plant) => {
                const isThirsty = plant.waterLevel <= 50 && plant.stage !== 'withered';
                return (
                  <TouchableOpacity 
                    key={plant.id} 
                    style={[styles.gridCell, isThirsty && styles.gridCellThirsty, plant.stage === 'withered' && styles.gridCellWithered]}
                    onPress={() => handleWaterPlant(plant)}
                    activeOpacity={0.8}
                  >
                    <PlantIllustration stage={plant.stage} size={64} />
                    
                    {/* Water Level Bar */}
                    <View style={styles.waterBarBg}>
                      <View style={[
                        styles.waterBarFill, 
                        { width: `${plant.waterLevel}%`, backgroundColor: plant.stage === 'withered' ? Colors.neutral400 : '#0ea5e9' }
                      ]} />
                    </View>

                    {/* Needs Water Alert */}
                    {isThirsty && (
                      <View style={styles.thirstyAlert}>
                        <Ionicons name="water" size={12} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        
        {isDrought && (
          <View style={styles.droughtWarning}>
            <Ionicons name="warning" size={24} color="#fef08a" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.droughtWarningTitle}>Drought Warning!</Text>
              <Text style={styles.droughtWarningText}>Some of your plants haven't been watered in over 24 hours. They will wither if they reach 48 hours without water!</Text>
            </View>
          </View>
        )}

      </ScrollView>

      {/* Fullscreen Animation Overlay */}
      {isWatering && (
        <View style={styles.animationOverlay}>
          <LottieView
            source={require('../assets/animations/watering can.json')}
            autoPlay
            loop={false}
            speed={1.5}
            onAnimationFinish={executeWatering}
            style={styles.lottieAnim}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#064e3b' },
  header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.white },
  
  statsPanel: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 16,
    ...Shadows.lg,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral100,
  },
  statChip: {
    alignItems: 'center',
  },
  statEmoji: { fontSize: 28, marginBottom: 4 },
  statValue: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.textPrimary },
  
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  actionBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
  },

  forestCard: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  forestTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.white,
    textAlign: 'center',
  },
  forestSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  gridCell: {
    width: (width - 32 - 40 - 24) / 3, // 3 cols, padding math
    aspectRatio: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  gridCellThirsty: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  gridCellWithered: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  plantEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  waterBarBg: {
    width: '70%',
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  waterBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  thirstyAlert: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0ea5e9',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
    borderWidth: 2,
    borderColor: Colors.white,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.white, marginBottom: 8 },
  emptySub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 20 },

  droughtWarning: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: 'rgba(180, 83, 9, 0.8)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  droughtWarningTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.white, marginBottom: 4 },
  droughtWarningText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  
  animationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  lottieAnim: {
    width: width * 0.8,
    height: width * 0.8,
  },
});
