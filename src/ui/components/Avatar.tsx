/**
 * Avatar Component
 *
 * Circular avatar displaying an image or initials fallback.
 * Supports sm (32px), md (40px), lg (56px) sizes.
 */

import React, { useState } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';

import { Text } from './Text';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** Image URI */
  imageUri?: string | null;
  /** Fallback initials (1-2 characters) */
  initials?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Additional NativeWind classes */
  className?: string;
  /** Accessibility label */
  accessibilityLabel?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

const textSizeClasses: Record<AvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
};

const imageSizes: Record<AvatarSize, number> = {
  sm: 32,
  md: 40,
  lg: 56,
};

export function Avatar({
  imageUri,
  initials = '?',
  size = 'md',
  className = '',
  accessibilityLabel,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const showImage = imageUri && !imageError;
  const displayInitials = (initials || '?').slice(0, 1).toUpperCase();

  return (
    <View
      className={`items-center justify-center rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 ${sizeClasses[size]} ${className}`}
      accessibilityLabel={accessibilityLabel ?? `Avatar ${displayInitials}`}
      accessibilityRole="image"
    >
      {showImage ? (
        <Image
          source={{ uri: imageUri }}
          style={{ width: imageSizes[size], height: imageSizes[size] }}
          contentFit="cover"
          onError={() => setImageError(true)}
          transition={200}
        />
      ) : (
        <Text
          variant="body"
          className={`font-sans-semibold text-primary-600 dark:text-primary-300 ${textSizeClasses[size]}`}
        >
          {displayInitials}
        </Text>
      )}
    </View>
  );
}
