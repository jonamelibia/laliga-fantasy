# Fantasy Liga Española

Aplicación web para gestionar una liga privada de Fantasy La Liga entre amigos.

## Stack

- **Framework:** [SvelteKit](https://kit.svelte.dev/)
- **Deploy:** [Vercel](https://vercel.com/)
- **Backend:** Google Sheets API
- **Charts:** Chart.js
- **Package Manager:** Bun

## Funcionalidades

- **Dashboard:** Clasificación general, gráficos de evolución, puntos acumulados, multas por jornada
- **Admin CRUD:** Matriz editable de puntuaciones (jugadores × jornadas) con guardado masivo
- **Gestión de Usuarios:** Perfil con nombre, foto de perfil (subida a Google Drive), contraseña
- **Autenticación:** Login por contraseña con cookies httpOnly

## Estructura de Google Sheets

### Pestaña "Puntuaciones"
Matriz donde filas = jugadores, columnas = jornadas (J1 a J38).

### Pestaña "Usuarios"
Columnas: jugador, displayName, photoUrl, password, isAdmin

## Desarrollo

```bash
bun install
bun run dev
```

## Variables de Entorno

Copia `.env.example` a `.env` y configura:

- `GOOGLE_SERVICE_ACCOUNT_JSON`: JSON del service account de Google
- `SPREADSHEET_ID`: ID del Google Spreadsheet

## Deploy en Vercel

1. Conectar el repositorio a Vercel
2. Configurar las variables de entorno en el dashboard de Vercel
3. Deploy automático al hacer push a `main`
