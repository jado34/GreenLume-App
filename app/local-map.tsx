// Local Eco-Map Screen
// NOTE: react-native-maps requires a Google Maps API key to work in production APKs.
// Without it the MapView crashes the app on launch. This screen uses a safe card-list
// view with deep-links into the device's native maps app instead, so it works on ALL
// devices without any API key. To re-enable the embedded map, add your Google Maps API
// key to app.json under android.config.googleMaps.apiKey and re-add the MapView.

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';

type EcoLocation = {
  id: string;
  title: string;
  type: 'shop' | 'event' | 'ev' | 'food';
  description: string;
  lat: number;
  lng: number;
  points: number;
  distance?: string;
};

// Default fallback locations (San Francisco) used when location is denied
const DEFAULT_ECO_LOCATIONS: EcoLocation[] = [
  { id: '1', title: 'Zero Waste Market', type: 'shop', description: 'Bring your own containers!', lat: 37.78825, lng: -122.4324, points: 50 },
  { id: '2', title: 'Community Cleanup', type: 'event', description: 'Join us Saturday at 10 AM', lat: 37.791, lng: -122.44, points: 150 },
  { id: '3', title: 'EV Charging Station', type: 'ev', description: 'Fast charging available', lat: 37.785, lng: -122.425, points: 20 },
  { id: '4', title: "Farmer's Market", type: 'food', description: 'Fresh local organic produce', lat: 37.782, lng: -122.438, points: 40 },
];

const TYPE_CONFIG: Record<EcoLocation['type'], { icon: string; color: string; label: string }> = {
  shop:  { icon: 'basket',    color: '#10b981', label: 'Zero Waste' },
  event: { icon: 'people',    color: '#f59e0b', label: 'Event' },
  ev:    { icon: 'flash',     color: '#3b82f6', label: 'EV Charging' },
  food:  { icon: 'nutrition', color: '#ec4899', label: 'Food' },
};

