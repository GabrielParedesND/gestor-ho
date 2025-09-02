import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/api';

interface SpecialMention {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
}

interface MentionFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  imageUrl: string;
}

const SpecialMentions: React.FC = () => {
  const { user } = useAuth();
  const [mentions, setMentions] = useState<SpecialMention[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMention, setEditingMention] = useState<SpecialMention | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState<MentionFormData>({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    imageUrl: ''
  });

  // Verificar permisos - solo LEADER y MANAGER pueden acceder
  if (!user || !['LEADER', 'MANAGER'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600">No tienes permisos para acceder a las menciones especiales.</p>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadMentions();
  }, []);

  const loadMentions = async () => {
    try {
      setLoading(true);
      const mentions = await apiClient.getSpecialMentions();
      setMentions(mentions);
    } catch (error) {
      console.error('Error loading mentions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMention) {
        // Actualizar mención existente
        const updatedMention = await apiClient.updateSpecialMention(editingMention.id, {
          ...formData,
          userId: user.id
        });
        setMentions(prev => prev.map(m => m.id === editingMention.id ? updatedMention : m));
      } else {
        // Crear nueva mención
        const newMention = await apiClient.createSpecialMention({
          ...formData,
          createdBy: user.id
        });
        setMentions(prev => [newMention, ...prev]);
      }
      
      resetForm();
      setIsModalOpen(false);
    } catch (error: any) {
      console.error('Error saving mention:', error);
      alert(error.response?.data?.error || error.message || 'Error al guardar la mención');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta mención especial?')) {
      return;
    }

    try {
      await apiClient.deleteSpecialMention(id, user.id);
      setMentions(prev => prev.filter(m => m.id !== id));
    } catch (error: any) {
      console.error('Error deleting mention:', error);
      alert(error.response?.data?.error || error.message || 'Error al eliminar la mención');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      imageUrl: ''
    });
    setEditingMention(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo es demasiado grande. Máximo 5MB');
      return;
    }

    try {
      setUploadingImage(true);
      const response = await apiClient.uploadSpecialMentionImage(file);
      setFormData({ ...formData, imageUrl: `http://localhost:3001${response.imageUrl}` });
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(error.message || 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (mention: SpecialMention) => {
    setFormData({
      title: mention.title,
      description: mention.description,
      startDate: mention.startDate.split('T')[0],
      endDate: mention.endDate.split('T')[0],
      imageUrl: mention.imageUrl || ''
    });
    setEditingMention(mention);
    setIsModalOpen(true);
  };

  const canEdit = (mention: SpecialMention) => {
    return mention.createdBy === user.id || user.role === 'MANAGER';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isActive = (mention: SpecialMention) => {
    const now = new Date();
    const start = new Date(mention.startDate);
    const end = new Date(mention.endDate);
    return now >= start && now <= end;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando menciones especiales...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Menciones Especiales</h1>
          <p className="text-gray-600 mt-2">
            Gestiona menciones especiales para mostrar en el leaderboard
          </p>
        </div>
        <Button onClick={openCreateModal}>
          Nueva Mención
        </Button>
      </div>

      {mentions.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-1.414.586H7a4 4 0 01-4-4V7a4 4 0 014-4z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay menciones especiales</h3>
            <p className="text-gray-600 mb-4">Comienza creando tu primera mención especial</p>
            <Button onClick={openCreateModal}>
              Crear Primera Mención
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {mentions.map((mention) => (
            <Card key={mention.id} className="relative">
              <div className="absolute top-4 right-4">
                <Badge variant={isActive(mention) ? 'success' : 'default'}>
                  {isActive(mention) ? 'Activa' : 'Inactiva'}
                </Badge>
              </div>
              
              {mention.imageUrl && (
                <div className="mb-4">
                  <img 
                    src={mention.imageUrl} 
                    alt={mention.title}
                    className="w-full h-48 object-cover rounded-lg"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {mention.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3">
                  {mention.description}
                </p>
                
                <div className="text-sm text-gray-500 space-y-1">
                  <div>
                    <strong>Inicio:</strong> {formatDate(mention.startDate)}
                  </div>
                  <div>
                    <strong>Fin:</strong> {formatDate(mention.endDate)}
                  </div>
                  <div>
                    <strong>Creado por:</strong> {mention.creator.name}
                  </div>
                </div>
              </div>
              
              {canEdit(mention) && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(mention)}
                    className="flex-1"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(mention.id)}
                    className="flex-1"
                  >
                    Eliminar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMention ? 'Editar Mención Especial' : 'Nueva Mención Especial'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="Ej: Reconocimiento del Mes"
          />
          
          <Textarea
            label="Descripción"
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
            required
            placeholder="Describe la mención especial..."
            rows={3}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Fecha de Inicio"
              value={formData.startDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            
            <Input
              type="date"
              label="Fecha de Fin"
              value={formData.endDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagen (opcional)
              </label>
              
              {/* Opción 1: Subir archivo */}
              <div className="mb-3">
                <label className="block text-xs text-gray-600 mb-1">Subir desde tu dispositivo:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                />
                {uploadingImage && (
                  <p className="text-xs text-indigo-600 mt-1">Subiendo imagen...</p>
                )}
              </div>
              
              {/* Divider */}
              <div className="flex items-center my-3">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-3 text-xs text-gray-500 bg-white">o</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>
              
              {/* Opción 2: URL externa */}
              <div>
                <label className="block text-xs text-gray-600 mb-1">URL de imagen externa:</label>
                <Input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
              
              {/* Preview de imagen */}
              {formData.imageUrl && (
                <div className="mt-3">
                  <label className="block text-xs text-gray-600 mb-1">Vista previa:</label>
                  <img
                    src={formData.imageUrl}
                    alt="Vista previa"
                    className="w-full h-32 object-cover rounded-lg border"
                    onError={(e: any) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {editingMention ? 'Actualizar' : 'Crear'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SpecialMentions;
