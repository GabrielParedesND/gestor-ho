import { apiClient } from './api';
import { fallbackAuth } from './fallbackData';
import type { User, UserRole } from '@prisma/client';

export interface AuthUser extends User {
  email: string;
}

// Simulador simple de autenticación (en producción usarías JWT, sessions, etc.)
const SESSION_KEY = 'homeoffice_session';

let currentUser: AuthUser | null = null;

// Cargar sesión desde localStorage al inicializar
if (typeof window !== 'undefined') {
  const savedSession = localStorage.getItem(SESSION_KEY);
  if (savedSession) {
    try {
      currentUser = JSON.parse(savedSession);
    } catch (error) {
      localStorage.removeItem(SESSION_KEY);
    }
  }
}

export const authService = {
  async signIn(email: string, password: string) {
    try {
      const result = await apiClient.signIn(email, password);
      currentUser = result.profile;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      return result;
    } catch (error) {
      console.warn('Servidor no disponible, usando datos de respaldo:', error);
      // Usar datos de respaldo si el servidor no está disponible
      const result = await fallbackAuth.signIn(email, password);
      currentUser = result.profile;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      return result;
    }
  },

  async signUp(email: string, password: string, userData: { name: string; role?: UserRole }) {
    try {
      const user = await apiClient.createUser({
        name: userData.name,
        email,
        role: userData.role || 'MEMBER',
      });
      
      return { user };
    } catch (error) {
      throw new Error('Registro no disponible en modo de respaldo');
    }
  },

  async signOut() {
    currentUser = null;
    localStorage.removeItem(SESSION_KEY);
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    return currentUser;
  },

  async updateProfile(updates: Partial<User>) {
    if (!currentUser) throw new Error('No hay usuario autenticado');
    
    try {
      const updatedUser = await apiClient.updateUser(currentUser.id, updates);
      currentUser = updatedUser;
      localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
      return updatedUser;
    } catch (error) {
      throw new Error('Actualización de perfil no disponible en modo de respaldo');
    }
  },

  // Role checking utilities
  isAdmin(user: AuthUser | null): boolean {
    return user?.role === 'ADMIN';
  },

  isManagerOrAdmin(user: AuthUser | null): boolean {
    return user?.role === 'ADMIN' || user?.role === 'MANAGER';
  },

  isLeader(user: AuthUser | null): boolean {
    return user?.role === 'LEADER_DEV' || 
           user?.role === 'LEADER_PO' || 
           user?.role === 'LEADER_INFRA';
  },

  canVote(user: AuthUser | null): boolean {
    return user?.role === 'MANAGER' || 
           user?.role === 'LEADER_DEV' || 
           user?.role === 'LEADER_PO' || 
           user?.role === 'LEADER_INFRA';
  },
};