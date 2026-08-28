# Sinappsis Backend — MVP

API REST para demostrar un flujo educativo básico: una persona adulta se registra, crea un estudiante, configura sus apoyos, consulta actividades, completa un intento y revisa el progreso. Está construida con Node.js, TypeScript, Fastify, Prisma y SQLite.

La adaptación es determinista: devuelve la actividad original junto con opciones de presentación derivadas del perfil. No usa IA, no reescribe instrucciones y no almacena diagnósticos.

## Requisitos e instalación

- Node.js 20 o posterior
- pnpm 11
- `curl` y, para copiar identificadores en el ejemplo, `jq`

```bash
pnpm install
cp .env.example .env
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

En PowerShell, copie el entorno con `Copy-Item .env.example .env`. El seed carga cinco actividades en español: Vocales, Números del 1 al 5, Colores, Formas y Secuencias simples.

## Variables de entorno

| Variable            | Ejemplo                   | Uso                                               |
| ------------------- | ------------------------- | ------------------------------------------------- |
| `NODE_ENV`          | `development`             | Entorno de ejecución                              |
| `PORT`              | `3000`                    | Puerto HTTP                                       |
| `DATABASE_URL`      | `file:./dev.db`           | Archivo SQLite; Prisma lo crea en `prisma/dev.db` |
| `JWT_ACCESS_SECRET` | secreto de 32+ caracteres | Firma del JWT de acceso                           |
| `ACCESS_TOKEN_TTL`  | `1h`                      | Vigencia del JWT (`s`, `m`, `h` o `d`)            |
| `CORS_ORIGINS`      | `http://localhost:5173`   | Orígenes permitidos, separados por comas          |
| `LOG_LEVEL`         | `info`                    | Nivel de logs                                     |

Cambie `JWT_ACCESS_SECRET` antes de iniciar. Puede generar uno con `openssl rand -base64 48`.

## Ejecución y comprobaciones

Inicie el servidor con recarga:

```bash
pnpm dev
```

La API usa `http://localhost:3000`; compruebe el arranque con:

```bash
curl http://localhost:3000/health
```

Comandos de calidad y compilación:

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Para ejecutar la compilación generada:

```bash
pnpm start
```

Estos comandos son instrucciones de ejecución; este README no implica que se hayan ejecutado correctamente en su equipo.

## Demostración completa con cURL

Los ejemplos siguientes usan Bash y `jq`. Mantenga el servidor activo en otra terminal.

### 1. Registrar un adulto e iniciar sesión

```bash
export API_URL=http://localhost:3000

curl -sS -X POST "$API_URL/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"adulto@example.test","password":"ClaveSegura2026","fullName":"Adulto de prueba","role":"PARENT"}' | jq

LOGIN_RESPONSE=$(curl -sS -X POST "$API_URL/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"adulto@example.test","password":"ClaveSegura2026"}')

export ACCESS_TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | jq -r '.data.accessToken')
```

### 2. Crear y seleccionar un estudiante

```bash
LEARNER_RESPONSE=$(curl -sS -X POST "$API_URL/api/v1/learners" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Luna","birthYear":2020}')

export LEARNER_ID=$(printf '%s' "$LEARNER_RESPONSE" | jq -r '.data.id')

curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/learners" | jq

curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/learners/$LEARNER_ID" | jq
```

### 3. Configurar apoyos educativos

```bash
curl -sS -X PUT \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"visualSupport":true,"audioSupport":false,"shortInstructions":true,"stepByStep":true,"breaksEnabled":true,"attentionSupport":true,"autonomyLevel":1}' \
  "$API_URL/api/v1/learners/$LEARNER_ID/learning-profile" | jq
```

### 4. Consultar el catálogo y una actividad adaptada

El seed asigna identificadores estables; este ejemplo usa **Colores**.

```bash
export ACTIVITY_ID=10000000-0000-4000-8000-000000000003

curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/activities" | jq

curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/activities/$ACTIVITY_ID" | jq

curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/learners/$LEARNER_ID/activities/$ACTIVITY_ID/adapted" | jq
```

La respuesta adaptada contiene `presentation`, por ejemplo `showOneStepAtATime`, `showVisualSupport`, `enableAudio`, `enableBreaks` y `autonomyLevel`.

### 5. Iniciar un intento y registrar respuestas

```bash
ATTEMPT_RESPONSE=$(curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"activityId\":\"$ACTIVITY_ID\"}" \
  "$API_URL/api/v1/learners/$LEARNER_ID/attempts")

export ATTEMPT_ID=$(printf '%s' "$ATTEMPT_RESPONSE" | jq -r '.data.id')

while read -r STEP_ID ANSWER; do
  curl -sS -X PUT \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"response\":{\"value\":\"$ANSWER\"}}" \
    "$API_URL/api/v1/learners/$LEARNER_ID/attempts/$ATTEMPT_ID/responses/$STEP_ID" | jq
done <<'ANSWERS'
13000000-0000-4000-8000-000000000001 rojo
13000000-0000-4000-8000-000000000002 azul
13000000-0000-4000-8000-000000000003 amarillo
13000000-0000-4000-8000-000000000004 verde
ANSWERS
```

### 6. Completar y consultar el progreso

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/learners/$LEARNER_ID/attempts/$ATTEMPT_ID/complete" | jq

curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/learners/$LEARNER_ID/progress" | jq
```

La puntuación se calcula en el servidor como respuestas evaluables correctas entre respuestas evaluables totales, multiplicado por 100. Las bandas son 1 estrella para 0–49, 2 para 50–79 y 3 para 80–100. El cliente no envía el resultado final.

Para comprobar el aislamiento, registre una segunda cuenta y repita una consulta con el `LEARNER_ID` anterior usando su token; esa cuenta no debe obtener los datos del estudiante.

## Limitaciones conocidas

- Es un prototipo local, sin frontend, despliegue productivo, panel administrativo ni gestión del catálogo por API.
- Usa un único JWT de acceso. No incluye recuperación de contraseña, verificación de correo, autenticación externa ni sesiones por dispositivo.
- Cada estudiante pertenece a la cuenta adulta que lo creó; no hay funciones para compartirlo con otras cuentas.
- SQLite facilita la demostración local, pero no cubre concurrencia elevada, alta disponibilidad ni copias de seguridad administradas.
- El catálogo contiene solo las cinco actividades del seed; no hay archivos multimedia generados.
- La adaptación solo cambia opciones de presentación. No usa IA ni ofrece recomendaciones médicas.
- La evaluación acepta únicamente respuestas deterministas compatibles con el contenido sembrado.
- Las pruebas son deliberadamente enfocadas al flujo principal, no exhaustivas.

## Migración futura a PostgreSQL

Para una siguiente etapa, cambie el proveedor de Prisma a `postgresql`, configure una URL de PostgreSQL y genere una migración nueva para ese motor. Revise tipos, restricciones, concurrencia y datos antes de importar información; las migraciones SQLite no deben aplicarse directamente sobre PostgreSQL. Docker, despliegue, backups y observabilidad deben validarse como trabajo separado.
