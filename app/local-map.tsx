import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Colors } from '../constants/colors';
import { Typography, Shadows } from '../constants/typography';
import { useLogActionMutation } from '../hooks/useUserData';

const { width, height } = Dimensions.get('window');

// Fallback mock data for eco-friendly locations if location is denied
const DEFAULT_ECO_LOCATIONS = [
  { id: '1', title: 'Zero Waste Market', type: 'shop', description: 'Bring your own containers!', lat: 37.78825, lng: -122.4324, points: 50 },
  { id: '2', title: 'Community Cleanup', type: 'event', description: 'Join us Saturday at 10 AM', lat: 37.791, lng: -122.44, points: 150 },
  { id: '3', title: 'EV Charging Station', type: 'ev', description: 'Fast charging available', lat: 37.785, lng: -122.425, points: 20 },
  { id: '4', title: 'Farmer\'s Market', type: 'food', description: 'Fresh local organic produce', lat: 37.782, lng: -122.438, points: 40 },
];

export default function LocalMapScreen() {
  const logActionMutation = useLogActionMutation();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [ecoLocations, setEcoLocations] = useState<typeof DEFAULT_ECO_LOCATIONS>(DEFAULT_ECO_LOCATIONS);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Toast.show({
            type: 'info',
            text1: 'Location Permission',
            text2: 'Permission denied. Using San Francisco as default.',
          });
          setLoading(false);
          return;
        }

        let loc = await Location.getCurrentPositionAsync({});
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        
        setMapRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        });

        // Generate mock eco spots in the proximity of user's real location
        const userEcoLocations = [
          { id: '1', title: 'Local Zero Waste Shop', type: 'shop', description: 'Plastic-free bulk goods!', lat: lat + 0.003, lng: lng - 0.002, points: 50 },
          { id: '2', title: 'Neighborhood Tree Planting', type: 'event', description: 'Community forestry event this Saturday', lat: lat + 0.007, lng: lng + 0.005, points: 150 },
          { id: '3', title: 'Solar Powered EV Charger', type: 'ev', description: 'Level 2 & DC Fast Charger', lat: lat - 0.005, lng: lng - 0.006, points: 20 },
          { id: '4', title: 'Farmers Organic Market', type: 'food', description: 'Locally sourced organic produce', lat: lat - 0.002, lng: lng + 0.004, points: 40 },
        ];
        setEcoLocations(userEcoLocations);
      } catch (err) {
        console.warn('Error fetching location:', err);
        Toast.show({
          type: 'error',
          text1: 'Location Error',
          text2: 'Failed to retrieve your current location.',
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getPinColor = (type: string) => {
    switch (type) {
      case 'shop': return '#10b981';
      case 'event': return '#f59e0b';
      case 'ev': return '#3b82f6';
      case 'food': return '#ec4899';
      default: return Colors.primary;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'shop': return 'basket';
      case 'event': return 'people';
      case 'ev': return 'flash';
      case 'food': return 'nutrition';
      default: return 'leaf';
    }
  };

  const handleCheckIn = (loc: typeof DEFAULT_ECO_LOCATIONS[0]) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    logActionMutation.mutate({ points: loc.points, actionIds: [`checkin_${loc.id}`] });
    Toast.show({
      type: 'success',
      text1: `Checked in to ${loc.title}!`,
      text2: `You earned ${loc.points} GreenLume points.`,
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={mapRegion}
        onRegionChangeComplete={(region) => setMapRegion(region)}
        showsUserLocation={true}
      >
        {ecoLocations.map(loc => (
          <Marker
            key={loc.id}
            coordinate={{ latitude: loc.lat, longitude: loc.lng }}
            onPress={() => setSelectedLocation(loc.id)}
          >
            <View style={[styles.pin, { backgroundColor: getPinColor(loc.type) }]}>
              <Ionicons name={getIcon(loc.type) as any} size={16} color={Colors.white} />
            </View>
            <Callout tooltip onPress={() => handleCheckIn(loc)}>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{loc.title}</Text>
                <Text style={styles.calloutDesc}>{loc.description}</Text>
                <TouchableOpacity style={styles.checkInBtn}>
                  <Text style={styles.checkInBtnText}>Check-in (+{loc.points} pts)</Text>
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {/* Header Overlay */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Local Eco-Map</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Legend Overlay */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>Zero Waste</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>Events</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>EV Charging</Text>
        </View>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Locating eco-friendly spots near you...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 12,
    ...Shadows.md,
    zIndex: 5,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textPrimary,
  },
  pin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
    ...Shadows.sm,
  },
  calloutContainer: {
    width: 200,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 12,
    ...Shadows.lg,
  },
  calloutTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.md,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  calloutDesc: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  checkInBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  checkInBtnText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xs,
    color: Colors.white,
  },
  legendContainer: {
    position: 'absolute',
    bottom: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    ...Shadows.md,
    zIndex: 5,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
  },
});
