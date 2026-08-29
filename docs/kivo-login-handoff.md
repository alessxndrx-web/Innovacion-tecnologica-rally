# Traspaso: aplicar el diseño "Kivo - Login" al frontend

Documento de entrega para quien aplique el diseño. Todo lo que aquí se afirma
está verificado contra el código y contra el servidor en ejecución. Lo que no se
pudo comprobar aparece marcado como desconocido: **no lo supongas, verifícalo**.

## 1. Objetivo

Aplicar el diseño de Figma "Kivo - Login" a la pantalla de acceso que **ya
existe y ya funciona** contra el backend.

Esto es un trabajo de **capa visual**. La lógica de autenticación está
terminada, verificada y no debe modificarse. Concretamente:

- **SÍ**: colores, tipografía, espaciados, radios, sombras, disposición,
  ilustraciones e iconos del diseño.
- **SÍ**: añadir elementos que el diseño incluya y hoy no existan (logotipo,
  imagen lateral, enlace de "olvidé mi contraseña", casilla de "recordarme"…).
  Si un elemento nuevo implica una llamada al servidor que no está en la
  sección 4, **no la inventes**: déjalo sin conectar y anótalo.
- **NO**: cambiar el cliente HTTP, el manejo de sesión, el mapeo de errores ni
  las rutas.

## 2. Referencia de Figma

```
https://www.figma.com/design/z7Vbxoplp3hAHLqidXF8tW/Kivo---Login?node-id=1-2
fileKey = z7Vbxoplp3hAHLqidXF8tW
nodeId  = 1:2
```

**Aviso importante:** quien redactó este documento **no pudo abrir el diseño**.
Los tres tools de Figma (`get_design_context`, `get_screenshot`,
`get_metadata`) devolvieron el mismo error: el fichero exige acceso de edición y
la cuenta disponible solo tiene asiento _View_. Por tanto **este documento no
describe el diseño**: no contiene colores, medidas ni tipografías de Kivo, y
cualquier afirmación sobre su aspecto sería inventada.

Si tu cuenta sí tiene acceso, léelo directamente. Si también te lo rechaza,
detente y pide acceso de editor en lugar de aproximar el diseño de memoria.

Sobre los recursos gráficos: exporta los iconos e imágenes desde Figma y
compromételos en el repositorio. Las URL de recursos que devuelve la API de
Figma caducan en unos 7 días. No redibujes un icono a mano ni lo sustituyas por
un emoji o un placeholder.

## 3. Estado actual verificado

Frontend en [`web/`](../web): React 19 + Vite 8 + TypeScript en modo estricto
(`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`). Sin librería de
componentes ni framework de CSS: hojas de estilo propias.

| Fichero                             | Responsabilidad                                              |
| ----------------------------------- | ------------------------------------------------------------ |
| `web/src/main.tsx`                  | Punto de entrada, monta `<App/>` en `#root`                  |
| `web/src/App.tsx`                   | Rutas y `AuthProvider`                                       |
| `web/src/styles.css`                | **Todo el aspecto visual**, con tokens en `:root`            |
| `web/src/pages/LoginPage.tsx`       | **La pantalla a rediseñar**                                  |
| `web/src/pages/HomePage.tsx`        | Pantalla mínima tras entrar; prueba que la sesión es real    |
| `web/src/routes/ProtectedRoute.tsx` | Bloquea rutas privadas mientras se comprueba la sesión       |
| `web/src/auth/AuthContext.tsx`      | Estado de sesión (`loading` / `authenticated` / `anonymous`) |
| `web/src/auth/useAuth.ts`           | Hook de acceso al contexto                                   |
| `web/src/auth/session-storage.ts`   | Persistencia en `localStorage`                               |
| `web/src/api/client.ts`             | Cliente HTTP, renovación de token, mapeo de errores          |
| `web/src/api/config.ts`             | Base de la API (`VITE_API_BASE_URL`)                         |

Rutas registradas en `App.tsx`: `/login`, `/` (protegida) y `*` que redirige
a `/`.

## 4. Contrato de la API (verificado contra el servidor)

Base en local: `http://localhost:3000`. El backend acepta el origen
`http://localhost:5173` en CORS, que es el puerto de Vite tanto en `dev` como
en `preview`.

