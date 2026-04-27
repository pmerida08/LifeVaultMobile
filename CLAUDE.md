# LifeVaultMobile — Instrucciones para Claude Code

## Qué es este proyecto

App móvil en **React Native + Expo** para LifeVault. Cubre dos funcionalidades:
1. **Login con Google** vía Supabase Auth
2. **Chatbot IA** conectado a la Edge Function `ai-assistant` del proyecto web

El proyecto web principal está en `D:\Programas\LifeVaultWeb`.

## Stack

- React Native + Expo SDK (bare-ish: blank-typescript template)
- TypeScript estricto
- Zustand para estado global
- @react-navigation/native + native-stack
- @supabase/supabase-js con SecureStore para persistencia de sesión
- expo-auth-session + expo-web-browser para Google OAuth
- react-native-markdown-display para renderizar respuestas del asistente

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores reales:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_CLIENT_ID=
```

Las variables `EXPO_PUBLIC_*` son accesibles en el cliente vía `process.env`.

## Arquitectura de pantallas

```
App.tsx
├── LoginScreen   — si no hay sesión activa
└── ChatScreen    — si hay sesión
```

No hay navegación lateral por ahora. La app es intencionalmente simple.

## Flujo del chatbot

1. `ChatScreen` → `useAssistantStore.sendMessage()`
2. `assistant.store.ts` → `queryAssistant()` en `lib/api.ts`
3. `api.ts` → POST a `{SUPABASE_URL}/functions/v1/ai-assistant`
4. La Edge Function es la misma que usa la app web (no duplicar lógica)
5. Respuesta renderizada con `react-native-markdown-display`

## Archivos clave

- `App.tsx` — navegación raíz, carga de sesión inicial
- `src/lib/supabase.ts` — cliente Supabase con SecureStore
- `src/lib/api.ts` — llamada a la Edge Function
- `src/store/auth.store.ts` — estado de autenticación
- `src/store/assistant.store.ts` — mensajes y sesión del chat
- `src/screens/LoginScreen.tsx` — Google OAuth con expo-auth-session
- `src/screens/ChatScreen.tsx` — interfaz de chat

## Sistema de diseño

Igual que la app web — sin borders, sólo sombras y superficies:

```typescript
const COLORS = {
  primary: '#4d44e3',
  background: '#f8f7ff',
  surface: '#fff',
  text: '#1a1a2e',
  textMuted: '#6b7280',
  danger: '#ef4444',
};
```

- `borderRadius: 16–24` para cards y botones
- `shadowColor + elevation` en lugar de borders
- Fuente del sistema (no importar fuentes externas salvo que sea necesario)

## Flujo Git

- Rama principal: `main`
- Desarrollo activo: `dev`
- Cada feature nueva se desarrolla en `dev` y se mergea a `main` cuando está estable
- Ver `.claude/skills/feature-flow.md` para el flujo detallado

Para ejecutar el flujo git: usa el skill `feature-flow` (invócalo con `/feature-flow` o descríbelo en lenguaje natural).

## Comandos útiles

```bash
npm start          # Expo dev server (escanear QR con Expo Go)
npm run android    # Emulador Android
npm run ios        # Simulador iOS (solo macOS)
npm run web        # Versión web (limitada, solo para debugging)
```

## Pendiente / próximas features

- Instalar uuid nativo (`react-native-get-random-values` + `uuid`)
- Notificaciones push (expo-notifications)
- Pantalla de documentos (lista del vault)
- Pantalla de tareas
- Deep linking para abrir documentos

## Reglas de implementación

1. **TypeScript estricto** — sin `any`. Usar los tipos de `src/types/index.ts`.
2. **Sin comentarios triviales** — solo comentar lógica no obvia.
3. **Un store por dominio** — no mezclar lógica entre stores.
4. **Sin borders** — solo sombras y superficies de color para separar elementos.
5. **Variables de entorno** — nunca hardcodear URLs ni keys. Siempre `process.env.EXPO_PUBLIC_*`.
6. **SecureStore para tokens** — nunca AsyncStorage para datos sensibles.
