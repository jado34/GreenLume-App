import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Rect, G, Defs, LinearGradient, Stop } from 'react-native-svg';

interface PlantIllustrationProps {
  stage: 'seed' | 'sprout' | 'sapling' | 'tree' | 'withered';
  size?: number;
}

export default function PlantIllustration({ stage, size = 80 }: PlantIllustrationProps) {
  const swayAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (stage === 'withered') {
      swayAnim.setValue(0);
      return;
    }

    // Gentle wind sway animation
    const animateSway = () => {
      Animated.sequence([
        Animated.timing(swayAnim, {
          toValue: 1,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(swayAnim, {
          toValue: -1,
          duration: 2500,
          useNativeDriver: true,
        }),
      ]).start(() => animateSway());
    };

    animateSway();
  }, [stage]);

  const rotation = swayAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-3deg', '3deg'],
  });

  const renderSVG = () => {
    switch (stage) {
      case 'seed':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#4e342e" />
                <Stop offset="100%" stopColor="#2c1d11" />
              </LinearGradient>
              <LinearGradient id="seedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#a73a15" />
                <Stop offset="100%" stopColor="#5d1f0c" />
              </LinearGradient>
              <LinearGradient id="capGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#8d6e63" />
                <Stop offset="100%" stopColor="#4e342e" />
              </LinearGradient>
            </Defs>
            {/* Soil Mound */}
            <Path d="M 10 90 Q 50 65 90 90 Z" fill="url(#soilGrad)" />
            {/* Seed Body */}
            <Path d="M 38 60 C 38 45 42 35 50 35 C 58 35 62 45 62 60 C 62 72 56 82 50 82 C 44 82 38 72 38 60 Z" fill="url(#seedGrad)" />
            {/* Seed Cap */}
            <Path d="M 36 50 Q 50 35 64 50 Q 50 56 36 50 Z" fill="url(#capGrad)" />
            <Path d="M 50 35 Q 52 25 58 24" stroke="#4e342e" strokeWidth="2" fill="none" />
          </Svg>
        );
      case 'sprout':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#4e342e" />
                <Stop offset="100%" stopColor="#2c1d11" />
              </LinearGradient>
              <LinearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#81c784" />
                <Stop offset="100%" stopColor="#4caf50" />
              </LinearGradient>
              <LinearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#a5d6a7" />
                <Stop offset="100%" stopColor="#2e7d32" />
              </LinearGradient>
            </Defs>
            {/* Soil Mound */}
            <Path d="M 10 90 Q 50 65 90 90 Z" fill="url(#soilGrad)" />
            {/* Stem */}
            <Path d="M 50 75 Q 48 55 46 40" stroke="url(#stemGrad)" strokeWidth="4" fill="none" strokeLinecap="round" />
            {/* Leaf Left */}
            <Path d="M 46 40 C 35 38 28 46 32 54 C 40 56 45 46 46 40 Z" fill="url(#leafGrad)" />
            {/* Leaf Right */}
            <Path d="M 46 40 C 58 35 65 42 60 52 C 54 55 48 46 46 40 Z" fill="url(#leafGrad)" />
            {/* Dew Drop */}
            <Circle cx="35" cy="46" r="2.5" fill="#e0f7fa" opacity="0.8" />
          </Svg>
        );
      case 'sapling':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#4e342e" />
                <Stop offset="100%" stopColor="#2c1d11" />
              </LinearGradient>
              <LinearGradient id="stemGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#8d6e63" />
                <Stop offset="100%" stopColor="#5d4037" />
              </LinearGradient>
              <LinearGradient id="leaf1" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#a5d6a7" />
                <Stop offset="100%" stopColor="#2e7d32" />
              </LinearGradient>
              <LinearGradient id="leaf2" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor="#81c784" />
                <Stop offset="100%" stopColor="#1b5e20" />
              </LinearGradient>
            </Defs>
            {/* Soil Mound */}
            <Path d="M 10 90 Q 50 68 90 90 Z" fill="url(#soilGrad)" />
            {/* Stems */}
            <Path d="M 50 80 Q 48 55 52 35" stroke="url(#stemGrad)" strokeWidth="5" fill="none" strokeLinecap="round" />
            <Path d="M 50 55 Q 38 48 30 46" stroke="url(#stemGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <Path d="M 51 45 Q 62 38 68 38" stroke="url(#stemGrad)" strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Top Leaves */}
            <Path d="M 52 35 C 46 25 54 18 52 14 C 58 18 58 28 52 35 Z" fill="url(#leaf1)" />
            <Path d="M 52 35 C 58 28 66 32 68 28 C 64 34 58 36 52 35 Z" fill="url(#leaf2)" />
            {/* Left Branch Leaves */}
            <Path d="M 30 46 C 22 42 20 48 16 46 C 20 52 26 50 30 46 Z" fill="url(#leaf1)" />
            <Path d="M 30 46 C 24 38 30 32 32 30 C 34 35 34 42 30 46 Z" fill="url(#leaf2)" />
            {/* Right Branch Leaves */}
            <Path d="M 68 38 C 76 34 78 40 82 38 C 78 44 72 42 68 38 Z" fill="url(#leaf1)" />
          </Svg>
        );
      case 'tree':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#4e342e" />
                <Stop offset="100%" stopColor="#2c1d11" />
              </LinearGradient>
              <LinearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#5d4037" />
                <Stop offset="50%" stopColor="#4e342e" />
                <Stop offset="100%" stopColor="#3e2723" />
              </LinearGradient>
              <LinearGradient id="foliageDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#2e7d32" />
                <Stop offset="100%" stopColor="#1b5e20" />
              </LinearGradient>
              <LinearGradient id="foliageLight" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#4caf50" />
                <Stop offset="100%" stopColor="#2e7d32" />
              </LinearGradient>
              <LinearGradient id="foliageBright" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#81c784" />
                <Stop offset="100%" stopColor="#388e3c" />
              </LinearGradient>
            </Defs>
            {/* Soil Mound */}
            <Path d="M 5 92 Q 50 72 95 92 Z" fill="url(#soilGrad)" />
            {/* Roots */}
            <Path d="M 40 85 Q 32 88 28 92" stroke="#3e2723" strokeWidth="6" fill="none" strokeLinecap="round" />
            <Path d="M 60 85 Q 68 88 72 92" stroke="#3e2723" strokeWidth="6" fill="none" strokeLinecap="round" />
            {/* Trunk */}
            <Path d="M 44 86 L 46 55 L 34 42 L 36 38 L 47 48 L 53 48 L 64 38 L 66 42 L 54 55 L 56 86 Z" fill="url(#trunkGrad)" />
            {/* Foliage Layers */}
            {/* Back Foliage (Dark) */}
            <Circle cx="35" cy="40" r="16" fill="url(#foliageDark)" />
            <Circle cx="65" cy="40" r="16" fill="url(#foliageDark)" />
            <Circle cx="50" cy="30" r="18" fill="url(#foliageDark)" />
            {/* Mid Foliage (Light) */}
            <Circle cx="40" cy="36" r="14" fill="url(#foliageLight)" />
            <Circle cx="60" cy="36" r="14" fill="url(#foliageLight)" />
            <Circle cx="50" cy="26" r="15" fill="url(#foliageLight)" />
            {/* Front Highlights (Bright Green) */}
            <Circle cx="44" cy="32" r="10" fill="url(#foliageBright)" />
            <Circle cx="56" cy="32" r="10" fill="url(#foliageBright)" />
            <Circle cx="50" cy="22" r="10" fill="url(#foliageBright)" />
          </Svg>
        );
      case 'withered':
        return (
          <Svg width="100%" height="100%" viewBox="0 0 100 100">
            <Defs>
              <LinearGradient id="drySoil" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor="#795548" />
                <Stop offset="100%" stopColor="#5d4037" />
              </LinearGradient>
              <LinearGradient id="dryTrunk" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#8d6e63" />
                <Stop offset="100%" stopColor="#70574e" />
              </LinearGradient>
            </Defs>
            {/* Dry/Cracked Ground */}
            <Path d="M 10 90 Q 50 72 90 90 Z" fill="url(#drySoil)" />
            <Path d="M 45 84 L 38 88" stroke="#4e342e" strokeWidth="2.5" />
            <Path d="M 55 84 L 62 87" stroke="#4e342e" strokeWidth="2.5" />
            <Path d="M 50 82 L 49 88" stroke="#4e342e" strokeWidth="2.5" />
            {/* Dead stump */}
            <Path d="M 46 85 L 47 60 L 38 52 L 40 50 L 48 57 L 52 57 L 62 48 L 64 50 L 53 60 L 54 85 Z" fill="url(#dryTrunk)" />
            {/* Withered Leaves (Falling) */}
            <Path d="M 28 66 C 24 64 22 68 20 68 C 22 72 26 70 28 66 Z" fill="#b0bec5" /> {/* Dead grey leaf */}
            <Path d="M 72 74 C 70 70 66 72 64 74 C 66 78 70 78 72 74 Z" fill="#8d6e63" /> {/* Dry brown leaf */}
          </Svg>
        );
    }
  };

  const animatedStyle = {
    width: size,
    height: size,
    transform: [{ rotate: rotation }],
  };

  return (
    <Animated.View style={[styles.illustrationContainer, animatedStyle]}>
      {renderSVG()}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
