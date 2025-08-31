import React, { useState, useEffect } from 'react';
import { Plus, Target, Calendar, CheckCircle, Clock, AlertCircle, Award, TrendingUp, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import toast from 'react-hot-toast';
import type { Initiative } from '@prisma/client';

export function Initiatives() {
  const { user, isLeader, isManagerOrAdmin } = useAuth();
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [allInitiatives, setAllInitiatives] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const [pointsNeeded, setPointsNeeded] = useState(10);
  const [approvalPoints, setApprovalPoints] = useState(5);
  const [impactPoints, setImpactPoints] = useState(5);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'DEV' as 'DEV' | 'PO' | 'INFRA',
  });

  useEffect(() => {
    if (isLeader) {
      loadInitiatives();
    }
    if (isManagerOrAdmin) {
      loadAllInitiatives();
    }
    if (user) {
      loadUserPoints();
    }
  }, [user, isManagerOrAdmin, isLeader]);

  const loadInitiatives = async () => {
    if (!user) return;
    
    try {
      const userInitiatives = await apiClient.getUserInitiatives(user.id);
      setInitiatives(userInitiatives);
    } catch (error) {
      console.error('Error loading initiatives:', error);
      toast.error('Error al cargar las iniciativas');
      setInitiatives([]);
    }
  };

  const loadAllInitiatives = async () => {
    try {
      const all = await apiClient.getAllInitiatives();
      setAllInitiatives(all);
    } catch (error) {
      console.error('Error loading all initiatives:', error);
      toast.error('Error al cargar iniciativas');
    }
  };

  const loadUserPoints = async () => {
    if (!user) return;
    try {
      const [leaderboard, settings] = await Promise.all([
        apiClient.getPointsLeaderboard(),
        apiClient.getSettings()
      ]);
      
      const userEntry = leaderboard.find((entry: any) => entry.user.id === user.id);
      setUserPoints(userEntry?.availablePoints || 0);
      
      const pointsSetting = settings.find((s: any) => s.key === 'points_for_bonus_day');
      setPointsNeeded(pointsSetting ? JSON.parse(pointsSetting.value) : 10);
      
      const approvalSetting = settings.find((s: any) => s.key === 'points_for_approval');
      setApprovalPoints(approvalSetting ? JSON.parse(approvalSetting.value) : 5);
      
      const impactSetting = settings.find((s: any) => s.key === 'points_for_impact');
      setImpactPoints(impactSetting ? JSON.parse(impactSetting.value) : 5);
    } catch (error) {
      console.error('Error loading points:', error);
    }
  };

  const handleApprove = async (initiativeId: string) => {
    if (!user) return;
    try {
      await apiClient.approveInitiative(initiativeId, user.id, approvalPoints);
      toast.success('Iniciativa aprobada');
      await loadAllInitiatives();
    } catch (error) {
      console.error('Error approving initiative:', error);
      toast.error('Error al aprobar iniciativa');
    }
  };

  const handleStatusChange = async (initiativeId: string, status: string) => {
    if (!user) return;
    try {
      await apiClient.updateInitiativeStatus(initiativeId, status, user.id);
      toast.success('Estado actualizado');
      loadAllInitiatives();
      loadInitiatives();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar estado');
    }
  };

  const handleRedeemPoints = async () => {
    if (!user) return;
    try {
      const settings = await apiClient.getSettings();
      const pointsNeeded = settings.find((s: any) => s.key === 'points_for_bonus_day');
      const points = pointsNeeded ? JSON.parse(pointsNeeded.value) : 10;
      
      await apiClient.redeemPoints(user.id, points);
      toast.success('¡Día de HO canjeado!');
      setShowRedeemModal(false);
      loadUserPoints();
    } catch (error) {
      console.error('Error redeeming points:', error);
      toast.error('Error al canjear puntos');
    }
  };

  const handleReject = async (initiativeId: string) => {
    if (!confirm('¿Estás seguro de que quieres rechazar esta iniciativa?')) return;
    if (!user) return;
    
    try {
      await apiClient.rejectInitiative(initiativeId, user.id);
      toast.success('Iniciativa rechazada');
      await loadAllInitiatives();
    } catch (error) {
      console.error('Error rejecting initiative:', error);
      toast.error('Error al rechazar iniciativa');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const newInitiative = await apiClient.createInitiative({
        userId: user.id,
        type: formData.type,
        title: formData.title,
        description: formData.description,
      });

      setInitiatives([newInitiative, ...initiatives]);
      setShowModal(false);
      setFormData({ title: '', description: '', type: 'DEV' });
      toast.success('Iniciativa creada correctamente');
    } catch (error) {
      console.error('Error creating initiative:', error);
      toast.error('Error al crear la iniciativa');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="h-4 w-4" />;
      case 'PLANNED': return <Target className="h-4 w-4" />;
      case 'ADOPTED': return <CheckCircle className="h-4 w-4" />;
      case 'IMPACTFUL': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'default';
      case 'PLANNED': return 'info';
      case 'ADOPTED': return 'success';
      case 'IMPACTFUL': return 'success';
      default: return 'default';
    }
  };

  if (!isLeader && !isManagerOrAdmin) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los líderes y managers pueden gestionar iniciativas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isManagerOrAdmin ? 'Gestionar Iniciativas' : 'Mis Iniciativas'}
          </h1>
          <p className="text-gray-600">
            {isManagerOrAdmin ? 'Aprueba y gestiona iniciativas del equipo' : 'Gestiona tus propuestas de mejora e innovación'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isLeader && userPoints >= pointsNeeded && (
            <Button variant="success" onClick={() => setShowRedeemModal(true)}>
              <Award className="h-4 w-4 mr-2" />
              Canjear Puntos ({userPoints})
            </Button>
          )}
          {isLeader && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Iniciativa
            </Button>
          )}
        </div>
      </div>

      {/* Panel de Aprobación para Managers/Admins */}
      {isManagerOrAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Iniciativas Pendientes de Aprobación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allInitiatives.filter(i => !i.approved && !i.approvedBy).map((initiative) => (
                <div key={initiative.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{initiative.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{initiative.description}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="outline">{initiative.type}</Badge>
                      <span className="text-sm text-gray-500">Por: {initiative.user.name}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={() => handleApprove(initiative.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aprobar ({approvalPoints} pts)
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleReject(initiative.id)}>
                      <X className="h-4 w-4 mr-1" />
                      Rechazar
                    </Button>
                  </div>
                </div>
              ))}
              {allInitiatives.filter(i => !i.approved).length === 0 && (
                <p className="text-center text-gray-500 py-4">No hay iniciativas pendientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mis Iniciativas (solo para líderes) */}
      {isLeader && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis Iniciativas</h2>
          <div className="grid gap-6">
            {initiatives.length > 0 ? (
              initiatives.map((initiative) => (
            <Card key={initiative.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{initiative.title}</CardTitle>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant={getStatusColor(initiative.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(initiative.status)}
                          <span>{initiative.status}</span>
                        </div>
                      </Badge>
                      <Badge variant="outline">{initiative.type}</Badge>
                      <span className="text-sm text-gray-500">
                        {safeFormat(initiative.createdAt || initiative.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{initiative.description}</p>
                
                {initiative.approved && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">
                          Iniciativa Aprobada
                        </span>
                      </div>
                      {isManagerOrAdmin && initiative.status !== 'IMPACTFUL' && (
                        <div className="flex space-x-2">
                          {initiative.status === 'PLANNED' && (
                            <Button size="sm" variant="ghost" onClick={() => handleStatusChange(initiative.id, 'ADOPTED')}>
                              <TrendingUp className="h-4 w-4 mr-1" />
                              Marcar Adoptada
                            </Button>
                          )}
                          {initiative.status === 'ADOPTED' && (
                            <Button size="sm" variant="success" onClick={() => handleStatusChange(initiative.id, 'IMPACTFUL')}>
                              <Award className="h-4 w-4 mr-1" />
                              Marcar Impactante (+{impactPoints} pts)
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    {(initiative.approvedAt || initiative.approved_at) && (
                      <p className="text-xs text-green-600 mt-1">
                        Aprobada el {safeFormat(initiative.approvedAt || initiative.approved_at)}
                      </p>
                    )}
                  </div>
                )}
                
                {!initiative.approved && initiative.approvedBy && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <X className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Iniciativa Rechazada
                      </span>
                    </div>
                    {(initiative.approvedAt || initiative.approved_at) && (
                      <p className="text-xs text-red-600 mt-1">
                        Rechazada el {safeFormat(initiative.approvedAt || initiative.approved_at)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes iniciativas
              </h3>
              <p className="text-gray-600 mb-4">
                Crea tu primera iniciativa para proponer mejoras e innovaciones.
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Iniciativa
              </Button>
            </CardContent>
          </Card>
        )}
          </div>
        </div>
      )}

      {/* Todas las Iniciativas (solo para managers/admins que no son líderes) */}
      {isManagerOrAdmin && !isLeader && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Todas las Iniciativas</h2>
          <div className="grid gap-6">
            {allInitiatives.map((initiative) => (
              <Card key={initiative.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{initiative.title}</CardTitle>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant={getStatusColor(initiative.status)}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(initiative.status)}
                            <span>{initiative.status}</span>
                          </div>
                        </Badge>
                        <Badge variant="outline">{initiative.type}</Badge>
                        <span className="text-sm text-gray-500">
                          Por: {initiative.user.name} - {safeFormat(initiative.createdAt || initiative.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-4">{initiative.description}</p>
                  
                  {initiative.approved ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Iniciativa Aprobada
                          </span>
                        </div>
                        {initiative.status !== 'IMPACTFUL' && (
                          <div className="flex space-x-2">
                            {initiative.status === 'PLANNED' && (
                              <Button size="sm" variant="ghost" onClick={() => handleStatusChange(initiative.id, 'ADOPTED')}>
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Marcar Adoptada
                              </Button>
                            )}
                            {initiative.status === 'ADOPTED' && (
                              <Button size="sm" variant="success" onClick={() => handleStatusChange(initiative.id, 'IMPACTFUL')}>
                                <Award className="h-4 w-4 mr-1" />
                                Marcar Impactante (+{impactPoints} pts)
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      {(initiative.approvedAt || initiative.approved_at) && (
                        <p className="text-xs text-green-600 mt-1">
                          Aprobada el {safeFormat(initiative.approvedAt || initiative.approved_at)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <span className="text-sm text-yellow-800">Pendiente de aprobación</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {allInitiatives.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No hay iniciativas
                  </h3>
                  <p className="text-gray-600">
                    Los líderes aún no han creado iniciativas.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Iniciativa"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Título de la iniciativa"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="DEV">Desarrollo</option>
              <option value="PO">Product Owner</option>
              <option value="INFRA">Infraestructura</option>
            </select>
          </div>

          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Describe tu iniciativa en detalle..."
            rows={4}
          />

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Crear Iniciativa
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Canje de Puntos */}
      <Modal
        isOpen={showRedeemModal}
        onClose={() => setShowRedeemModal(false)}
        title="Canjear Puntos por Día de Home Office"
      >
        <div className="space-y-4">
          <div className="text-center">
            <Award className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tienes {userPoints} puntos disponibles
            </h3>
            <p className="text-gray-600">
              Puedes canjear {pointsNeeded} puntos por 1 día adicional de Home Office
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">1 Día de Home Office</p>
                <p className="text-sm text-blue-700">Expira en 60 días</p>
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
              onClick={handleRedeemPoints}
              disabled={userPoints < pointsNeeded}
            >
              <Award className="h-4 w-4 mr-2" />
              Canjear {pointsNeeded} Puntos
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}