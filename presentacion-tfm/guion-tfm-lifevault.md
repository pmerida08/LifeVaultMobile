# LifeVault — Guion presentación TFM (7 min)

> **Estructura:** Contexto (1:45) + Demo (5:00) = 6:45 · ~15 s de colchón.
> Si vas justo de tiempo, recorta el bloque 2.4 (polish), es el más prescindible.

---

## BLOQUE 1 — Contexto y problema (1:45)

*Tono: cercano, sin tecnicismos todavía. Mira al jurado, no a la pantalla.*

"Buenos días. Os voy a presentar **LifeVault**, mi Trabajo de Fin de Máster.

Quiero empezar con una pregunta sencilla: ¿dónde tenéis ahora mismo vuestro DNI escaneado, el contrato del piso, la póliza del seguro o la última factura importante? Lo más probable es que la respuesta sea *"en algún sitio"*: el correo, una carpeta del móvil, una foto perdida en la galería, un cajón de WhatsApp. **Nuestra documentación vital está dispersa y es prácticamente imposible de consultar cuando de verdad la necesitamos.**

Las soluciones actuales no resuelven esto del todo. Un Google Drive o un Dropbox te **almacenan** los archivos, pero no los **entienden**: si quieres saber *"cuándo vence mi seguro"*, tienes que abrir el PDF y buscarlo tú a mano. Y las apps de notas no están pensadas para documentos sensibles ni para gestionar tu día a día.

LifeVault nace de esa idea: **una bóveda personal segura donde guardas tus documentos importantes, y un asistente de inteligencia artificial que los lee por ti y responde a tus preguntas en lenguaje natural.** Además, integra un gestor de tareas y calendario, porque la documentación y las obligaciones del día a día van de la mano.

Es una aplicación móvil real, construida con Expo y React Native sobre Supabase, con todo el backend de IA, cifrado y sincronización ya funcionando. No es un prototipo de pantallas: es un producto completo. Os lo enseño en directo."

*(Aquí lanzas la demo / primer clip.)*

---

## BLOQUE 2 — Demo (5:00)

*Tono: ágil. Cada función = una frase de "qué" + una frase de "por qué importa". No te quedes en silencio mientras cargan las pantallas.*

### 2.1 — Entrada y la bóveda (1:00)

"Entro con mi cuenta. El acceso es seguro mediante autenticación con Supabase, e incluso permite **inicio de sesión con Google**.

Esto es la **bóveda**, el corazón de la app. Aquí están todos mis documentos. Voy a **subir uno nuevo** —un PDF— directamente desde el móvil. Se almacena de forma segura en la nube y, un detalle importante para un TFM: el contenido se guarda **cifrado con AES-256**, así que aunque alguien accediera a la base de datos, no podría leerlo. La seguridad no es un añadido, es parte del diseño."

### 2.2 — El asistente IA (2:00) ⭐ *núcleo de la demo*

"Y aquí viene lo que diferencia a LifeVault. Voy al **asistente de IA** y, en lugar de abrir el PDF y buscar, simplemente **pregunto**.

*[escribes una pregunta sobre un documento, ej: «¿Cuándo vence mi seguro del coche?»]*

Fijaos en dos cosas. Primero, la respuesta **aparece en streaming, palabra a palabra**, como ChatGPT —esto está implementado con Server-Sent Events sobre XHR, porque React Native no soporta streaming de forma nativa y fue uno de los retos técnicos del proyecto—. Y segundo, y más importante: **la respuesta sale de mi documento**, no de internet. El asistente ha leído el PDF que acabo de subir y ha extraído justo el dato que necesitaba.

Puedo seguir conversando, hacer preguntas de seguimiento, y la app **recuerda el hilo** porque el historial se guarda de forma persistente. Puedo abrir una **conversación nueva** cuando cambio de tema."

### 2.3 — El planner (1:00)

"La tercera pata es el **planner**: tareas y eventos. Creo una tarea rápida.

Lo interesante es que esto **se sincroniza de forma bidireccional con Google Calendar y Google Tasks**. Lo que creo aquí aparece en mi Google, y lo que tengo en Google aparece aquí. Es una sincronización en los dos sentidos, no una simple importación —otro de los puntos técnicos más complejos del proyecto."

### 2.4 — Acabado y producción (1:00)

"Y para terminar, la app está **acabada como un producto real**, no como una demo de máster:

- **Modo oscuro** completo *[lo activas]*.
- **Multi-idioma**, español e inglés *[cambias idioma]*.
- Ajustes funcionales: perfil, contraseña, notificaciones, suscripción.
- Y por debajo: **99 tests automatizados**, integración continua en GitHub, y una **build real generada con EAS** lista para instalar en un móvil Android.

En resumen: LifeVault es una bóveda documental segura, con un asistente de IA que entiende tus documentos y un gestor de tu día a día, construida y testeada como una aplicación de producción. Muchas gracias. Quedo a vuestra disposición para preguntas."

---

## 🎬 Clips a grabar antes (por si falla Supabase)

Grábalos en este orden, son exactamente los pasos de la demo. Nombres de archivo esperados por la web de presentación entre paréntesis.

| # | Clip | Qué capturar | Duración | Archivo |
|---|------|--------------|----------|---------|
| 1 | **Login** | Pantalla de acceso → entrar (enseña el botón de Google aunque uses email) | 8-10 s | `clip1-login.mp4` |
| 2 | **Bóveda + subida** ⭐ | Lista de documentos → subir un PDF nuevo → que aparezca en la lista | 20-25 s | `clip2-boveda.mp4` |
| 3 | **Asistente IA — pregunta** ⭐⭐ | Escribir la pregunta → respuesta **apareciendo en streaming** (clave, no cortar) → mostrar que el dato sale del documento | 30-40 s | `clip3-ia-pregunta.mp4` |
| 4 | **Asistente IA — seguimiento** | Una pregunta de seguimiento + abrir conversación nueva | 15 s | `clip4-ia-seguimiento.mp4` |
| 5 | **Planner + sync** ⭐ | Crear tarea/evento → **mostrar Google Calendar al lado** con la tarea ya aparecida | 25-30 s | `clip5-planner-sync.mp4` |
| 6 | **Polish** | Activar modo oscuro → cambiar idioma ES/EN | 15 s | `clip6-polish.mp4` |

**Consejos de grabación:**
- El **clip 3 (streaming)** y el **5 (sync con Google)** son los que más venden técnicamente. Grábalos con especial cuidado y en alta calidad.
- Para el clip 5, ten **Google Calendar abierto en otra ventana/dispositivo** y muestra el antes/después: es la prueba visual de que la sincronización es real.
- Graba **2-3 segundos de margen** al principio y final de cada clip para editarlos sin cortes bruscos.
- Prepara un **documento "de demo" ya subido** con datos jugosos (un seguro con fecha de vencimiento, importes, etc.) para que las respuestas del asistente sean concretas.
