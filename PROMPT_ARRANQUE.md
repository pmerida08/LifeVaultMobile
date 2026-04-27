# LifeVaultMobile — Prompt de Arranque para Claude Code

Copia y pega esto al abrir una nueva sesión en `D:\Programas\LifeVaultMobile`.

---

## Contexto del proyecto

Eres un senior React Native engineer. Estás trabajando en **LifeVaultMobile**, una app móvil con Expo que es el cliente mobile de LifeVault.

El proyecto web principal está en `D:\Programas\LifeVaultWeb`. La lógica de backend (Edge Functions, base de datos Supabase, búsqueda semántica con n8n) ya existe y está en producción — **no toques ese proyecto**, solo consúmelo.

## Qué tiene implementado ya

- **Login con Google** vía `expo-auth-session` + `supabase.auth.signInWithIdToken`
- **ChatScreen** con interfaz de chat completa, markdown rendering, typing indicator
- **Zustand stores**: `auth.store.ts` (sesión) y `assistant.store.ts` (mensajes)
- **Conexión a la Edge Function** `ai-assistant` del proyecto web (misma que usa la web)
- **Navegación**: `LoginScreen` si no hay sesión, `ChatScreen` si hay sesión

## Stack

- React Native + Expo SDK 54 + TypeScript
- Zustand, @react-navigation/native, @supabase/supabase-js
- expo-auth-session, expo-secure-store, expo-web-browser
- react-native-markdown-display, react-native-get-random-values, uuid

## Variables de entorno necesarias

Crea `.env` copiando `.env.example`:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

Para el `GOOGLE_CLIENT_ID` de Expo necesitas crear un OAuth Client de tipo **Android** y/o **iOS** en Google Cloud Console con el scheme de Expo.

## Flujo Git del proyecto

- `main` — producción estable
- `dev` — desarrollo activo
- Cada feature nueva se desarrolla en `dev` y se mergea a `main` cuando está lista
- Usa el skill `/feature-flow` para gestionar el flujo (está en `.claude/skills/feature-flow.md`)

## Cómo arrancar

```bash
# Copiar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# Arrancar Expo
npm start
# Escanear el QR con Expo Go en el móvil
```

## Próximas features a implementar (en orden sugerido)

1. **Configurar Google OAuth correctamente** — añadir el Client ID real y verificar el redirect URI con Expo
2. **Pantalla de Vault** — lista de documentos del usuario (leer de `vault_notes` en Supabase)
3. **Pantalla de Tareas** — lista y creación de tareas
4. **Notificaciones push** — expo-notifications para recordatorios
5. **Adjuntos en el chat** — cuando el asistente devuelve `attachments`, mostrar tarjetas de documento tappables

## Reglas de implementación

1. TypeScript estricto, sin `any`. Tipos en `src/types/index.ts`.
2. Sin comentarios triviales.
3. Sin borders — usar sombras y superficies de color.
4. Variables de entorno: solo `process.env.EXPO_PUBLIC_*`.
5. SecureStore para tokens, nunca AsyncStorage.
6. No duplicar lógica del backend — consumir las Edge Functions existentes.
