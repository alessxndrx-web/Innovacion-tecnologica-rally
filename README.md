# Sinappsis Backend — MVP

API REST para demostrar un flujo educativo básico: una persona adulta se registra, crea un estudiante, configura sus apoyos, consulta actividades, completa un intento y revisa el progreso. Está construida con Node.js, TypeScript, Fastify, Prisma y PostgreSQL.

La adaptación es determinista: devuelve la actividad original junto con opciones de presentación derivadas del perfil. No usa IA, no reescribe instrucciones y no almacena diagnósticos.

## Requisitos e instalación

- Node.js 20 o posterior
- pnpm 11
- PostgreSQL 16 o posterior, local o gestionado
- `curl` y, para copiar identificadores en el ejemplo, `jq`

Si prefiere no instalar PostgreSQL, `docker compose up` levanta la base y la API
juntas y no hace falta nada más.

```bash
pnpm install
cp .env.example .env
# Ajuste DATABASE_URL con su cadena de conexión antes de continuar.
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Las pruebas de integración usan una base aparte y la reconstruyen en cada
ejecución. Se configura con `TEST_DATABASE_URL`, deliberadamente distinta de
`DATABASE_URL` para que nunca puedan borrar la base de desarrollo. Si no se define,
usan `postgresql://postgres:adaptadev@127.0.0.1:5432/adapta_test`.

En PowerShell, copie el entorno con `Copy-Item .env.example .env`. El seed carga cinco actividades en español: Vocales, Números del 1 al 5, Colores, Formas y Secuencias simples.

## Variables de entorno

| Variable            | Ejemplo                   | Uso                                              |
| ------------------- | ------------------------- | ------------------------------------------------ |
| `NODE_ENV`          | `development`             | Entorno de ejecución                             |
| `PORT`              | `3000`                    | Puerto HTTP                                      |
| `DATABASE_URL`      | `postgresql://…`          | Cadena de conexión a PostgreSQL                  |
| `JWT_ACCESS_SECRET` | secreto de 32+ caracteres | Firma del JWT de acceso                          |
| `ACCESS_TOKEN_TTL`  | `15m`                     | Vigencia del JWT de acceso (`s`, `m`, `h` o `d`) |
| `REFRESH_TOKEN_TTL` | `30d`                     | Vigencia del token de renovación                 |
| `CORS_ORIGINS`      | `http://localhost:5173`   | Orígenes permitidos, separados por comas         |
| `LOG_LEVEL`         | `info`                    | Nivel de logs                                    |

Variables adicionales, todas con valor por defecto:

| Variable                 | Defecto       | Uso                                                            |
| ------------------------ | ------------- | -------------------------------------------------------------- |
| `TRUST_PROXY`            | `false`       | Póngala en `true` solo detrás de un balanceador o CDN          |
| `RATE_LIMIT_MAX`         | `100`         | Peticiones por IP y ventana en el resto de la API              |
| `RATE_LIMIT_WINDOW`      | `1m`          | Ventana del límite general                                     |
| `AUTH_RATE_LIMIT_MAX`    | `10`          | Peticiones a `/auth/register` y `/auth/login` por IP y ventana |
| `AUTH_RATE_LIMIT_WINDOW` | `15m`         | Ventana del límite de autenticación                            |
| `ENABLE_DOCS`            | según entorno | Documentación OpenAPI en `/docs`; activa salvo en producción   |
| `REDIS_URL`              | sin definir   | Almacén compartido de la limitación de tasa entre instancias   |

Cambie `JWT_ACCESS_SECRET` antes de iniciar. Puede generar uno con `openssl rand -base64 48`.
En producción el arranque falla si conserva un secreto de ejemplo o si `CORS_ORIGINS` es `*`.

`TRUST_PROXY` importa para la seguridad: si la API queda detrás de un proxy y no
se activa, la limitación por IP verá siempre la del proxy y tratará a todos los
clientes como uno solo. Si se activa sin que haya un proxy de confianza delante,
cualquiera puede falsear su IP con una cabecera `X-Forwarded-For`.

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
pnpm test:integration
pnpm build
```

`pnpm test` cubre la lógica pura (adaptación y puntuación). `pnpm test:integration`
levanta la API completa sobre la base de `TEST_DATABASE_URL` y cubre autenticación,
ciclo de sesión, aislamiento entre cuentas, el flujo de intentos y el formato de los
errores de protocolo. Ambas suites y la compilación se ejecutan en GitHub Actions en
cada push y pull request.

Con la documentación activa, el explorador OpenAPI queda en `http://localhost:3000/docs`.

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
export REFRESH_TOKEN=$(printf '%s' "$LOGIN_RESPONSE" | jq -r '.data.refreshToken')
```

El acceso dura 15 minutos; la interfaz debe renovarlo con el token de renovación,
que rota en cada uso. Consultar la cuenta activa, renovar y cerrar sesión:

```bash
curl -sS -H "Authorization: Bearer $ACCESS_TOKEN" "$API_URL/api/v1/auth/me" | jq