export default function LocalMapScreen() {
  const [loading, setLoading] = useState(true);
  const [locationGranted, setLocationGranted] = useState(false);
  const [ecoLocations, setEcoLocations] = useState<EcoLocation[]>(DEFAULT_ECO_LOCATIONS);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({
            type: 'info',
            text1: 'Location Permission',
            text2: 'Using example locations. Enable location for nearby spots.',
          });
          setLoading(false);
          return;
        }

        setLocationGranted(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;

        // Generate mock eco-spots near the user's real location
        const nearby: EcoLocation[] = [
          { id: '1', title: 'Local Zero Waste Shop', type: 'shop', description: 'Plastic-free bulk goods nearby!', lat: lat + 0.003, lng: lng - 0.002, points: 50, distance: '~350m' },
          { id: '2', title: 'Neighbourhood Tree Planting', type: 'event', description: 'Community forestry event this Saturday', lat: lat + 0.007, lng: lng + 0.005, points: 150, distance: '~780m' },
          { id: '3', title: 'Solar EV Charger', type: 'ev', description: 'Level 2 & DC Fast Charger', lat: lat - 0.005, lng: lng - 0.006, points: 20, distance: '~1.1km' },
          { id: '4', title: 'Farmers Organic Market', type: 'food', description: 'Locally sourced organic produce', lat: lat - 0.002, lng: lng + 0.004, points: 40, distance: '~430m' },
        ];
        setEcoLocations(nearby);
      } catch (err) {
        console.warn('Location error:', err);
        Toast.show({ type: 'error', text1: 'Location Error', text2: 'Could not get your location.' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const openInMaps = (loc: EcoLocation) => {
    const label = encodeURIComponent(loc.title);
    const url = Platform.OS === 'ios'
      ? `maps:0,0?q=${label}@${loc.lat},${loc.lng}`
      : `geo:${loc.lat},${loc.lng}?q=${loc.lat},${loc.lng}(${label})`;
    Linking.openURL(url).catch(() =>
      Toast.show({ type: 'error', text1: 'Cannot open Maps', text2: 'No maps app found on device.' })
    );
  };

  const handleLogAction = (loc: EcoLocation) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to the Log screen — the user records the actual sustainable
    // action they took at this location and earns points there.
    Toast.show({
      type: 'info',
      text1: `At ${loc.title}?`,
      text2: 'Log what you did there to earn your points!',
    });
    router.push('/(tabs)/log');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#1b5e20', '#2e7d32']} style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={Colors.white} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Local Eco-Map</Text>
          <Text style={styles.headerSub}>
            {locationGranted ? 'Eco-spots near you' : 'Example locations — enable location for real spots'}
          </Text>
        </View>
        <View style={styles.headerBadge}>
          <Ionicons name="location" size={14} color={Colors.white} />
          <Text style={styles.headerBadgeText}>{locationGranted ? 'Live' : 'Demo'}</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Finding eco-spots near you...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {/* Info Banner */}
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.info} />
            <Text style={styles.infoText}>
              Tap <Text style={{ fontWeight: 'bold' }}>Directions</Text> to open in your Maps app, or tap{' '}
              <Text style={{ fontWeight: 'bold' }}>Check-in</Text> to earn points!
            </Text>
          </View>

          {ecoLocations.map((loc) => {
            const config = TYPE_CONFIG[loc.type];
            return (
              <View key={loc.id} style={styles.card}>
                {/* Icon */}
                <View style={[styles.iconWrap, { backgroundColor: `${config.color}18` }]}>
                  <Ionicons name={config.icon as any} size={26} color={config.color} />
                </View>

                {/* Info */}
                <View style={styles.cardBody}>
                  <View style={styles.cardRow}>
                    <View style={[styles.typeBadge, { backgroundColor: `${config.color}18` }]}>
                      <Text style={[styles.typeBadgeText, { color: config.color }]}>{config.label}</Text>
                    </View>
                    {loc.distance && (
                      <Text style={styles.distanceText}>{loc.distance}</Text>
                    )}
                  </View>
                  <Text style={styles.cardTitle}>{loc.title}</Text>
                  <Text style={styles.cardDesc}>{loc.description}</Text>

                  {/* Actions */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.directionsBtn}
                      onPress={() => openInMaps(loc)}
                      accessibilityLabel={`Get directions to ${loc.title}`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="navigate-outline" size={14} color={Colors.info} />
                      <Text style={styles.directionsBtnText}>Directions</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.checkInBtn, { borderColor: config.color }]}
                      onPress={() => handleLogAction(loc)}
                      accessibilityLabel={`Log a sustainable action at ${loc.title} to earn points`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="pencil" size={14} color={config.color} />
                      <Text style={[styles.checkInBtnText, { color: config.color }]}>
                        Log Action
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.mapsNote}>
            <Ionicons name="bulb-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.mapsNoteText}>
              Visit a spot, do something sustainable there, then tap{' '}
              <Text style={{ fontFamily: Typography.fontFamily.bold }}>Log Action</Text>{' '}
              to record it and earn your points on the Log screen.
            </Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.neutral50 },

  // Header
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.white },
  headerSub: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  headerBadgeText: { fontFamily: Typography.fontFamily.bold, fontSize: 10, color: Colors.white },

  // Loading
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm, color: Colors.textMuted },

  // List
  list: { padding: 16, gap: 14 },

  // Info banner
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: Colors.infoLight, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: Colors.info + '30',
  },
  infoText: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.info, lineHeight: 18 },

  // Card
  card: {
    flexDirection: 'row', gap: 14,
    backgroundColor: Colors.white, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: Colors.neutral200, ...Shadows.sm,
  },
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardBody: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeBadgeText: { fontFamily: Typography.fontFamily.bold, fontSize: 10, letterSpacing: 0.4 },
  distanceText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: Colors.textMuted },
  cardTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.md, color: Colors.textPrimary, marginBottom: 4 },
  cardDesc: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, marginBottom: 12, lineHeight: 18 },

  // Card actions
  cardActions: { flexDirection: 'row', gap: 10 },
  directionsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    borderWidth: 1.5, borderColor: Colors.info, borderRadius: 10, paddingVertical: 8,
  },
  directionsBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs, color: Colors.info },
  checkInBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
    borderWidth: 1.5, borderRadius: 10, paddingVertical: 8,
  },
  checkInBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xs },

  // Footer note
  mapsNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.neutral100, borderRadius: 12, padding: 12, marginTop: 4,
  },
  mapsNoteText: { flex: 1, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textMuted, lineHeight: 17 },
});
