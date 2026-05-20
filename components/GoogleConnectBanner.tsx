import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
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

export function GoogleConnectBanner({ userId, connected, onConnectionChange }: Props) {
  const [syncing, setSyncing] = useState(false);

  const handleConnect = async () => {
    setSyncing(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Cerrar sesión previa para forzar pantalla de consentimiento con Tasks/Calendar.
      // No afecta a la sesión de Supabase — solo limpia la sesión de Google Play Services.
      try { await GoogleSignin.signOut(); } catch {}
      const signInResult = await GoogleSignin.signIn();
      if (!isSuccessResponse(signInResult)) {
        throw new Error('Sign-in cancelado');
      }
      // Pedir explícitamente los scopes de Tasks y Calendar.
      // addScopes muestra el consent screen adicional si aún no se han concedido.
      await GoogleSignin.addScopes({
        scopes: [
          'https://www.googleapis.com/auth/tasks',
          'https://www.googleapis.com/auth/calendar',
        ],
      });


      await markConnected();
      const result = await importAllFromGoogle(userId);

      if (result.errors.length > 0) {
        Alert.alert(
          'Errores de sync',
          result.errors.slice(0, 3).join('\n'),
        );
      } else {
        Alert.alert(
          'Sync completado',
          `Tareas: ${result.tasksFetched} recibidas → ${result.tasksUpserted} guardadas\nEventos: ${result.eventsFetched} recibidos → ${result.eventsUpserted} guardados`,
        );
      }

      onConnectionChange(true);
    } catch (e) {
      console.error('[GoogleConnect]', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    await clearTokens();
    onConnectionChange(false);
  };

  if (syncing) {
    return (
      <View style={styles.banner}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.syncText}>Importando desde Google...</Text>
      </View>
    );
  }

  if (connected) {
    return (
      <View style={[styles.banner, styles.bannerConnected]}>
        <Ionicons name="checkmark-circle" size={15} color={Colors.success} />
        <Text style={styles.connectedText}>Sincronizado con Google</Text>
        <TouchableOpacity onPress={handleDisconnect}>
          <Text style={styles.disconnectText}>Desconectar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={handleConnect}
      activeOpacity={0.7}
    >
      <Ionicons name="logo-google" size={15} color={Colors.primary} />
      <Text style={styles.connectText}>Conectar Google Tasks & Calendar</Text>
      <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
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
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bannerConnected: {
    borderColor: Colors.success + '44',
    backgroundColor: '#f0fdf4',
  },
  connectText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  syncText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textMuted,
  },
  connectedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.success,
  },
  disconnectText: {
    fontSize: 12,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