REFRESHED=$(curl -sS -X POST "$API_URL/api/v1/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}")
export ACCESS_TOKEN=$(printf '%s' "$REFRESHED" | jq -r '.data.accessToken')
export REFRESH_TOKEN=$(printf '%s' "$REFRESHED" | jq -r '.data.refreshToken')

curl -sS -X POST "$API_URL/api/v1/auth/logout" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}" -o /dev/null -w '%{http_code}\n'
```

Cada renovación invalida el token anterior. Si alguien vuelve a presentar uno ya
rotado, se interpreta como credencial robada y se revoca toda la cadena de
sesiones nacida de ese inicio de sesión, no solo ese token.

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

Para abandonar un intento en curso en lugar de completarlo:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "$API_URL/api/v1/learners/$LEARNER_ID/attempts/$ATTEMPT_ID/abandon" | jq
```

La puntuación se calcula en el servidor como respuestas correctas entre **pasos
evaluables de la actividad**, multiplicado por 100. Los pasos evaluables que
quedaron sin responder cuentan como incorrectos, de modo que responder solo uno y
completar no otorga la nota máxima. Los pasos sin contrato de evaluación no entran
ni en el numerador ni en el denominador. Las bandas son 1 estrella para 0–49, 2
para 50–79 y 3 para 80–100. El cliente no envía el resultado final.

Iniciar un intento sobre una actividad que ya tiene otro en curso devuelve el
existente con `200` en lugar de crear uno nuevo con `201`; así el progreso no se
reparte entre registros duplicados.

Para comprobar el aislamiento, registre una segunda cuenta y repita una consulta con el `LEARNER_ID` anterior usando su token; esa cuenta no debe obtener los datos del estudiante.

## Seguridad incluida

- Contraseñas con argon2id (19 MiB, `t=2`, `p=1`), según la recomendación de OWASP.
- Cabeceras de seguridad mediante `@fastify/helmet`.
- Limitación de tasa por IP, con una cuota mucho más estricta en `/auth/register` y
  `/auth/login`: cada llamada ejecuta argon2id y sin límite serían un vector de
  fuerza bruta y de agotamiento de memoria.
- CORS restringido a la lista de `CORS_ORIGINS`; `*` está prohibido en producción.
- Los errores nunca reenvían el mensaje interno: se responde un sobre propio con
  código, mensaje e identificador de petición.
- El registro no revela si un correo ya existe y los recursos ajenos responden
  `404`, no `403`, para no permitir enumeración.
- Las URL de contenido se normalizan antes de salir: solo se emiten rutas propias
  o `http`/`https`, nunca `javascript:` ni `data:`.
- Los registros ocultan `authorization`, `cookie` y cualquier campo de contraseña.

## Limitaciones conocidas

- Es un prototipo local, sin frontend, despliegue productivo, panel administrativo ni gestión del catálogo por API.
- No incluye recuperación de contraseña, verificación de correo ni autenticación externa.
- El JWT de acceso no se puede revocar antes de que expire, pero dura 15 minutos y
  la renovación sí es revocable. Desactivar la cuenta (`isActive`) corta el acceso
  de inmediato, porque se comprueba en cada petición.
- Sin `REDIS_URL`, la limitación de tasa cuenta por proceso: correcta con una sola
  instancia, insuficiente con varias réplicas.
- Los listados de actividades y estudiantes no están paginados.
- Cada estudiante pertenece a la cuenta adulta que lo creó; no hay funciones para compartirlo con otras cuentas.
- PostgreSQL cubre la concurrencia, pero alta disponibilidad, copias de seguridad y retención siguen siendo trabajo de infraestructura, no del repositorio.
- El catálogo contiene solo las cinco actividades del seed; no hay archivos multimedia generados.
- La adaptación solo cambia opciones de presentación. No usa IA ni ofrece recomendaciones médicas.
- La evaluación acepta únicamente respuestas deterministas compatibles con el contenido sembrado.
- Las pruebas son deliberadamente enfocadas al flujo principal, no exhaustivas.

## Pendiente antes de producción

- Copias de seguridad, retención y alta disponibilidad de la base de datos.
- `REDIS_URL` configurado si se despliega más de una instancia.
- Verificación de correo y recuperación de contraseña.
- Tratamiento de datos de menores: consentimiento parental, minimización, derecho
  de supresión, cifrado en reposo y registro de auditoría de accesos. Los perfiles
  de apoyo educativo son categoría sensible y conviene resolverlo antes de crecer.
- Observabilidad: métricas, trazas y alertas.
