# Skill: feature-flow

Gestiona el flujo Git del proyecto: feature → dev → main.

## Cuándo usar

Cuando el usuario diga "mergea a main", "sube la feature", "flujo git", "termina la feature" o similar.

## Flujo estándar

### 1. Verificar estado limpio
```bash
git status
git diff --stat
```
Si hay cambios sin commitear, hacer commit antes de continuar.

### 2. Añadir a dev (desde la feature branch o desde dev directamente)
```bash
git checkout dev
git merge --no-ff feature/<nombre> -m "feat: <descripción>"
# o si ya estás en dev con los cambios:
git add <archivos>
git commit -m "feat: <descripción>"
```

### 3. Mergear dev → main (solo cuando dev está estable)
```bash
git checkout main
git merge --no-ff dev -m "release: <descripción del conjunto de cambios>"
git checkout dev
```

### 4. Continuar en dev
Siempre terminar en `dev` para la siguiente feature.

## Convenciones de commits

- `feat:` nueva funcionalidad
- `fix:` corrección de bug
- `chore:` configuración, dependencias, scaffolding
- `refactor:` mejora sin cambio de comportamiento
- `docs:` documentación

## Ejemplo de sesión completa

```
usuario: implementa la pantalla de perfil
→ trabajas en dev o en feature/profile
→ al terminar: commit en dev

usuario: está bien, súbela a main
→ checkout main
→ merge dev → main con mensaje "release: pantalla de perfil"
→ checkout dev
```

## Notas

- Nunca commitear `.env` (está en .gitignore).
- Los archivos generados (`/android`, `/ios`) tampoco se commitean.
- `main` solo recibe merges desde `dev`, nunca commits directos.
