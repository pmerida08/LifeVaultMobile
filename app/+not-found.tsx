import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Link, Stack } from 'expo-router';
import { ScreenLayout } from '../components/layout/ScreenLayout';
import { Colors } from '../constants/colors';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <ScreenLayout>
        <Text style={styles.title}>Page not found</Text>
        <Link href="/(tabs)" style={styles.link}>
          Go home
        </Link>
      </ScreenLayout>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginTop: 40,
  },
  link: {
    fontSize: 16,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 12,
  },
});
