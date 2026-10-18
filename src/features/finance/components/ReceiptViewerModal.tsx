import { Modal, View, Pressable, Image } from 'react-native';
import { Text } from '@ui/components/Text';
import { Icon } from '@ui/components/Icon';

interface ReceiptViewerModalProps {
  uri: string | null;
  visible: boolean;
  onClose: () => void;
}

export function ReceiptViewerModal({ uri, visible, onClose }: ReceiptViewerModalProps) {
  if (!uri) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/90">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 pt-14 pb-3">
          <Text variant="body" style={{ color: '#FFFFFF' }} className="font-sans-semibold">
            Receipt
          </Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" hitSlop={12} className="rounded-full bg-white/20 p-2">
            <Icon name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Image */}
        <View className="flex-1 items-center justify-center px-4">
          <Image
            source={{ uri }}
            className="h-full w-full"
            resizeMode="contain"
          />
        </View>
      </View>
    </Modal>
  );
}
