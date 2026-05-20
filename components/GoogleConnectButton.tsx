import React, { useState } from 'react';
import { TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../constants/colors';
import { markConnected, clearTokens } from '../lib/google-auth';
import { importAllFromGoogle } from '../lib/google-sync';
import { useToast } from '../lib/toast';

interface Props {
  userId: string;
  connected: boolean;
  onConnectionChange: (connected: boolean) => void;
}

export function GoogleConnectButton({ userId, connected, onConnectionChange }: Props) {
  const colors = useThemeColors();
  const { show: showToast } = useToast();
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
      showToast('Google conectado', 'success');
    } catch (e) {
      console.error('[GoogleConnect]', e);
      showToast('No se pudo conectar con Google', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await clearTokens();
    onConnectionChange(false);
    showToast('Google desconectado', 'info');
  };

  if (syncing) {
    return (
      <ActivityIndicator
        size="small"
        color={colors.primary}
        style={styles.btn}
      />
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.btn,
        { borderColor: connected ? colors.success + '88' : colors.border, backgroundColor: colors.surface },
        connected && styles.btnConnected,
      ]}
      onPress={connected ? handleDisconnect : handleConnect}
      activeOpacity={0.7}
    >
      <Ionicons
        name="logo-google"
        size={17}
        color={connected ? colors.success : colors.textMuted}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnConnected: {
    backgroundColor: '#f0fdf4',
  },
});