Toda respuesta correcta va envuelta en `{ "data": … }`. Todo error va envuelto
así, **sin excepción**:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "El correo o la contraseña no son válidos.",
    "details": [{ "field": "email", "message": "El correo no es válido." }],
    "requestId": "6b63a0b5-d747-4b15-9108-26f9fc2495fa"
  }
}
```

Endpoints que usa esta pantalla:

| Método y ruta               | Cuerpo                | Respuesta            |
| --------------------------- | --------------------- | -------------------- |
| `POST /api/v1/auth/login`   | `{ email, password }` | `200` con la sesión  |
| `POST /api/v1/auth/refresh` | `{ refreshToken }`    | `200` con la sesión  |
| `POST /api/v1/auth/logout`  | `{ refreshToken }`    | `204` sin cuerpo     |
| `GET /api/v1/auth/me`       | —                     | `200` con el usuario |

La sesión que devuelven `login` y `refresh`:

```json
{
  "data": {
    "accessToken": "…",
    "refreshToken": "…",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "refreshExpiresIn": 2592000,
    "user": {
      "id": "uuid",
      "email": "demo@sinappsis.test",
      "fullName": "Cuenta de demostración",
      "role": "PARENT",
      "avatarUrl": null,
      "isActive": true,
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  }
}
```

Códigos de error que la pantalla de acceso ya trata, con su origen real:

| `code`                | HTTP | Cuándo ocurre                                              |
| --------------------- | ---- | ---------------------------------------------------------- |
| `INVALID_CREDENTIALS` | 401  | Correo o contraseña incorrectos, o cuenta desactivada      |
| `TOO_MANY_REQUESTS`   | 429  | Más de 10 intentos en 15 minutos desde la misma IP         |
| `VALIDATION_ERROR`    | 400  | Datos mal formados; el detalle por campo va en `details[]` |

**No existen** endpoints de registro desde esta pantalla, recuperación de
contraseña ni acceso con proveedores externos. Si el diseño de Kivo muestra
alguno de esos elementos, maquétalo pero **no lo conectes a una ruta
inventada**: no hay backend para ello. Anótalo como pendiente.

## 5. Contrato del CSS

Todo el aspecto está concentrado en `web/src/styles.css`. La vía de menor
riesgo es **sustituir los valores de los tokens y ajustar las reglas**, sin
renombrar clases.

Tokens definidos en `:root`:

```
--color-bg              --color-surface         --color-text
--color-text-muted      --color-border          --color-accent
--color-accent-hover    --color-accent-contrast --color-danger
--color-danger-surface  --font-sans
--radius-md             --radius-lg
--space-xs  --space-sm  --space-md  --space-lg  --space-xl
```

Clases que los componentes usan hoy. Si renombras alguna, **actualiza también
el TSX**; si no, la pantalla se queda sin estilos:

```
auth-layout   auth-card     auth-header   auth-title    auth-subtitle
auth-form     field         field-label   field-input   form-error
button-primary               button-secondary
app-layout    app-card      app-title     detail-list   detail-row
loading-text
```

Requisitos de accesibilidad que ya están puestos y deben sobrevivir al
rediseño: cada `input` tiene su `<label htmlFor>`, el mensaje de error se
anuncia con `role="alert"` y se enlaza por `aria-describedby`, los campos
llevan `autoComplete` (`email` y `current-password`), y hay estilos visibles de
`:focus-visible`. Si sustituyes los `input` por componentes propios, mantén
todo esto.

## 6. Invariantes: no tocar

**6.1 — La renovación del token está serializada a propósito.**
En `web/src/api/client.ts`, la variable `refreshInFlight` garantiza que solo
haya una renovación en curso. No es una optimización. El backend **rota** el
token de renovación en cada uso y, si detecta que uno ya rotado se vuelve a
presentar, lo interpreta como credencial robada y **revoca la cadena entera de
sesiones**. Si dos peticiones caducan a la vez y renuevan en paralelo, envían el
mismo token dos veces y **expulsan al usuario de su propia sesión**. Con un
token de acceso de 15 minutos, esa colisión no es hipotética.

**6.2 — Los errores se distinguen por `code`, nunca por el texto.**
`messageForError` en `LoginPage.tsx` decide sobre `error.code`. El código es
parte del contrato del backend; el mensaje puede cambiar. No compares cadenas de
texto.

**6.3 — La sesión se confirma contra el servidor al arrancar.**
`AuthContext` llama a `GET /auth/me` en lugar de fiarse de `localStorage`, que
puede contener una sesión caducada o revocada desde otro dispositivo.

**6.4 — `ProtectedRoute` no decide durante `loading`.**
Redirigir al login mientras se comprueba la sesión expulsaría en cada recarga a
quien sí tiene sesión válida.

**6.5 — La URL de la API se resuelve en tiempo de compilación.**
Vite incrusta `VITE_API_BASE_URL` en el bundle. Cambiarla exige reconstruir.

## 7. Cómo verificar

Backend en una terminal (necesita PostgreSQL en marcha):

```bash
pnpm db:migrate && pnpm db:seed && pnpm dev
```

Frontend en otra:

```bash
cd web && pnpm dev      # http://localhost:5173
```

Cuenta de prueba ya creada en la base local:

```
demo@sinappsis.test / ClaveSegura2026
```

Antes de dar el trabajo por terminado, estos comandos deben pasar:

```bash
cd web && pnpm typecheck && pnpm build   # sin errores
pnpm lint && pnpm format:check           # desde la raíz
pnpm test && pnpm test:integration       # desde la raíz: 19 y 27 correctas
```

Comprobación manual mínima en el navegador: entrar con la cuenta de prueba y
llegar a la pantalla autenticada; introducir una contraseña incorrecta y ver el
mensaje de credenciales inválidas; recargar la página estando dentro y seguir
dentro.

## 8. Lo que no se sabe

- **El diseño en sí.** No se pudo abrir. Ningún color, medida, tipografía ni
  recurso de Kivo aparece en este documento.
- **Si el diseño incluye pantallas además del login.** El `node-id` entregado
  (`1:2`) es uno solo.
- **Si Kivo trae un sistema de diseño con tokens propios.** Si lo tiene,
  conviene mapearlo a las variables de `:root` en lugar de esparcir valores
  literales por las reglas.
- **El render en navegador de la implementación actual.** Se verificó que los
  módulos compilan, que el build pasa y que la API responde correctamente con
  cabecera `Origin`, pero no se ejecutó un navegador: no había Playwright ni
  chromium-cli en el equipo.
