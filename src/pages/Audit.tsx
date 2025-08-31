import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import type { AuditLog, User } from '@prisma/client';

export function Audit() {
  const { user, isManagerOrAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [logs, setLogs] = useState<(AuditLog & { actor?: User })[]>([]);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const auditLogs = await apiClient.getAuditLogs();
      setLogs(auditLogs);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      setLogs([]);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.actor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = !selectedAction || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'VOTE_CAST': return 'success';
      case 'VOTE_REMOVED': return 'warning';
      case 'USER_LOGIN': return 'info';
      case 'INITIATIVE_CREATED': return 'default';
      case 'PERIOD_CLOSED': return 'success';
      default: return 'default';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'VOTE_CAST': return 'Voto Emitido';
      case 'VOTE_REMOVED': return 'Voto Eliminado';
      case 'USER_LOGIN': return 'Inicio de Sesión';
      case 'INITIATIVE_CREATED': return 'Iniciativa Creada';
      case 'PERIOD_CLOSED': return 'Período Cerrado';
      default: return action;
    }
  };

  if (!isManagerOrAdmin) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los managers y administradores pueden acceder a la auditoría.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoría</h1>
        <p className="text-gray-600">
          Registro de actividades del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuario o acción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las acciones</option>
              <option value="VOTE_CAST">Votos Emitidos</option>
              <option value="VOTE_REMOVED">Votos Eliminados</option>
              <option value="USER_LOGIN">Inicios de Sesión</option>
              <option value="INITIATIVE_CREATED">Iniciativas Creadas</option>
              <option value="PERIOD_CLOSED">Períodos Cerrados</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividades</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length > 0 ? (
            <div className="space-y-4">
              {filteredLogs.map((log) => (
                <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <Badge variant={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {log.entity} • {log.entityId}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium">
                          {log.actor?.name || 'Usuario desconocido'}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({log.actor?.email})
                        </span>
                      </div>

                      {log.newValues && (
                        <div className="bg-gray-50 rounded p-2 mt-2">
                          <p className="text-xs text-gray-600 mb-1">Datos:</p>
                          <pre className="text-xs text-gray-800">
                            {JSON.stringify(JSON.parse(log.newValues), null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {safeFormat(log.createdAt || log.created_at, 'PPp')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No se encontraron registros</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}