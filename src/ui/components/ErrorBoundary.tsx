import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { palette } from '@theme/colors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 items-center justify-center px-6 bg-surface-secondary dark:bg-surface-dark">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <Ionicons name="alert-circle-outline" size={32} color={palette.danger} />
          </View>
          <Text variant="h3" className="text-center mb-2">
            Something went wrong
          </Text>
          <Text variant="body" className="text-center mb-6 text-neutral-500 dark:text-neutral-400">
            The app encountered an unexpected error. Please try again.
          </Text>
          <Pressable
            onPress={this.handleReset}
            className="px-6 py-3 bg-primary-500 active:bg-primary-700 rounded-xl"
            accessibilityRole="button"
            accessibilityLabel="Try again"
          >
            <Text variant="body" className="text-white font-sans-semibold">
              Try Again
            </Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
