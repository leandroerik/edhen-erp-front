# 🛍️ edhen POS — Sistema de Punto de Venta & Gestión de Stock

Sistema integral de punto de venta (POS), control de inventario, gestión de clientes, logística y configuración para tienda de indumentaria **edhen**.

---

## 📁 Estructura del Repositorio

El proyecto está organizado en una arquitectura desacoplada:

```text
proyectos/
├── edhen-pos-back/        # Backend API REST (Java 21 / Spring Boot 3.4.3)
├── edhen-pos-front/       # Frontend SPA (React 19 / TypeScript / Vite / TailwindCSS)
├── edhen-pos/             # Distribución empaquetada (JAR standalone + scripts de inicio)
├── data/                  # Base de datos persistente H2 en archivo local
├── backups/               # Copias de seguridad SQL automáticas y manuales
├── ESTADO-PROYECTO.md     # Estado detallado de módulos, features y backlog
├── GUIA_DE_EJECUCION.md   # Guía paso a paso para levantar el sistema y ver la BD
├── build.ps1              # Script de compilación y empaquetado del sistema completo
└── build-desktop.ps1      # Script de compilación para distribución de escritorio
```

---

## ⚡ Inicio Rápido

Para ver las instrucciones detalladas de ejecución, revisa **[`GUIA_DE_EJECUCION.md`](./GUIA_DE_EJECUCION.md)**.

### 1. Iniciar Backend
```powershell
cd edhen-pos-back
.\run.bat    # o .\mvnw.cmd spring-boot:run
```
> API disponible en: `http://localhost:8080`  
> Consola web de base de datos H2: `http://localhost:8080/h2-console`

### 2. Iniciar Frontend
```powershell
cd edhen-pos-front
npm install
npm run dev
```
> Aplicación web disponible en: `http://localhost:5173`

---

## 📚 Índice de Documentación

| Documento | Descripción |
|---|---|
| **[`ESTADO-PROYECTO.md`](./ESTADO-PROYECTO.md)** | Estado funcional de todos los módulos, stack técnico y backlog pendiente |
| **[`GUIA_DE_EJECUCION.md`](./GUIA_DE_EJECUCION.md)** | Guía de levantamiento, pruebas y visualización de BD (H2 / Postgres) |
| **[`edhen-pos-back/README.md`](./edhen-pos-back/README.md)** | Documentación técnica del backend y contratos API |
| **[`edhen-pos-back/docs/`](./edhen-pos-back/docs/)** | Arquitectura, modelo de datos, endpoints y roadmap del backend |
| **[`edhen-pos-front/docs/`](./edhen-pos-front/docs/)** | Especificaciones de procesos y flujos del frontend |

---

## 🛠️ Stack Tecnológico

- **Backend**: Java 21, Spring Boot 3.4.3, Spring Data JPA, Flyway, OpenPDF, ZXing, H2 / PostgreSQL.
- **Frontend**: React 19, TypeScript, Vite 8, TailwindCSS v4, React Router 7, Axios, Lucide Icons.
- **Distribución**: Ejecutable local empaquetado mediante scripts PowerShell.
# edhen-erp-front
