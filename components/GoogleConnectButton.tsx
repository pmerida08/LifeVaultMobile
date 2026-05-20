import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { markConnected, clearTokens } from '../lib/google-auth';
import { importAllFromGoogle } from '../lib/google-sync';

interface Props {
  userId: string;
  connected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export function GoogleConnectButton({ userId, connected, onConnectionChange }: Props) {
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    setSyncing(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); } catch {}
      const signInResult = await GoogleSignin.signIn();
      if (!isSuccessResponse(signInResult)) return;
      await GoogleSignin.addScopes({
        scopes: [
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/calendar',
        ],
      });
      await markConnected();
      await importAllFromGoogle(userId);
      onConnectionChange(true);
    } catch (e) {
      console.error('[GoogleConnect]', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert('Desconectar Google', '¿Desconectar Tasks y Calendar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desconectar', style: 'destructive', onPress: async () => {
          await clearTokens();
          onConnectionChange(false);
        },
      },
    ]);
  };

  if (syncing) {
    return (
      <ActivityIndicator
        size="small"
        color={Colors.primary}
        style={styles.btn}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[styles.btn, connected && styles.btnConnected]}
      onPress={connected ? handleDisconnect : handleConnect}
      activeOpacity={0.7}
    >
      <Ionicons
        name="logo-google"
        size={17}
        color={connected ? Colors.success : Colors.textMuted}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConnected: {
    borderColor: Colors.success + '88',
    backgroundColor: '#f0fdf4',
  },
});
