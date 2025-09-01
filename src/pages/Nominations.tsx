import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Trash2, Users } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { periodService } from '../services/periodService';
import { safeFormat } from '../lib/dateUtils';
import { CATEGORIES, CONTRIBUTION_TYPES, getCategoryLabel, getContributionTypeLabel } from '../lib/constants';
import toast from 'react-hot-toast';

export function Nominations() {
  const { user, canNominate } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [nominations, setNominations] = useState([]);
  const [members, setMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [contributionType, setContributionType] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Obtener período actual
      const period = await periodService.getCurrentPeriod();
      setCurrentPeriod(period);

      if (period) {
        // Obtener nominaciones del período
        const periodNominations = await apiClient.getNominations(period.id);
        setNominations(periodNominations);
      }

      // Obtener miembros activos y proyectos
      const [users, projectsList] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getProjects()
      ]);
      const activeMembers = users.filter(u => u.active && u.role === 'MEMBER');
      setMembers(activeMembers);
      setProjects(projectsList.filter((p: any) => p.status === 'ACTIVE'));

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleNominate = async () => {
    if (!selectedMember || !reason.trim() || !currentPeriod || !user) return;

    setSubmitting(true);
    try {
      await apiClient.createNomination({
        periodId: currentPeriod.id,
        nominatorId: user.id,
        nomineeId: selectedMember,
        reason: reason.trim(),
        projectId: selectedProject || null,
        category: category || 'COLLABORATION',
        contributionType: contributionType || 'DELIVERY',
      });

      toast.success('Nominación creada exitosamente');
      setShowModal(false);
      setSelectedMember('');
      setSelectedProject('');
      setReason('');
      setCategory('');
      setContributionType('');
      loadData();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al crear nominación';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNomination = async (nominationId: string) => {
    if (!confirm('¿Estás seguro de eliminar esta nominación?')) return;

    try {
      await apiClient.deleteNomination(nominationId);
      toast.success('Nominación eliminada');
      loadData();
    } catch (error) {
      toast.error('Error al eliminar nominación');
    }
  };

  const getAvailableMembers = () => {
    const nominatedIds = nominations
      .filter((n: any) => n.nominator.id === user?.id)
      .map((n: any) => n.nominee.id);

    return members.filter(member => !nominatedIds.includes(member.id));
  };

  const getNominationsByMember = () => {
    // Filtrar solo las nominaciones del usuario actual
    const myNominations = nominations.filter((n: any) => n.nominator.id === user?.id);

    const grouped = myNominations.reduce((acc: any, nomination: any) => {
      const memberId = nomination.nominee.id;
      if (!acc[memberId]) {
        acc[memberId] = {
          member: nomination.nominee,
          nominations: [],
        };
      }
      acc[memberId].nominations.push(nomination);
      return acc;
    }, {});

    return Object.values(grouped);
  };

  if (!canNominate) {
    return (
      <div className="text-center py-12">
        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los managers y líderes pueden nominar miembros.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!currentPeriod) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">No hay período activo</h2>
        <p className="text-gray-600 mt-2">
          No se puede nominar sin un período de votación activo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nominaciones</h1>
          <p className="text-gray-600">
            Nomina miembros para el período: {currentPeriod.weekLabel || currentPeriod.week_label}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} disabled={getAvailableMembers().length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Nominar Miembro
        </Button>
      </div>

      {/* Nominaciones agrupadas por miembro */}
      <div className="grid gap-6">
        {getNominationsByMember().map((group: any) => (
          <Card key={group.member.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {group.member.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <span>{group.member.name}</span>
                    <p className="text-sm text-gray-500 font-normal">{group.member.email}</p>
                  </div>
                </CardTitle>
                <Badge variant="info">
                  {group.nominations.length} nominación{group.nominations.length !== 1 ? 'es' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {group.nominations.map((nomination: any) => (
                  <div key={nomination.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {nomination.nominator.name}
                          </span>
                          <Badge variant="outline" size="sm">
                            {nomination.nominator.role}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {safeFormat(nomination.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">"{nomination.reason}"</p>
                        <div className="flex flex-wrap gap-2">
                          {nomination.project && (
                            <Badge variant="outline" size="sm">
                              {nomination.project.name}
                            </Badge>
                          )}
                          {nomination.category && (
                            <Badge variant="outline" size="sm" className="bg-blue-50 text-blue-700">
                              {getCategoryLabel(nomination.category)}
                            </Badge>
                          )}
                          {nomination.contributionType && (
                            <Badge variant="outline" size="sm" className="bg-purple-50 text-purple-700">
                              {getContributionTypeLabel(nomination.contributionType)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {nomination.nominator.id === user?.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNomination(nomination.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        {getNominationsByMember().length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay nominaciones aún
              </h3>
              <p className="text-gray-600 mb-4">
                Aún no has nominado a ningún miembro para este período.
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Nominación
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de nominación */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nominar Miembro"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar miembro
            </label>
            <select
              value={selectedMember}
              onChange={(e) => setSelectedMember(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona un miembro...</option>
              {getAvailableMembers().map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proyecto (opcional)
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sin proyecto específico</option>
              {projects.map((project: any) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría de contribución (opcional)
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona una categoría...</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de contribución (opcional)
            </label>
            <select
              value={contributionType}
              onChange={(e) => setContributionType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecciona un tipo...</option>
              {CONTRIBUTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Razón de la nominación"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explica por qué nominas a este miembro..."
            rows={3}
            required
          />

          <div className="flex justify-end space-x-3">
            <Button
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleNominate}
              loading={submitting}
              disabled={!selectedMember || !reason.trim()}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Nominar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}