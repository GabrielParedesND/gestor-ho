import { Request, Response, NextFunction } from 'express';

// Tipos para validación
interface ValidationSchema {
  body?: Record<string, (value: any) => boolean>;
  params?: Record<string, (value: any) => boolean>;
}

// Validación de tipos de datos
export const validateDataTypes = {
  isValidId: (id: string): boolean => {
    // Verificar que sea un CUID válido (formato de Prisma)
    const cuidRegex = /^[ck][a-z0-9]{20,32}$/;
    return typeof id === 'string' && cuidRegex.test(id);
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === 'string' && emailRegex.test(email) && email.length <= 255;
  },

  isValidString: (value: any, maxLength: number = 255): boolean => {
    return typeof value === 'string' && value.length <= maxLength && value.trim().length > 0;
  },

  isValidBoolean: (value: any): boolean => {
    return typeof value === 'boolean';
  },

  isValidDate: (value: any): boolean => {
    return value instanceof Date || !isNaN(Date.parse(value));
  },

  isValidEnum: (value: any, allowedValues: string[]): boolean => {
    return typeof value === 'string' && allowedValues.includes(value);
  }
};

// Sanitización de datos
export const sanitizeData = {
  sanitizeString: (value: any): string => {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, 1000); // Limitar longitud máxima
  },

  sanitizeHtml: (value: any): string => {
    if (typeof value !== 'string') return '';
    // Remover caracteres HTML peligrosos
    return value
      .replace(/[<>\"']/g, '')
      .trim()
      .slice(0, 1000);
  },

  sanitizeId: (value: any): string | null => {
    if (typeof value !== 'string') return null;
    const sanitized = value.trim();
    return validateDataTypes.isValidId(sanitized) ? sanitized : null;
  }
};

// Middleware de validación
export const createValidationMiddleware = (schema: ValidationSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];
    
    // Validar body
    if (schema.body) {
      if (!req.body || typeof req.body !== 'object') {
        return res.status(400).json({ 
          error: 'Body requerido',
          code: 'MISSING_BODY'
        });
      }
      
      for (const [field, validator] of Object.entries(schema.body)) {
        const value = req.body[field];
        if (!validator(value)) {
          errors.push(`Campo '${field}' es inválido`);
        }
      }
    }
    
    // Validar params
    if (schema.params) {
      for (const [param, validator] of Object.entries(schema.params)) {
        const value = req.params[param];
        if (!validator(value)) {
          errors.push(`Parámetro '${param}' es inválido`);
        }
      }
    }
    
    if (errors.length > 0) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors,
        code: 'VALIDATION_ERROR'
      });
    }
    
    next();
  };
};

// Esquemas de validación específicos
export const validationSchemas = {
  // Validación para IDs en parámetros
  idParam: {
    params: {
      id: (value: any) => validateDataTypes.isValidId(value)
    }
  },

  periodIdParam: {
    params: {
      periodId: (value: any) => validateDataTypes.isValidId(value)
    }
  },

  userIdParam: {
    params: {
      userId: (value: any) => validateDataTypes.isValidId(value)
    }
  },

  // Validación para crear usuarios
  createUser: {
    body: {
      name: (value: any) => validateDataTypes.isValidString(value, 100),
      email: (value: any) => validateDataTypes.isValidEmail(value),
      password: (value: any) => validateDataTypes.isValidString(value, 72), // bcrypt max length
      role: (value: any) => validateDataTypes.isValidEnum(value, ['ADMIN', 'MANAGER', 'LEADER', 'MEMBER', 'VIEWER']),
      active: (value: any) => value === undefined || validateDataTypes.isValidBoolean(value)
    }
  },

  // Validación para login
  login: {
    body: {
      email: (value: any) => validateDataTypes.isValidEmail(value),
      password: (value: any) => validateDataTypes.isValidString(value, 72)
    }
  },

  // Validación para crear período
  createPeriod: {
    body: {
      weekLabel: (value: any) => validateDataTypes.isValidString(value, 50),
      startDate: (value: any) => validateDataTypes.isValidDate(value),
      endDate: (value: any) => validateDataTypes.isValidDate(value)
    }
  },

  // Validación para crear nominación
  createNomination: {
    body: {
      periodId: (value: any) => validateDataTypes.isValidId(value),
      nominatorId: (value: any) => validateDataTypes.isValidId(value),
      nomineeId: (value: any) => validateDataTypes.isValidId(value),
      reason: (value: any) => validateDataTypes.isValidString(value, 500),
      projectId: (value: any) => value === null || value === undefined || validateDataTypes.isValidId(value),
      category: (value: any) => value === undefined || validateDataTypes.isValidEnum(value, ['TECHNICAL', 'LEADERSHIP', 'COLLABORATION', 'INNOVATION', 'IMPACT']),
      contributionType: (value: any) => value === undefined || validateDataTypes.isValidEnum(value, ['DELIVERY', 'QUALITY', 'IMPROVEMENT', 'SUPPORT', 'EFFICIENCY', 'INITIATIVE'])
    }
  },

  // Validación para votos
  vote: {
    body: {
      periodId: (value: any) => validateDataTypes.isValidId(value),
      voterId: (value: any) => validateDataTypes.isValidId(value),
      targetUserId: (value: any) => validateDataTypes.isValidId(value),
      comment: (value: any) => value === undefined || validateDataTypes.isValidString(value, 200),
      remove: (value: any) => value === undefined || validateDataTypes.isValidBoolean(value)
    }
  }
};

// Rate limiting simple
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const resetTime = now + windowMs;

    if (!requestCounts.has(key)) {
      requestCounts.set(key, { count: 1, resetTime });
      return next();
    }

    const record = requestCounts.get(key)!;
    
    if (now > record.resetTime) {
      // Reset window
      record.count = 1;
      record.resetTime = resetTime;
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({ 
        error: 'Demasiadas peticiones. Intenta de nuevo más tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    record.count++;
    next();
  };
};
