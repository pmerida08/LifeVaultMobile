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
import { Colors } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

const AnimatedView = Animated.createAnimatedComponent(View);

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, secureTextEntry, ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [hidden, setHidden] = useState(secureTextEntry ?? false);

    const borderAnim = useSharedValue(0);
    const animStyle = useAnimatedStyle(() => ({
      borderWidth: 1.5,
      borderColor: error
        ? Colors.danger
        : withTiming(
            borderAnim.value === 1 ? Colors.primary : Colors.border,
            { duration: 200 }
          ),
    }));

    const handleFocus = () => {
      setFocused(true);
      borderAnim.value = 1;
      props.onFocus?.(null as any);
    };

    const handleBlur = () => {
      setFocused(false);
      borderAnim.value = 0;
      props.onBlur?.(null as any);
    };

    return (
      <View style={styles.wrapper}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <AnimatedView style={[styles.inputContainer, animStyle]}>
          <TextInput
            ref={ref}
            style={[styles.input, style]}
            placeholderTextColor={Colors.textMuted}
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
                color={Colors.textMuted}
              />
            </Pressable>
          )}
        </AnimatedView>
        {error ? <Text style={styles.error}>{error}</Text> : null}
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
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    shadowColor: Colors.text,
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
    color: Colors.text,
    minHeight: 44,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  error: {
    fontSize: 12,
    color: Colors.danger,
  },
});
