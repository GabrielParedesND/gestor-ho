# Sistema de Incentivo de Home Office

Un sistema completo de votaciones semanales para otorgar días de Home Office, con gestión de usuarios, períodos, iniciativas y auditoría.

## 🚀 Características

- **Autenticación**: Sistema de login con diferentes roles (Admin, Manager, Líderes, Miembros)
- **Votaciones**: Sistema de votación semanal para otorgar días de Home Office
- **Dashboard**: Panel principal con estadísticas y resumen personalizado
- **Gestión de Usuarios**: CRUD completo de usuarios (solo admins)
- **Períodos**: Gestión de períodos de votación
- **Iniciativas**: Los líderes pueden proponer mejoras e innovaciones
- **Grants**: Gestión de días de Home Office otorgados
- **Leaderboard**: Clasificaciones de puntos de innovación y días otorgados
- **Auditoría**: Registro completo de actividades del sistema
- **Configuración**: Panel de configuración del sistema

## 🛠️ Tecnologías

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Base de datos**: SQLite + Prisma ORM
- **UI**: Componentes personalizados con Tailwind CSS
- **Iconos**: Lucide React

## 📦 Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd project-2
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar la base de datos**
```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear la base de datos y aplicar el schema
npx prisma db push

# Poblar con datos iniciales
npm run db:seed
```

## 🚀 Ejecución

### Opción 1: Ejecutar todo el sistema (Recomendado)
```bash
npm run dev:full
```
Esto ejecuta tanto el servidor backend (puerto 3001) como el frontend (puerto 5173).

### Opción 2: Solo frontend (modo de respaldo)
```bash
npm run dev
```
El frontend funcionará con datos de respaldo si el servidor no está disponible.

### Opción 3: Solo servidor
```bash
npm run server
```

## 👥 Usuarios de Prueba

El sistema viene con usuarios predefinidos:

| Email | Contraseña | Rol |
|-------|------------|-----|
| admin@example.com | Admin123! | Administrador |
| manager@example.com | Manager123! | Manager |
| dev@example.com | Dev123! | Líder Dev |
| po@example.com | Po123! | Líder PO |
| member@example.com | Member123! | Miembro |

## 🔧 Scripts Disponibles

- `npm run dev` - Ejecutar solo el frontend
- `npm run server` - Ejecutar solo el servidor
- `npm run dev:full` - Ejecutar frontend y servidor simultáneamente
- `npm run build` - Construir para producción
- `npm run db:seed` - Poblar la base de datos con datos iniciales
- `npm run db:reset` - Resetear y repoblar la base de datos

## 📁 Estructura del Proyecto

```
project-2/
├── prisma/
│   ├── schema.prisma      # Schema de la base de datos
│   └── seed.ts           # Datos iniciales
├── server/
│   └── index.ts          # Servidor Express
├── src/
│   ├── components/       # Componentes React
│   ├── contexts/         # Contextos de React
│   ├── hooks/           # Hooks personalizados
│   ├── lib/             # Utilidades y configuración
│   ├── pages/           # Páginas de la aplicación
│   └── services/        # Servicios de API
└── dev.db              # Base de datos SQLite
```

## 🎯 Funcionalidades por Rol

### Administrador
- Acceso completo a todas las funcionalidades
- Gestión de usuarios y períodos
- Configuración del sistema
- Auditoría completa

### Manager
- Participación en votaciones
- Visualización de resultados
- Acceso a auditoría
- Dashboard personalizado

### Líderes (Dev/PO/Infra)
- Participación en votaciones
- Creación de iniciativas
- Dashboard personalizado
- Visualización de leaderboard

### Miembros
- Visualización de dashboard
- Gestión de sus grants
- Visualización de leaderboard

## 🔄 Flujo de Votación

1. **Creación de Período**: Los admins crean períodos semanales
2. **Votación**: Managers y líderes votan por miembros del equipo
3. **Cálculo**: El sistema calcula automáticamente los días otorgados
4. **Grants**: Se crean grants de días de Home Office
5. **Uso**: Los usuarios pueden usar sus días otorgados

## 🛡️ Seguridad

- Autenticación basada en roles
- Validación de permisos en cada acción
- Registro de auditoría completo
- Validación de datos en frontend y backend

## 📊 Base de Datos

El sistema utiliza SQLite con Prisma ORM. El schema incluye:

- **Users**: Usuarios del sistema
- **Periods**: Períodos de votación
- **Votes**: Votos emitidos
- **Candidates**: Candidatos por período
- **Tallies**: Resultados calculados
- **HomeOfficeGrants**: Días otorgados
- **Initiatives**: Propuestas de mejora
- **InnovationPoints**: Puntos de innovación
- **AuditLogs**: Registro de actividades
- **Settings**: Configuración del sistema

## 🚨 Solución de Problemas

### El frontend muestra pantalla en blanco
1. Verifica que el servidor esté ejecutándose en el puerto 3001
2. Revisa la consola del navegador para errores
3. Usa `npm run dev` para ejecutar solo el frontend con datos de respaldo

### Error de conexión a la base de datos
1. Ejecuta `npx prisma db push` para crear la base de datos
2. Ejecuta `npm run db:seed` para poblar con datos iniciales

### El servidor no inicia
1. Verifica que todas las dependencias estén instaladas
2. Asegúrate de que el puerto 3001 esté disponible
3. Revisa los logs del servidor para errores específicos

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.