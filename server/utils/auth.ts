import { Request, Response, NextFunction } from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import { validateDataTypes } from './validation.js';

const prisma = new PrismaClient();

// Extender el tipo Request para incluir usuario autenticado
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        active: boolean;
      };
    }
  }
}

// Middleware de autenticación
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token de autorización requerido',
        code: 'MISSING_TOKEN' 
      });
    }

    const token = authHeader.substring(7);
    
    // En un entorno real, aquí verificarías JWT
    // Por ahora, asumimos que el token es el userId
    if (!validateDataTypes.isValidId(token)) {
      return res.status(401).json({ 
        error: 'Token inválido',
        code: 'INVALID_TOKEN' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: token },
      select: {
        id: true,
        email: true,
        role: true,
        active: true,
        name: true
      }
    });

    if (!user || !user.active) {
      return res.status(401).json({ 
        error: 'Usuario no válido o inactivo',
        code: 'INVALID_USER'
      });
    }

    // Agregar usuario al request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ 
      error: 'Error de autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

// Middleware de autorización por roles
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para esta acción',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Middleware para verificar ownership de recursos
export const requireOwnership = (getUserIdFromParams: (req: Request) => string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED' 
      });
    }

    const resourceUserId = getUserIdFromParams(req);
    
    if (!validateDataTypes.isValidId(resourceUserId)) {
      return res.status(400).json({ 
        error: 'ID de usuario inválido',
        code: 'INVALID_USER_ID' 
      });
    }

    // Admin y Manager pueden acceder a cualquier recurso
    if (['ADMIN', 'MANAGER'].includes(req.user.role)) {
      return next();
    }

    // Otros usuarios solo pueden acceder a sus propios recursos
    if (req.user.id !== resourceUserId) {
      return res.status(403).json({ 
        error: 'Solo puedes acceder a tus propios recursos',
        code: 'OWNERSHIP_REQUIRED' 
      });
    }

    next();
  };
};

// Middleware para logging de seguridad
export const securityLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  // Log de petición
  console.log(`🔒 ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.user?.id || 'anonymous'}`);
  
  // Log de respuesta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    console.log(`🔒 ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    // Log errores de seguridad
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.warn(`⚠️ Security issue: ${req.method} ${req.path} - ${res.statusCode} - User: ${req.user?.id || 'anonymous'} - IP: ${req.ip}`);
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Función para logging de eventos de seguridad específicos
export const logSecurityEvent = (req: Request, event: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  
  console.log(`🔐 SECURITY EVENT [${timestamp}]: ${event}`);
  console.log(`   IP: ${ip}`);
  console.log(`   User-Agent: ${userAgent}`);
  if (data) {
    console.log(`   Data:`, JSON.stringify(data));
  }
  
  // En producción, aquí guardarías en una base de datos de auditoria
  // await prisma.auditLog.create({ ... })
};
