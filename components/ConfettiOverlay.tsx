import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect, Circle, Polygon } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#22C55E', // Green
  '#EC4899', // Pink
  '#EAB308', // Yellow
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#A855F7', // Purple
  '#EF4444', // Red
  '#3B82F6', // Blue
];

type ShapeType = 'rect' | 'circle' | 'star' | 'squiggle';

interface ParticleSpec {
  id: number;
  color: string;
  shape: ShapeType;
  size: number;
  startX: number;
  swayX: number;
  delay: number;
  duration: number;
  maxRotate: number;
}

interface ConfettiOverlayProps {
  visible: boolean;
  onAnimationEnd?: () => void;
}

const PARTICLE_COUNT = 55;

export default function ConfettiOverlay({ visible, onAnimationEnd }: ConfettiOverlayProps) {
  const animatedValues = useRef<Animated.Value[]>(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))
  ).current;

  const particles = useRef<ParticleSpec[]>([]);

  if (particles.current.length === 0) {
    const shapes: ShapeType[] = ['rect', 'circle', 'star', 'squiggle'];
    particles.current = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const shape = shapes[i % shapes.length];
      const size = Math.floor(Math.random() * 8) + 10; // 10px to 18px
      const startX = Math.random() * (SCREEN_WIDTH - 20);
      const swayX = (Math.random() - 0.5) * 120; // lateral sway
      const delay = Math.random() * 500; // staggered start
      const duration = 2000 + Math.random() * 900; // 2.0s to 2.9s
      const maxRotate = (Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720);

      return {
        id: i,
        color,
        shape,
        size,
        startX,
        swayX,
        delay,
        duration,
        maxRotate,
      };
    });
  }

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      // Reset values
      animatedValues.forEach((val) => val.setValue(0));

      // Start all particle animations
      const animations = particles.current.map((p, i) => {
        return Animated.sequence([
          Animated.delay(p.delay),
          Animated.timing(animatedValues[i], {
            toValue: 1,
            duration: p.duration,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel(animations).start(() => {
        if (onAnimationEnd) onAnimationEnd();
      });
    }
  }, [visible]);

  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      backdropOpacity.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlayContainer} pointerEvents="none">
      {/* Frosted translucent blur backdrop (Screenshot 3) */}
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: backdropOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.88],
            }),
          },
        ]}
      />

      {particles.current.map((p, i) => {
        const anim = animatedValues[i];

        const translateY = anim.interpolate({
          inputRange: [0, 1],
          outputRange: [-40, SCREEN_HEIGHT + 40],
        });

        const translateX = anim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [p.startX, p.startX + p.swayX, p.startX + p.swayX * 0.5],
        });

        const rotate = anim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.maxRotate}deg`],
        });

        const opacity = anim.interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });

        const scale = anim.interpolate({
          inputRange: [0, 0.2, 1],
          outputRange: [0.6, 1.1, 0.8],
        });

        return (
          <Animated.View
            key={p.id}
            style={[
              styles.particle,
              {
                opacity,
                transform: [{ translateX }, { translateY }, { rotate }, { scale }],
              },
            ]}
          >
            {renderShape(p.shape, p.color, p.size)}
          </Animated.View>
        );
      })}
    </View>
  );
}

function renderShape(shape: ShapeType, color: string, size: number) {
  switch (shape) {
    case 'circle':
      return (
        <Svg width={size} height={size} viewBox="0 0 20 20">
          <Circle cx="10" cy="10" r="9" fill={color} />
        </Svg>
      );

    case 'star':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Polygon
            points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
            fill={color}
          />
        </Svg>
      );

    case 'squiggle':
      return (
        <Svg width={size * 1.4} height={size} viewBox="0 0 30 15">
          <Path
            d="M 2 8 C 7 1, 12 15, 17 8 C 22 1, 27 15, 28 8"
            stroke={color}
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      );

    case 'rect':
    default:
      return (
        <Svg width={size * 0.7} height={size * 1.5} viewBox="0 0 10 20">
          <Rect x="0" y="0" width="10" height="20" rx="2" fill={color} />
        </Svg>
      );
  }
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 99990,
    elevation: 99990,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(230, 238, 230, 0.88)',
    zIndex: 99991,
    elevation: 99991,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99995,
    elevation: 99995,
  },
});
