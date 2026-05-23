// GreenLume Action Definitions — All logging actions with categories, points, and impact data

export type ActionCategory = 'transport' | 'food' | 'waste' | 'energy' | 'water' | 'shopping';

export interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  points: number;
  icon: string; // Ionicons name
  co2Saved: number;  // grams CO2 saved
  waterSaved: number; // liters water saved
  impact: string; // human-readable impact text
}

export const ACTIONS: ActionDefinition[] = [
  // Transport
  { id: 'public_transit', name: 'Public Transport', description: 'Took bus, train or metro instead of driving', category: 'transport', points: 25, icon: 'bus', co2Saved: 2100, waterSaved: 0, impact: 'Saves ~2.1kg CO₂' },
  { id: 'walk', name: 'Walked Instead', description: 'Walked instead of taking a car or taxi', category: 'transport', points: 20, icon: 'walk', co2Saved: 1800, waterSaved: 0, impact: 'Zero emissions trip' },
  { id: 'cycle', name: 'Cycled', description: 'Cycled to your destination', category: 'transport', points: 22, icon: 'bicycle', co2Saved: 2000, waterSaved: 0, impact: 'Saves ~2kg CO₂' },
  { id: 'carpool', name: 'Carpooled', description: 'Shared a ride with others', category: 'transport', points: 15, icon: 'car', co2Saved: 900, waterSaved: 0, impact: 'Halves your car emissions' },

  // Food
  { id: 'plant_meal', name: 'Plant-Based Meal', description: 'Had a meal with no meat or dairy', category: 'food', points: 20, icon: 'leaf', co2Saved: 1600, waterSaved: 150, impact: 'Saves ~1.6kg CO₂ + 150L water' },
  { id: 'local_produce', name: 'Local Produce', description: 'Bought locally grown or seasonal food', category: 'food', points: 10, icon: 'basket', co2Saved: 400, waterSaved: 0, impact: 'Reduces food miles' },
  { id: 'no_food_waste', name: 'Zero Food Waste', description: 'Used leftovers or avoided throwing food away', category: 'food', points: 14, icon: 'restaurant', co2Saved: 800, waterSaved: 0, impact: 'Saves ~800g CO₂' },
  { id: 'meatless_monday', name: 'Meatless Day', description: 'Avoided all meat for the day', category: 'food', points: 18, icon: 'nutrition', co2Saved: 3000, waterSaved: 500, impact: 'Saves ~3kg CO₂ + 500L water' },

  // Waste
  { id: 'recycled', name: 'Recycled Properly', description: 'Sorted and recycled waste correctly', category: 'waste', points: 10, icon: 'refresh-circle', co2Saved: 300, waterSaved: 10, impact: 'Saves resources & landfill space' },
  { id: 'reusable_bag', name: 'Reusable Bag', description: 'Used a reusable bag instead of plastic', category: 'waste', points: 15, icon: 'bag-handle', co2Saved: 100, waterSaved: 0, impact: 'Avoids single-use plastic' },
  { id: 'no_plastic', name: 'Avoided Plastic', description: 'Refused single-use plastic items', category: 'waste', points: 15, icon: 'water', co2Saved: 200, waterSaved: 0, impact: 'Keeps plastic out of oceans' },
  { id: 'composted', name: 'Composted', description: 'Composted food scraps or organic waste', category: 'waste', points: 18, icon: 'leaf', co2Saved: 600, waterSaved: 0, impact: 'Reduces methane emissions' },

  // Energy
  { id: 'lights_off', name: 'Lights Off', description: 'Turned off unused lights when leaving a room', category: 'energy', points: 8, icon: 'bulb', co2Saved: 150, waterSaved: 0, impact: 'Saves ~150g CO₂' },
  { id: 'air_dry', name: 'Air Dried Clothes', description: 'Air-dried laundry instead of using a dryer', category: 'energy', points: 12, icon: 'sunny', co2Saved: 1800, waterSaved: 0, impact: 'Saves ~1.8kg CO₂ per load' },
  { id: 'unplug', name: 'Unplugged Devices', description: 'Unplugged electronics when not in use', category: 'energy', points: 6, icon: 'power', co2Saved: 100, waterSaved: 0, impact: 'Eliminates phantom power use' },
  { id: 'natural_light', name: 'Natural Lighting', description: 'Used natural light instead of artificial lighting', category: 'energy', points: 5, icon: 'partly-sunny', co2Saved: 80, waterSaved: 0, impact: 'Zero energy use' },
  { id: 'short_shower', name: 'Shorter Shower', description: 'Kept shower under 5 minutes', category: 'energy', points: 12, icon: 'water', co2Saved: 400, waterSaved: 30, impact: 'Saves 30L water' },

  // Water
  { id: 'fix_tap', name: 'Fixed Leaky Tap', description: 'Repaired or reported a dripping tap', category: 'water', points: 15, icon: 'construct', co2Saved: 0, waterSaved: 100, impact: 'Saves ~100L/day if fixed' },
  { id: 'reuse_water', name: 'Reused Water', description: 'Reused greywater or cooking water for plants', category: 'water', points: 8, icon: 'water', co2Saved: 0, waterSaved: 5, impact: 'Every drop counts' },
  { id: 'full_machine', name: 'Full Machine Load', description: 'Only ran dishwasher/washing machine when full', category: 'water', points: 10, icon: 'refresh', co2Saved: 500, waterSaved: 25, impact: 'Saves 25L per load' },
];

export const ACTION_CATEGORIES: { id: ActionCategory; name: string; icon: string; color: string }[] = [
  { id: 'transport', name: 'Transport', icon: 'bus', color: '#3b82f6' },
  { id: 'food', name: 'Food', icon: 'leaf', color: '#10b981' },
  { id: 'waste', name: 'Waste', icon: 'refresh-circle', color: '#8b5cf6' },
  { id: 'energy', name: 'Energy', icon: 'bulb', color: '#f59e0b' },
  { id: 'water', name: 'Water', icon: 'water', color: '#06b6d4' },
  { id: 'shopping', name: 'Shopping', icon: 'bag-handle', color: '#ec4899' },
];
