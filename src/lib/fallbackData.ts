// Datos de respaldo cuando el servidor no está disponible
let fallbackInitiativeStorage: any[] = [];
export const fallbackUsers = [
  {
    id: '1',
    name: 'Admin Usuario',
    email: 'admin@example.com',
    role: 'ADMIN',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Manager Usuario',
    email: 'manager@example.com',
    role: 'MANAGER',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Dev Leader',
    email: 'dev@example.com',
    role: 'LEADER_DEV',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'PO Leader',
    email: 'po@example.com',
    role: 'LEADER_PO',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Miembro Usuario',
    email: 'member@example.com',
    role: 'MEMBER',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Líder Infra',
    email: 'infra@example.com',
    role: 'LEADER_INFRA',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: 'Desarrollador Junior',
    email: 'dev.junior@example.com',
    role: 'MEMBER',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: 'Desarrollador Senior',
    email: 'dev.senior@example.com',
    role: 'MEMBER',
    active: true,
    createdAt: new Date(),
    created_at: new Date().toISOString(),
    updatedAt: new Date(),
    updated_at: new Date().toISOString(),
  },
];

export const fallbackPeriods = [
  {
    id: '1',
    weekLabel: 'Semana 1 - Enero 2024',
    week_label: 'Semana 1 - Enero 2024', // Para compatibilidad
    startDate: new Date('2024-01-01'),
    start_date: new Date('2024-01-01').toISOString(), // Para compatibilidad
    endDate: new Date('2024-01-07'),
    end_date: new Date('2024-01-07').toISOString(), // Para compatibilidad
    status: 'VOTING',
    timezone: 'America/Mexico_City',
    createdAt: new Date(),
    created_at: new Date().toISOString(), // Para compatibilidad
    updatedAt: new Date(),
    updated_at: new Date().toISOString(), // Para compatibilidad
  },
];

export const fallbackInitiatives = [
  {
    id: '1',
    userId: '3',
    user_id: '3', // Para compatibilidad
    periodId: '1',
    period_id: '1', // Para compatibilidad
    type: 'DEV',
    title: 'Mejora en el sistema de autenticación',
    description: 'Implementar autenticación de dos factores para mayor seguridad',
    status: 'PLANNED',
    approved: true,
    approvedBy: '1',
    approved_by: '1', // Para compatibilidad
    approvedAt: new Date(),
    approved_at: new Date().toISOString(), // Para compatibilidad
    createdAt: new Date(),
    created_at: new Date().toISOString(), // Para compatibilidad
    updatedAt: new Date(),
    updated_at: new Date().toISOString(), // Para compatibilidad
  },
];

export const fallbackAuth = {
  signIn: async (email: string, password: string) => {
    const user = fallbackUsers.find(u => u.email === email);
    if (!user) throw new Error('Usuario no encontrado');
    
    const validPasswords: Record<string, string> = {
      'admin@example.com': 'Admin123!',
      'manager@example.com': 'Manager123!',
      'dev@example.com': 'Dev123!',
      'po@example.com': 'Po123!',
      'member@example.com': 'Member123!',
    };
    
    if (validPasswords[email] !== password) {
      throw new Error('Contraseña incorrecta');
    }
    
    return { 
      user: { id: user.id, email: user.email }, 
      profile: {
        ...user,
        teamId: null,
        avatarUrl: null,
      }
    };
  },
  
  // Funciones para manejar iniciativas en modo de respaldo
  getUserInitiatives: async (userId: string) => {
    return [...fallbackInitiatives, ...fallbackInitiativeStorage].filter(i => 
      (i.userId || i.user_id) === userId
    );
  },
  
  createInitiative: async (data: any) => {
    const newInitiative = {
      id: Date.now().toString(),
      ...data,
      status: 'DRAFT',
      approved: false,
      createdAt: new Date(),
      created_at: new Date().toISOString(),
      updatedAt: new Date(),
      updated_at: new Date().toISOString(),
    };
    fallbackInitiativeStorage.push(newInitiative);
    return newInitiative;
  }
};