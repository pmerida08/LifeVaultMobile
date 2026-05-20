import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
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

export function GoogleConnectBanner({ userId, connected, onConnectionChange }: Props) {
  const colors = useThemeColors();
  const { show: showToast } = useToast();
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    setSyncing(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); } catch {}
      const signInResult = await GoogleSignin.signIn();
      if (!isSuccessResponse(signInResult)) throw new Error('Sign-in cancelado');
      await GoogleSignin.addScopes({
        scopes: [
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/calendar',
        ],
      });
      await markConnected();
      const result = await importAllFromGoogle(userId);
      if (result.errors.length > 0) {
        showToast(`Sync con errores: ${result.errors[0]}`, 'error');
      } else {
        showToast(`Sync completado — ${result.tasksUpserted} tareas, ${result.eventsUpserted} eventos`, 'success');
      }
      onConnectionChange(true);
    } catch (e) {
      console.error('[GoogleConnectBanner]', e);
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
      <View style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={[styles.syncText, { color: colors.textMuted }]}>Importando desde Google...</Text>
      </View>
    );
  }

  if (connected) {
    return (
      <View style={[styles.banner, styles.bannerConnected, { backgroundColor: '#f0fdf4', borderColor: colors.success + '44' }]}>
        <Ionicons name="checkmark-circle" size={15} color={colors.success} />
        <Text style={[styles.connectedText, { color: colors.success }]}>Sincronizado con Google</Text>
        <TouchableOpacity onPress={handleDisconnect}>
          <Text style={[styles.disconnectText, { color: colors.textMuted }]}>Desconectar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.banner, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={handleConnect}
      activeOpacity={0.7}
    >
      <Ionicons name="logo-google" size={15} color={colors.primary} />
      <Text style={[styles.connectText, { color: colors.primary }]}>Conectar Google Tasks & Calendar</Text>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  bannerConnected: {},
  connectText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  syncText: {
    flex: 1,
    fontSize: 13,
  },
  connectedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  disconnectText: {
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
