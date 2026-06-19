# LifeVault — Presentación TFM

Presentación interactiva (web) y guion para la defensa del **Trabajo de Fin de Máster** de Pablo Mérida sobre **LifeVault**, una app móvil de bóveda documental personal con asistente de IA.

Pensada para una defensa de **7 minutos**: ~1:45 de contexto del problema + ~5:00 de demo en vídeo.

---

## ¿Qué es esto?

Una página web autónoma (un solo `index.html`, sin dependencias ni build) que se proyecta durante la defensa. Combina la narrativa del producto con **6 clips pregrabados de la app**, de modo que la demo funcione aunque falle la conexión o el backend (Supabase) durante la presentación.

Sigue la identidad visual real de LifeVault: logo del escudo, paleta violeta/índigo (`#4d44e3`) y degradados de marca.

---

## Estructura

```
presentacion-tfm/
├── index.html                 # La presentación (web autónoma)
├── guion-tfm-lifevault.md     # Guion hablado de 7 min + plan de clips
├── README.md                  # Este archivo
├── assets/
│   ├── logo.png               # Logo completo (escudo + wordmark)
│   ├── logo-icon.png          # Solo el escudo
│   └── favicon.png
└── videos/                    # Clips de la demo (378×850, ratio móvil)
    ├── clip1-login.mp4
    ├── clip2-boveda.mp4
    ├── clip3-ia-pregunta.mp4
    ├── clip4-ia-seguimiento.mp4
    ├── clip5-planner-sync.mp4
    └── clip6-polish.mp4
```

---

## Cómo presentarla

1. Abre `index.html` en un navegador (Chrome/Edge).
2. Pulsa **F11** para pantalla completa.
3. Navega entre secciones:

| Acción | Tecla |
|--------|-------|
| Avanzar / retroceder de sección | `→` `↓` / `←` `↑` (o scroll) |
| Ir al inicio / final | `Inicio` / `Fin` |
| Silenciar/activar sonido del clip activo | `M` |

Cada clip **se reproduce solo en bucle** al entrar en su sección. Además tiene **controles** (al pasar el ratón): play/pausa, barra de progreso para ir atrás/adelante, volumen y pantalla completa.

> Los vídeos arrancan **silenciados** para que el autoplay sea fiable (los navegadores bloquean el autoplay con sonido). Pulsa `M` si quieres oír un clip.

---

## Secciones

0. **Portada** — logo, título y tagline.
1. **El problema** — la documentación vital está dispersa y no se puede consultar.
2. **Clip 1 · Acceso** — login con Supabase Auth + Google Sign-In.
3. **Clip 2 · La bóveda** — subida de PDF y cifrado AES-256.
4. **Clip 3 · Asistente IA** ⭐ — preguntas en lenguaje natural con respuesta en streaming (SSE) sobre tus documentos.
5. **Clip 4 · Conversación** — historial persistente y nuevas sesiones.
6. **Clip 5 · Planner** ⭐ — sincronización bidireccional con Google Calendar y Google Tasks.
7. **Clip 6 · Acabado** — modo oscuro, i18n ES/EN y ajustes.
8. **Cierre** — métricas (99 tests, AES-256, sync bidireccional, build EAS) y stack.

---

## Sobre LifeVault (el producto)

- **Stack:** Expo SDK 54 · React Native · Expo Router · Zustand · NativeWind · Supabase (Auth, Storage, Postgres, Edge Functions).
- **Asistente IA:** streaming SSE sobre XHR, RAG sobre los documentos del usuario, historial persistente.
- **Seguridad:** cifrado de contenido AES-256 (pgcrypto), RLS por usuario.
- **Calidad:** 99 tests automatizados (jest-expo + Testing Library), CI en GitHub Actions, build Android real con EAS.

Repositorio de la app: raíz de este monorepo (`D:/Programas/LifeVaultMobile`).

---

*Material de apoyo para la defensa del TFM. Los clips son grabaciones de la app en funcionamiento.*
