import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet } from 'react-native';

interface CheddarRainProps {
  isActive: boolean;
  onComplete?: () => void;
}

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  animValue: Animated.Value;
}

export function CheddarRain({ isActive, onComplete }: CheddarRainProps) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const { height } = Dimensions.get('window');

  useEffect(() => {
    if (!isActive) {
      setPieces([]);
      fadeAnim.setValue(1);
      return;
    }

    fadeAnim.setValue(1);

    const newPieces: Piece[] = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      left: Math.random() * 90,
      delay: Math.random() * 5000,
      duration: 3000 + Math.random() * 2000,
      size: 20 + Math.random() * 30,
      animValue: new Animated.Value(0),
    }));
    setPieces(newPieces);

    // Start individual falling animations
    const animations = newPieces.map((p) =>
      Animated.loop(
        Animated.timing(p.animValue, {
          toValue: 1,
          duration: p.duration,
          delay: p.delay,
          useNativeDriver: true,
        })
      )
    );
    animations.forEach((a) => a.start());

    // Fade out at 11s
    const fadeTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 4000,
        useNativeDriver: true,
      }).start();
    }, 11000);

    // Clean up at 15s
    const endTimer = setTimeout(() => {
      animations.forEach((a) => a.stop());
      setPieces([]);
      onComplete?.();
    }, 15000);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(endTimer);
      animations.forEach((a) => a.stop());
    };
  }, [isActive]);

  if (!isActive || pieces.length === 0) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim, zIndex: 999 }]} pointerEvents="none">
      {pieces.map((p) => (
        <Animated.Text
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            fontSize: p.size,
            transform: [
              {
                translateY: p.animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, height + 50],
                }),
              },
            ],
          }}
        >
          🧀
        </Animated.Text>
      ))}
    </Animated.View>
  );
}
