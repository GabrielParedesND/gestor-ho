import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Gift, AlertTriangle, CheckCircle } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { useAuditLog } from '../hooks/useAuditLog';
import { safeFormat } from '../lib/dateUtils';
import { differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';
import type { HomeOfficeGrant, Period } from '@prisma/client';

export function Grants() {
  const { user } = useAuth();
  const { log } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [availableGrants, setAvailableGrants] = useState<(HomeOfficeGrant & { period?: Period })[]>([]);
  const [usedGrants, setUsedGrants] = useState<(HomeOfficeGrant & { period?: Period })[]>([]);
  const [totalDays, setTotalDays] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedGrant, setSelectedGrant] = useState<any>(null);
  const [requestedDate, setRequestedDate] = useState('');

  useEffect(() => {
    if (user) {
      loadGrants();
    }
  }, [user?.id]);

  const loadGrants = async () => {
    if (!user) return;

    try {
      // Available grants
      const available = await apiClient.getUserGrants(user.id, true);
      setAvailableGrants(available);

      // Used grants
      const used = await apiClient.getUserGrants(user.id, false);
      setUsedGrants(used);

      // Calculate stats
      const total = available.reduce((sum: number, grant: any) => sum + grant.days, 0);
      const expiring = available.filter((grant: any) => {
        const expiryDate = grant.expiresAt || grant.expires_at;
        if (!expiryDate) return false;
        try {
          const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
          return daysUntilExpiry <= 7;
        } catch {
          return false;
        }
      }).length;

      setTotalDays(total);
      setExpiringSoon(expiring);

    } catch (error) {
      console.warn('Error loading grants, using fallback');
      setAvailableGrants([]);
      setUsedGrants([]);
      setTotalDays(0);
      setExpiringSoon(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemGrant = async () => {
    if (!selectedGrant || !requestedDate || !user) return;
    
    try {
      await apiClient.redeemGrant(selectedGrant.id, requestedDate, user.id);

      await log({
        action: 'GRANT_REDEEMED',
        entity: 'home_office_grant',
        entityId: selectedGrant.id,
        newValues: { requestedDate },
      });

      toast.success(`Grant utilizado para el ${requestedDate}`);
      setShowRedeemModal(false);
      setSelectedGrant(null);
      setRequestedDate('');
      loadGrants();
    } catch (error: any) {
      console.error('Error redeeming grant:', error);
      const errorMessage = error.message || 'Error al utilizar el grant';
      toast.error(errorMessage);
    }
  };
  
  const openRedeemModal = (grant: any) => {
    setSelectedGrant(grant);
    setShowRedeemModal(true);
    // Sugerir fecha de mañana por defecto
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRequestedDate(tomorrow.toISOString().split('T')[0]);
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      'NORMAL': 'Votación',
      'SPECIAL': 'Voto Especial',
      'POINTS': 'Puntos',
      'BONUS': 'Bonus',
    };
    return labels[source as keyof typeof labels] || source;
  };

  const getSourceColor = (source: string) => {
    const colors = {
      'NORMAL': 'success',
      'SPECIAL': 'warning',
      'POINTS': 'info',
      'BONUS': 'error',
    };
    return colors[source as keyof typeof colors] as any || 'default';
  };

  const getDaysUntilExpiry = (expiresAt: Date | null) => {
    if (!expiresAt) return null;
    return differenceInDays(expiresAt, new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mis Días de Home Office</h1>
        <p className="text-gray-600">
          Gestiona tus grants de días de Home Office disponibles y utilizados
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center space-x-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalDays}</p>
              <p className="text-sm text-gray-600">Días disponibles</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{expiringSoon}</p>
              <p className="text-sm text-gray-600">Por vencer pronto</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center space-x-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{usedGrants.length}</p>
              <p className="text-sm text-gray-600">Grants utilizados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available grants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-green-500" />
            <span>Grants Disponibles</span>
            {expiringSoon > 0 && (
              <Badge variant="warning">
                {expiringSoon} vencen pronto
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availableGrants.length > 0 ? (
            <div className="space-y-4">
              {availableGrants.map((grant) => {
                const daysUntilExpiry = getDaysUntilExpiry(grant.expiresAt);
                const isExpiringSoon = grant.expiresAt ? differenceInDays(grant.expiresAt, new Date()) <= 7 : false;
                
                return (
                  <div 
                    key={grant.id} 
                    className={`p-4 border rounded-lg ${
                      isExpiringSoon ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="bg-green-100 rounded-full px-3 py-1">
                            <span className="text-green-800 font-bold">{grant.days} día{grant.days > 1 ? 's' : ''}</span>
                          </div>
                          
                          <Badge variant={getSourceColor(grant.source)}>
                            {getSourceLabel(grant.source)}
                          </Badge>
                          
                          {grant.period && (
                            <span className="text-sm text-gray-500">
                              {grant.period.weekLabel || grant.period.week_label}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          {(grant.expiresAt || grant.expires_at) && (
                            <>
                              <span>
                                Vence: {safeFormat(grant.expiresAt || grant.expires_at, 'PPP')}
                              </span>
                              {daysUntilExpiry !== null && (
                                <span>
                                  ({daysUntilExpiry} días restantes)
                                </span>
                              )}
                              {isExpiringSoon && (
                                <div className="flex items-center space-x-1 text-yellow-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Vence pronto</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        {grant.notes && (
                          <p className="mt-2 text-sm text-gray-600">{grant.notes}</p>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => openRedeemModal(grant)}
                        className="ml-4"
                      >
                        Usar Grant
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No tienes grants disponibles</p>
              <p className="text-sm">Los grants aparecerán aquí cuando los obtengas a través de votaciones</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Used grants history */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Grants Utilizados</CardTitle>
        </CardHeader>
        <CardContent>
          {usedGrants.length > 0 ? (
            <div className="space-y-3">
              {usedGrants.slice(0, 10).map((grant) => (
                <div key={grant.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-gray-200 rounded-full px-2 py-1">
                        <span className="text-gray-700 font-medium text-sm">{grant.days}d</span>
                      </div>
                      
                      <Badge variant="default" size="sm">
                        {getSourceLabel(grant.source)}
                      </Badge>
                      
                      {grant.period && (
                        <span className="text-sm text-gray-500">
                          {grant.period.weekLabel || grant.period.week_label}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-right text-sm text-gray-600">
                      {(grant.redeemedAt || grant.redeemed_at) && (
                        <p>Utilizado: {safeFormat(grant.redeemedAt || grant.redeemed_at)}</p>
                      )}
                    </div>
                  </div>
                  
                  {grant.notes && (
                    <p className="mt-2 text-sm text-gray-600">{grant.notes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No has utilizado grants aún</p>
              <p className="text-sm">El historial aparecerá cuando uses tus grants</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal para seleccionar fecha */}
      <Modal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        title="Solicitar Día de Home Office"
      >
        <div className="space-y-4">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedGrant?.days} día{selectedGrant?.days > 1 ? 's' : ''} de Home Office
            </h3>
            <p className="text-gray-600">
              Selecciona la fecha en que deseas trabajar desde casa
            </p>
          </div>
          
          <Input
            label="Fecha solicitada"
            type="date"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            required
            min={new Date().toISOString().split('T')[0]}
          />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Importante:</p>
                <p>Tu manager será notificado de esta solicitud y la fecha aparecerá en los registros de auditoría.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowRedeemModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleRedeemGrant}
              disabled={!requestedDate}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Solicitar Día
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}