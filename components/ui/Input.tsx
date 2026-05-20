import React, { forwardRef, useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, secureTextEntry, ...props }, ref) => {
    const colors = useThemeColors();
    const [hidden, setHidden] = useState(secureTextEntry ?? false);

    const borderAnim = useSharedValue(0);
    const animStyle = useAnimatedStyle(() => ({
      borderWidth: 1.5,
      borderColor: error
        ? colors.danger
        : withTiming(
            borderAnim.value === 1 ? colors.primary : colors.border,
            { duration: 200 }
          ),
    }));

    const handleFocus = () => {
      borderAnim.value = 1;
      props.onFocus?.(null as any);
    };

    const handleBlur = () => {
      borderAnim.value = 0;
      props.onBlur?.(null as any);
    };

    return (
      <View style={styles.wrapper}>
        {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
        <AnimatedView
          style={[
            styles.inputContainer,
            { backgroundColor: colors.surface },
            animStyle,
          ]}
        >
          <TextInput
            ref={ref}
            style={[styles.input, { color: colors.text }, style]}
            placeholderTextColor={colors.textMuted}
            secureTextEntry={hidden}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />
          {secureTextEntry && (
            <Pressable
              onPress={() => setHidden((h) => !h)}
              style={styles.eyeButton}
              accessibilityLabel={hidden ? 'Mostrar contraseña' : 'Ocultar contraseña'}
              hitSlop={8}
            >
              <Ionicons
                name={hidden ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={colors.textMuted}
              />
            </Pressable>
          )}
        </AnimatedView>
        {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    shadowColor: '#1A1035',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 44,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    fontSize: 12,
  },
});
