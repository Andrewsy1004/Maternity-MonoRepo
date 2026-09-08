# ==========================================
# Etapa 1: Construcción (Build Stage)
# ==========================================
FROM node:20-alpine AS build

# Instalar pnpm con la versión específica del proyecto
RUN npm install -g pnpm@10.11.0

WORKDIR /app

# Copiar archivos de definición de dependencias primero para aprovechar la caché de Docker
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias usando --frozen-lockfile para asegurar instalaciones reproducibles y seguras
RUN pnpm install --frozen-lockfile

# Copiar el resto del código fuente del frontend
COPY . .

# Argumento opcional para inyectar la URL de la API durante el build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Compilar la aplicación React/Vite para producción
RUN pnpm run build

# ==========================================
# Etapa 2: Servidor Web (Nginx Stage)
# ==========================================
FROM nginx:1.25-alpine

# Copiar los recursos compilados de la etapa anterior
COPY --from=build /app/dist /usr/share/nginx/html

# Reemplazar la configuración por defecto de Nginx con nuestra versión segura
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer el puerto HTTP estandar
EXPOSE 80

# Iniciar Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
