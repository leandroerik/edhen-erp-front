# Backend en Google Sheets (Google Apps Script) — Edhen ERP

Este directorio contiene el script de backend para conectar **Edhen ERP** con una hoja de cálculo de Google Sheets como base de datos en la nube (sin costos de servidor y accesible desde cualquier dispositivo).

---

## Archivos incluidos

* [`Codigo.gs`](./Codigo.gs): El script en JavaScript para Google Apps Script. Provee la API REST JSON con `doGet` (lectura) y `doPost` (guardado y actualización de registros).

---

## Paso a paso: Cómo crearlo e implementarlo

### 1. Crear o abrir la hoja de cálculo en Google Drive
1. Entrá a [Google Drive](https://drive.google.com).
2. Creá una hoja de cálculo nueva haciendo clic en **Nuevo > Hoja de cálculo de Google** (o podés abrir la planilla de trabajo existente de Textil).
3. Nombrala, por ejemplo: `Edhen ERP - Base de Datos`.

---

### 2. Abrir el editor de Apps Script
1. En el menú superior de la hoja de cálculo, hacé clic en **Extensiones** > **Apps Script**.
2. Se abrirá una pestaña nueva con el editor de código de Google.
3. Arriba a la izquierda podés renombrar el proyecto (ej: `API Edhen ERP`).

---

### 3. Pegar el código
1. En el archivo `Código.gs` que aparece en blanco, borrá la función que viene por defecto (`myFunction`).
2. Copiá todo el contenido de [`Codigo.gs`](./Codigo.gs) de esta carpeta y pegalo allí.
3. Hacé clic en el ícono de **Guardar** (o `Ctrl + S`).

---

### 4. Inicializar las pestañas automáticamente (Solo una vez)
1. En la barra de herramientas del editor, asegurate de tener seleccionada la función **`inicializarHojas`** en el selector de funciones (al lado del botón *Depurar*).
2. Hacé clic en **Ejecutar**.
3. Google te pedirá permisos por primera vez:
   * Hacé clic en **Revisar permisos**.
   * Elegí tu cuenta de Google.
   * Si aparece el aviso *"Google no verificó esta app"*, hacé clic en **Configuración avanzada** (abajo a la izquierda) y luego en **Ir a API Edhen ERP (no seguro)**.
   * Hacé clic en **Permitir**.
4. ¡Listo! Si volvés a tu hoja de cálculo, vas a ver que se crearon automáticamente todas las pestañas con sus columnas de encabezado: `Articulos`, `Cortes`, `Encimadas`, `Compras`, `Talleres`, `Pagos_Talleres`, `Telas`, `Colores`, `Proveedores`.

---

### 5. Publicar la API como Aplicación Web (Web App)
1. En la esquina superior derecha del editor de Apps Script, hacé clic en el botón azul **Implementar** > **Nueva implementación**.
2. En el menú lateral izquierdo (ícono de engranaje ⚙️), elegí el tipo **Aplicación web**.
3. Completá estos 3 campos:
   * **Descripción:** `v1 API ERP`
   * **Ejecutar como:** `Yo (tu correo de Gmail)`
   * **Quién tiene acceso:** **`Cualquiera`** *(Importante: debe ser "Cualquiera" para que el frontend React pueda consultar la API sin trabas de autenticación externa).*
4. Hacé clic en **Implementar**.
5. Se te mostrará una ventana con la **URL de la aplicación web**. Tendrá un formato similar a:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```
6. **Copiá esa URL.**

---

### 6. Probar que funciona
Abrí una pestaña en tu navegador y pegá la URL agregándole al final `?action=bootstrap`:
```
https://script.google.com/macros/s/AKfycbx.../exec?action=bootstrap
```
Deberías ver una respuesta JSON limpia:
```json
{"success":true,"data":{"articulos":[],"cortes":[],"encimadas":[],"compras":[],"talleres":[],"pagos":[],"telas":[],"colores":[],"proveedores":[]}}
```

---

### 7. Conectar con el Frontend
En `edhen-erp-front/.env.development`:
```env
VITE_API_URL=https://script.google.com/macros/s/TU_ID_AQUI/exec
```

¡Con eso la base de datos queda viva en tu Google Drive!

