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
  Shield,
  FolderOpen,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, roles: ['ALL'] },
  
  // Flujo principal de votación
  { name: 'Nominaciones', href: '/nominations', icon: Users, roles: ['LEADER', 'MANAGER', 'ADMIN'] },
  { name: 'Votaciones', href: '/voting', icon: Vote, roles: ['LEADER', 'MANAGER', 'ADMIN'] },
  { name: 'Resultados', href: '/results', icon: TrendingUp, roles: ['MANAGER', 'ADMIN'] },
  
  // Beneficios y reconocimientos
  { name: 'Mis Días HO', href: '/grants', icon: Calendar, roles: ['LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA', 'MEMBER'] },
  { name: 'Iniciativas', href: '/initiatives', icon: Target, roles: ['LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA', 'MANAGER'] },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy, roles: ['ALL'] },
  
  // Administración
  { name: 'Períodos', href: '/periods', icon: Clock, roles: ['MANAGER', 'ADMIN'] },
  { name: 'Proyectos', href: '/projects', icon: FolderOpen, roles: ['MANAGER', 'ADMIN'] },
  { name: 'Usuarios', href: '/users', icon: Users, roles: ['ADMIN'] },
  { name: 'Auditoría', href: '/audit', icon: Shield, roles: ['MANAGER', 'ADMIN'] },
  { name: 'Configuración', href: '/settings', icon: Settings, roles: ['ADMIN'] },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
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
    <div className={`${isOpen ? 'w-72' : 'w-20 md:w-20 -translate-x-full md:translate-x-0'} ${isOpen ? 'translate-x-0' : ''} bg-white border-r border-gray-200 flex flex-col h-full transition-all duration-300 fixed md:relative z-30 md:z-auto overflow-hidden`}>
      {/* Logo */}
      <div className={`${isOpen ? 'p-6' : 'p-4'} border-b border-gray-200`}>
        <div className="flex items-center justify-center">
          <div className={`bg-blue-600 rounded-lg ${isOpen ? 'p-2' : 'p-1'}`}>
            <Award className={`${isOpen ? 'h-6 w-6' : 'h-4 w-4'} text-white`} />
          </div>
          {isOpen && (
            <div className="ml-3 animate-fade-in">
              <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">{settings.system_name}</h1>
              <p className="text-sm text-gray-500 whitespace-nowrap">Sistema de Votación</p>
            </div>
          )}
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
                'group relative flex items-center rounded-lg text-sm font-medium transition-colors',
                isOpen ? 'px-3 py-2 space-x-3' : 'px-2 py-3 justify-center',
                isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )
            }
          >
            <item.icon className={'h-5 w-5'} />
            {isOpen && <span className="animate-fade-in whitespace-nowrap">{item.name}</span>}
            
            {/* Tooltip para modo colapsado */}
            {!isOpen && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                {item.name}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-gray-200">
        <div className={`group relative flex items-center ${isOpen ? 'space-x-3' : 'justify-center'}`}>
          <div className={`${isOpen ? 'h-8 w-8' : 'h-10 w-10'} bg-gray-300 rounded-full flex items-center justify-center`}>
            <span className={`${isOpen ? 'text-sm' : 'text-base'} font-medium text-gray-700`}>
              {user?.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-gray-900 whitespace-nowrap overflow-hidden text-ellipsis">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 whitespace-nowrap">{user?.role}</p>
            </div>
          )}
          
          {/* Tooltip para usuario en modo colapsado */}
          {!isOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              {user?.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}