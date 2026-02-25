# Facultad de Tecnología y Ciencias Aplicadas - Gestión de Servicios a Terceros

## Configuración Inicial

### 1. Variables de Entorno

Antes de iniciar la aplicación, debes configurar las credenciales de Google OAuth.
Abre el archivo `.env.local` y completa los siguientes valores:

```bash
AUTH_SECRET="tu-secreto-generado" # Puedes generar uno con `npx auth secret` o cualquier cadena larga
AUTH_GOOGLE_ID="tu-client-id-de-google"
AUTH_GOOGLE_SECRET="tu-client-secret-de-google"
```

Para obtener las credenciales de Google:
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un nuevo proyecto.
3. Configura la pantalla de consentimiento OAuth.
4. Crea credenciales de tipo "ID de cliente de OAuth".
5. Agrega `http://localhost:3000/api/auth/callback/google` a los URIs de redireccionamiento autorizados.

### 2. Instalación y Ejecución

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.
