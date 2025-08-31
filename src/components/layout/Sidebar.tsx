import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  Vote, 
  Trophy, 
  Calendar, 
  Users, 
  Settings, 
  FileText,
  Target,
  Award,
  TrendingUp,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['ALL'] },
  { name: 'Votaciones', href: '/voting', icon: Vote, roles: ['LEADER', 'MANAGER', 'ADMIN'] },
  { name: 'Mis Iniciativas', href: '/initiatives', icon: Target, roles: ['LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA', 'MANAGER'] },
  { name: 'Mis Días HO', href: '/grants', icon: Calendar, roles: ['ALL'] },
  { name: 'Calendario HO', href: '/calendar', icon: Calendar, roles: ['MANAGER', 'ADMIN'] },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, roles: ['ALL'] },
  { name: 'Resultados', href: '/results', icon: TrendingUp, roles: ['MANAGER', 'ADMIN'] },
  { name: 'Auditoría', href: '/audit', icon: Shield, roles: ['MANAGER', 'ADMIN'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Períodos', href: '/periods', icon: FileText, roles: ['MANAGER', 'ADMIN'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

export function Sidebar() {
  const { user, isAdmin, isManagerOrAdmin, isLeader } = useAuth();
  const { settings } = useSettings();

  const hasAccess = (roles: string[]) => {
    if (roles.includes('ALL')) return true;
    if (roles.includes('ADMIN') && isAdmin) return true;
    if (roles.includes('MANAGER') && isManagerOrAdmin) return true;
    if (roles.includes('LEADER') && isLeader) return true;
    return roles.includes(user?.role || '');
  };

  const filteredNavigation = navigation.filter(item => hasAccess(item.roles));

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 rounded-lg p-2">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{settings.system_name}</h1>
            <p className="text-sm text-gray-500">Sistema de Votación</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNavigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}