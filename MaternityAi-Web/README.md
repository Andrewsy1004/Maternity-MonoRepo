<div align="center">

# MaternityAI 🤰

**Plataforma de salud materna inteligente con IA**

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)

</div>

---

## Requisitos

| Herramienta | Versión | Verificar |
|:-----------:|:-------:|:---------:|
| **Node.js** | >= 20   | `node -v` |
| **pnpm**    | >= 10   | `pnpm -v` |

> **⚠️ Este proyecto usa pnpm exclusivamente. No uses npm ni yarn.**

<details>
<summary>📥 ¿No tienes pnpm? Click aquí para instalarlo</summary>

```bash
# Opción A — Una sola vez con npm
npm install -g pnpm

# Opción B — Con Corepack (recomendado, viene con Node.js >= 16)
corepack enable
corepack prepare pnpm@latest --activate
```

</details>

---

## Instalación y Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/Anamaury16/MaternityAi-Web.git
cd MaternityAi-Web

# Instalar dependencias
pnpm install

# Iniciar servidor de desarrollo
pnpm dev
```

> La app estará disponible localmente en **http://localhost:3000**

---

## Configuración y Variables de Entorno

El proyecto soporta configuración para apuntar al backend mediante variables de entorno de Vite:

| Variable | Descripción | Valor por Defecto (Desarrollo) |
|---|---|---|
| `VITE_API_URL` | URL base del servidor del backend API (sin barra diagonal final) | `http://localhost:8000` / `http://127.0.0.1:8000` |

> 💡 **Nota**: En desarrollo local, si no defines `VITE_API_URL`, la aplicación usará los valores por defecto locales automáticamente, por lo que no es estrictamente necesario configurar un archivo `.env` en tu máquina de desarrollo.

Para configurar una ruta específica para desarrollo:
1. Crea un archivo `.env.local` en la raíz del proyecto.
2. Define la variable:
   ```env
   VITE_API_URL=http://tu-direccion-ip:8000
   ```

---

## Despliegue con Docker 🐳

El proyecto incluye un archivo `Dockerfile` multi-etapa y un servidor web Nginx seguro y optimizado para servir los archivos estáticos en entornos de producción.

### 1. Construir la imagen de Docker

Puedes compilar la imagen inyectando la URL de tu API de producción mediante `--build-arg`:

```bash
# Construir la imagen apuntando al backend
docker build --build-arg VITE_API_URL=https://api.tu-produccion.com -t maternity-web .
```

### 2. Ejecutar el contenedor

Ejecuta el contenedor exponiendo el puerto HTTP (puerto `80` del contenedor) a tu puerto local deseado (por ejemplo, `8080`):

```bash
docker run -d -p 8080:80 --name maternity-web-app maternity-web
```

La aplicación estará corriendo de forma segura en **http://localhost:8080** servida por un Nginx con cabeceras de seguridad activadas (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, etc.).

---

## Scripts

| Comando | Qué hace |
|---------|----------|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción |
| `pnpm preview` | Preview del build |
| `pnpm lint` | Análisis con ESLint |

---

## Estructura

```
src/
├── api/                  ← Instancia Axios base
├── components/           ← Componentes reutilizables
│   ├── Headers/          Navegación por sección (HeaderActividad, MobileBottomNav)
│   ├── Icons/            Íconos SVG del sistema
│   ├── Modal.tsx         Modal genérico
│   ├── ProtectedRoute.tsx Guard de rutas por rol
│   ├── admin/            Estilos del panel administrativo
│   ├── buttons/          Botones reutilizables
│   ├── info/             Secciones informativas
│   └── profile/          Componente de eliminación de cuenta/perfil
│
├── context/
│   └── AuthContext.tsx    ← Autenticación global y persistencia de roles
│
├── hooks/                ← Custom Hooks (IA, riesgos, etc.)
│
├── pages/                ← Vistas
│   ├── HomePage.tsx      Inicio (pública)
│   ├── UsPage.tsx        Nosotros (pública)
│   ├── Login.tsx         Inicio de sesión
│   ├── Register.tsx      Registro
│   ├── Main.tsx          Dashboard gestante
│   ├── Ai.tsx            Chat con IA
│   ├── Biblioteca.tsx    Recursos educativos
│   ├── Actividad.tsx     Actividades y monitoreo diario
│   ├── UserProfile.tsx   Perfil de usuaria y configuración
│   ├── adminPages/       Vistas de administración (Usuarias, OBA, Preguntas, Citas, Cargas, Checklist, IA)
│   ├── clinicoPages/     Vistas del personal clínico (reutiliza componentes de admin)
│   └── hospitalPages/    Monitoreo de alertas para el rol hospital
│
├── services/             ← Servicios API modulados
│   ├── authService.ts    Autenticación (login, registro de staff)
│   ├── adminService.ts   Endpoints admin y gestión de gestantes
│   ├── m0Service.ts      Servicio M0 (Fórmula obstétrica, antecedentes)
│   ├── m4Service.ts      Servicio M4 (Postparto y anticonceptivos)
│   └── m6Service.ts      Servicio M6 (Alertas y alarmas)
│
├── utils/                ← Utilidades y constantes auxiliares
├── App.tsx               ← Enrutamiento y definición de Layouts/Guards
├── main.tsx              ← Entry point de la aplicación
└── index.css             ← Estilos globales
```

## Roles y rutas

| Rol | Rutas |
|-----|-------|
| 🌐 **Pública** | `/` · `/nosotros` · `/login` · `/register` |
| 🤰 **Gestante** | `/main` · `/ai` · `/biblioteca` · `/actividad` · `/userprofile` |
| 🔧 **Admin** | `/admin/usuarias` · `/admin/citas` · `/admin/oba` · `/admin/preguntas` · `/admin/cargas` · `/admin/checklist` · `/admin/ia` |
| 🩺 **Clínico** | `/clinico/usuarias` · `/clinico/citas` · `/clinico/oba` · `/clinico/preguntas` · `/clinico/cargas` · `/clinico/checklist` · `/clinico/ia` |
| 🏥 **Hospital** | `/hospital/dashboard` |

---

## Stack

| | Tecnología | Uso |
|---|-----------|-----|
| ⚛️ | React 19 | UI |
| 🔷 | TypeScript 5.8 | Tipado |
| ⚡ | Vite 7 + SWC | Bundler |
| 🧭 | React Router 7 | Rutas SPA |
| 📡 | Axios | HTTP Client |
| 📱 | Vite PWA | App instalable |
| 🧹 | ESLint + Prettier | Calidad de código |

---

## Reglas del equipo

| ✅ Hacer | ❌ No hacer |
|----------|-------------|
| `pnpm install` | `npm install` |
| `pnpm add axios` | `npm i axios` |
| `pnpm dev` | `npm run dev` |
| Commitear `pnpm-lock.yaml` | Editar el lockfile manualmente |

---

## Troubleshooting

<details>
<summary>💥 "only-allow: npm is not allowed"</summary>

Intentaste usar npm. Usa `pnpm` en su lugar.
</details>

<details>
<summary>💥 "Cannot find module" después de pull</summary>

```bash
pnpm install
```
</details>

<details>
<summary>💥 La PWA no se actualiza</summary>

DevTools → Application → Service Workers → **Unregister**
</details>

<details>
<summary>💥 Error de versión de pnpm</summary>

```bash
corepack prepare pnpm@latest --activate
```
</details>

---

<div align="center">

**MaternityAI** · Proyecto privado · Todos los derechos reservados

</div>
