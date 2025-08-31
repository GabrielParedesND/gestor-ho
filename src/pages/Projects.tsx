import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FolderOpen, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import toast from 'react-hot-toast';

export function Projects() {
  const { user, isManagerOrAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    if (isManagerOrAdmin) {
      loadProjects();
    }
  }, [isManagerOrAdmin]);

  const loadProjects = async () => {
    try {
      const data = await apiClient.getProjects();
      setProjects(data);
    } catch (error) {
      toast.error('Error al cargar proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProject) {
        await apiClient.updateProject(editingProject.id, formData);
        toast.success('Proyecto actualizado');
      } else {
        await apiClient.createProject({ ...formData, createdBy: user.id });
        toast.success('Proyecto creado');
      }
      
      setShowModal(false);
      resetForm();
      loadProjects();
    } catch (error) {
      toast.error('Error al guardar proyecto');
    }
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status,
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      endDate: project.endDate ? project.endDate.split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este proyecto?')) return;

    try {
      await apiClient.deleteProject(id);
      toast.success('Proyecto eliminado');
      loadProjects();
    } catch (error) {
      toast.error('Error al eliminar proyecto');
    }
  };

  const resetForm = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      status: 'ACTIVE',
      startDate: '',
      endDate: '',
    });
  };

  const getStatusColor = (status: string) => {
    const colors = {
      ACTIVE: 'success',
      COMPLETED: 'info',
      PAUSED: 'warning',
      CANCELLED: 'error',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      ACTIVE: 'Activo',
      COMPLETED: 'Completado',
      PAUSED: 'Pausado',
      CANCELLED: 'Cancelado',
    };
    return labels[status as keyof typeof labels] || status;
  };

  if (!isManagerOrAdmin) {
    return (
      <div className="text-center py-12">
        <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los administradores y managers pueden gestionar proyectos.
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proyectos</h1>
          <p className="text-gray-600">
            Gestiona los proyectos de la organización
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proyecto
        </Button>
      </div>

      {/* Projects grid */}
      <div className="grid gap-6">
        {projects.map((project: any) => (
          <Card key={project.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-3">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <span>{project.name}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(project)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(project.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {project.description && (
                <p className="text-gray-700 mb-4">{project.description}</p>
              )}
              
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                {project.startDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Inicio: {safeFormat(project.startDate, 'PPP')}</span>
                  </div>
                )}
                {project.endDate && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Fin: {safeFormat(project.endDate, 'PPP')}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {projects.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay proyectos
              </h3>
              <p className="text-gray-600 mb-4">
                Crea el primer proyecto para comenzar.
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Proyecto
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre del proyecto"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Nombre del proyecto"
          />

          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción del proyecto..."
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Activo</option>
              <option value="COMPLETED">Completado</option>
              <option value="PAUSED">Pausado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Fecha de inicio"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            />

            <Input
              label="Fecha de fin"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {editingProject ? 'Actualizar' : 'Crear'} Proyecto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}