/**
 * ReceiptScanner Component
 *
 * Full-screen camera view for capturing receipt images.
 * Uses expo-camera CameraView API and expo-image-picker for gallery selection.
 * Returns the captured image as a base64 string and URI via callback.
 */

import { useState, useRef, useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import { Text } from '@ui/components/Text';
import { Button } from '@ui/components/Button';
import { Icon } from '@ui/components/Icon';
import { useTheme } from '@theme/ThemeProvider';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ReceiptScannerProps {
  /** Called with the base64 encoded image and its local URI after capture or selection. */
  onImageCaptured: (base64: string, uri: string) => void;
  /** Called when the user dismisses the scanner. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ReceiptScanner({ onImageCaptured, onClose }: ReceiptScannerProps) {
  const { colors } = useTheme();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  // ----- Capture photo from camera -----

  const handleCapture = useCallback(async () => {
    if (capturing || !cameraReady || !cameraRef.current) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (photo?.base64 && photo.uri) {
        onImageCaptured(photo.base64, photo.uri);
      }
    } catch (error) {
      // Silently handle — the user can retry
      console.warn('ReceiptScanner: failed to capture photo', error);
    } finally {
      setCapturing(false);
    }
  }, [capturing, cameraReady, onImageCaptured]);

  // ----- Pick image from gallery -----

  const handlePickFromGallery = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const { uri, base64 } = result.assets[0];
        if (base64) {
          onImageCaptured(base64, uri);
        }
      }
    } catch (error) {
      console.warn('ReceiptScanner: failed to pick image from gallery', error);
    }
  }, [onImageCaptured]);

  // ----- Toggle flash / torch -----

  const toggleTorch = useCallback(() => {
    setTorchEnabled((prev) => !prev);
  }, []);

  // ----- Permission not yet determined or denied -----

  if (!permission || !permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-900">
        <View className="w-full items-center rounded-2xl bg-white p-8 shadow-sm dark:bg-neutral-800">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-950">
            <Icon name="camera" size={32} color={colors.primary} />
          </View>

          <Text variant="h3" className="mb-2 text-center">
            Camera Access Required
          </Text>

          <Text variant="caption" className="mb-6 text-center">
            Neemo needs access to your camera to scan receipts. Your photos are
            sent securely to Claude AI for processing and are not stored.
          </Text>

          <Button onPress={requestPermission} className="w-full">
            Grant Access
          </Button>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            className="mt-4 py-2"
          >
            <Text variant="body" className="text-center text-primary-500">
              Go Back
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ----- Camera view -----

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchEnabled}
        onCameraReady={() => setCameraReady(true)}
      />

      {/* ---------- Top overlay bar ---------- */}
      <View className="absolute left-0 right-0 top-0 flex-row items-center justify-between bg-black/50 px-4 pb-3 pt-14">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          hitSlop={12}
          className="h-9 w-9 items-center justify-center rounded-full bg-white/20"
        >
          <Icon name="close" size={22} color="#FFFFFF" />
        </Pressable>

        <Text variant="body" style={{ color: '#FFFFFF' }} className="font-sans-semibold">
          Scan Receipt
        </Text>

        {/* Spacer to keep title centered */}
        <View className="h-9 w-9" />
      </View>

      {/* ---------- Receipt guide overlay ---------- */}
      <View className="flex-1 items-center justify-center" pointerEvents="none">
        <View
          className="h-[55%] w-[78%] rounded-xl border-2 border-dashed border-white/60"
        />
      </View>

      {/* ---------- Bottom control bar ---------- */}
      <View className="absolute bottom-0 left-0 right-0 bg-black/50 pb-10 pt-5">
        <View className="flex-row items-center justify-around px-8">
          {/* Gallery button */}
          <Pressable
            onPress={handlePickFromGallery}
            accessibilityRole="button"
            accessibilityLabel="Pick from gallery"
            hitSlop={12}
            className="h-12 w-12 items-center justify-center rounded-full bg-white/20"
          >
            <Icon name="images-outline" size={24} color="#FFFFFF" />
          </Pressable>

          {/* Capture button */}
          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            hitSlop={4}
            className="h-[72px] w-[72px] items-center justify-center rounded-full border-[3px] border-white"
            style={capturing ? { opacity: 0.5 } : undefined}
          >
            <View className="h-[58px] w-[58px] rounded-full bg-white" />
          </Pressable>

          {/* Flash toggle button */}
          <Pressable
            onPress={toggleTorch}
            accessibilityRole="button"
            accessibilityLabel={torchEnabled ? 'Turn off flash' : 'Turn on flash'}
            hitSlop={12}
            className="h-12 w-12 items-center justify-center rounded-full bg-white/20"
          >
            <Icon
              name={torchEnabled ? 'flash' : 'flash-off-outline'}
              size={24}
              color={torchEnabled ? '#FACC15' : '#FFFFFF'}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
