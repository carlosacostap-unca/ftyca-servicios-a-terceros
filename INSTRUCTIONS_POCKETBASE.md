# Instrucciones de Configuración de PocketBase (Modo Sin Admin SDK)

Has optado por no incluir credenciales de administrador en la aplicación. Esto requiere una configuración específica de las reglas de API (API Rules) en PocketBase para permitir que la aplicación funcione.

## ⚠️ Advertencia de Seguridad
Al abrir estas reglas, ciertas operaciones se vuelven accesibles públicamente. Asegúrate de entender los riesgos. La aplicación valida los datos antes de enviarlos, pero la API de PocketBase quedará expuesta directamente.

## 1. Colección `users` (Usuarios)

Para que NextAuth pueda sincronizar usuarios sin ser admin, necesita poder **Buscar** si un usuario existe y **Crear** uno nuevo si no.

Configura las API Rules de la colección `users` así:

| Acción | Regla | Explicación |
|--------|-------|-------------|
| **List/Search** | `""` (Vacío/Público) | Necesario para que `getFirstListItem` encuentre al usuario por email al hacer login. **Riesgo**: Permite enumerar usuarios. |
| **View** | `""` (Vacío/Público) | Igual que arriba. |
| **Create** | `""` (Vacío/Público) | Permite registrar nuevos usuarios automáticamente al loguearse con Google. |
| **Update** | `id = @request.auth.id` | Solo el usuario dueño puede editarse. (La app no edita perfiles por ahora). |
| **Delete** | `id = @request.auth.id` | Solo el usuario dueño puede borrarse. |

### 🚨 IMPORTANTE: Usuarios Existentes
Si ya tienes usuarios creados (ej. tu propio usuario administrador o de pruebas), **debes activar manualmente `emailVisibility` (Visibilidad de Email)** en el panel de PocketBase.
1. Ve a la colección `users`.
2. Edita el usuario.
3. Activa el interruptor **"Email Visibility"**.

**¿Por qué?**
Sin credenciales de admin, la aplicación no puede buscar usuarios por email si el campo `email` está oculto. Si no activas esto, la aplicación creerá que el usuario no existe, intentará crearlo de nuevo y fallará con error `400 Failed to create record`.

## 2. Colección `services` (Servicios)

Crea la colección `services` con los campos:
- `title` (Text)
- `description` (Text)
- `category` (Select)
- `user` (Relation -> users)

Configura las API Rules así:

| Acción | Regla | Explicación |
|--------|-------|-------------|
| **List/Search** | `""` (Vacío/Público) | Permite listar servicios. La aplicación filtra por `user` en el cliente. |
| **View** | `""` (Vacío/Público) | Permite ver detalles de un servicio. |
| **Create** | `""` (Vacío/Público) | **Crítico**: Necesario para que la Server Action pueda crear el servicio sin token de usuario. La validación de que el usuario es quien dice ser recae en NextAuth. |
| **Update** | `user = @request.auth.id` | Requiere auth de PB (no usado por la app actualmente) o puedes dejarlo restringido. |
| **Delete** | `user = @request.auth.id` | Igual que update. |

### Nota sobre el campo `user` en Create
Asegúrate de que al crear un servicio, PocketBase permita asignar el campo `user` manualmente en una solicitud pública. Generalmente esto funciona si la regla Create es pública.

## Resumen
Con esta configuración, Next.js actúa como un cliente anónimo que interactúa con PocketBase. La seguridad de "quién puede hacer qué" se delega a la validación en el servidor de Next.js (que verifica la sesión de Google) antes de llamar a PocketBase.
