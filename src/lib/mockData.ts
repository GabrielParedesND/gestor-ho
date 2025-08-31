import type { User, UserRole, Period, Vote, Tally, InnovationPoint, Initiative, HomeOfficeGrant } from './supabase';

// Datos simulados para desarrollo
export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin Usuario',
    email: 'admin@example.com',
    role: 'ADMIN' as UserRole,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Manager Usuario',
    email: 'manager@example.com',
    role: 'MANAGER' as UserRole,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Dev Leader',
    email: 'dev@example.com',
    role: 'LEADER_DEV' as UserRole,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'PO Leader',
    email: 'po@example.com',
    role: 'LEADER_PO' as UserRole,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Miembro Usuario',
    email: 'member@example.com',
    role: 'MEMBER' as UserRole,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockPeriods: Period[] = [
  {
    id: '1',
    week_label: 'Semana 1 - Enero 2024',
    start_date: '2024-01-01',
    end_date: '2024-01-07',
    status: 'VOTING',
    timezone: 'America/Mexico_City',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockVotes: Vote[] = [
  {
    id: '1',
    period_id: '1',
    voter_id: '2',
    target_user_id: '3',
    weight: 5,
    comment: 'Excelente trabajo en el proyecto',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockTallies: Tally[] = [
  {
    id: '1',
    period_id: '1',
    user_id: '3',
    raw_votes: 5,
    counted_votes: 5,
    manager_included: true,
    result_days: 2,
    created_at: new Date().toISOString(),
  },
];

export const mockInnovationPoints: InnovationPoint[] = [
  {
    id: '1',
    user_id: '3',
    period_id: '1',
    value: 10,
    reason: 'Implementación de nueva funcionalidad',
    approved_by: '1',
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

export const mockInitiatives: Initiative[] = [
  {
    id: '1',
    user_id: '3',
    period_id: '1',
    type: 'DEV',
    title: 'Mejora en el sistema de autenticación',
    description: 'Implementar autenticación de dos factores',
    status: 'PLANNED',
    approved: true,
    approved_by: '1',
    approved_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const mockGrants: HomeOfficeGrant[] = [
  {
    id: '1',
    user_id: '3',
    period_id: '1',
    days: 2,
    source: 'NORMAL',
    redeemed: false,
    notes: 'Días ganados por votación',
    created_at: new Date().toISOString(),
  },
];

// Simulador de autenticación
export const mockAuth = {
  currentUser: null as User | null,
  
  signIn: async (email: string, password: string) => {
    const user = mockUsers.find(u => u.email === email);
    if (!user) throw new Error('Usuario no encontrado');
    
    // Simular validación de contraseña
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
    
    mockAuth.currentUser = user;
    return { user: { id: user.id, email: user.email }, profile: user };
  },
  
  signOut: async () => {
    mockAuth.currentUser = null;
  },
  
  getCurrentUser: async () => {
    return mockAuth.currentUser;
  },
};