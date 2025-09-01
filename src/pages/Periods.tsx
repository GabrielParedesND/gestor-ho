import React, { useState, useEffect } from 'react';
import { FileText, Plus, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import toast from 'react-hot-toast';
import type { Period } from '@prisma/client';

export function Periods() {
  const { user, isAdmin, isManagerOrAdmin } = useAuth();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validationModal, setValidationModal] = useState({
    show: false,
    periodId: '',
    validationErrors: [],
    summary: ''
  });
  const [formData, setFormData] = useState({
    weekLabel: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    loadPeriods();
  }, []);

  const loadPeriods = async () => {
    try {
      const allPeriods = await apiClient.getPeriods();
      setPeriods(allPeriods);
    } catch (error) {
      console.error('Error loading periods:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newPeriod = await apiClient.createPeriod({
        weekLabel: formData.weekLabel,
        startDate: formData.startDate,
        endDate: formData.endDate
      });

      setPeriods([newPeriod, ...periods]);
      setShowModal(false);
      setFormData({ weekLabel: '', startDate: '', endDate: '' });
      toast.success('Período creado correctamente');
    } catch (error) {
      console.error('Error creating period:', error);
      toast.error('Error al crear el período');
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = async (periodId: string, force: boolean = false) => {
    try {
      await apiClient.closePeriod(periodId, force);
      await loadPeriods(); // Reload periods to get updated data
      toast.success('Período cerrado correctamente');
      
      // Cerrar modal si estaba abierto
      setValidationModal({
        show: false,
        periodId: '',
        validationErrors: [],
        summary: ''
      });
    } catch (error: any) {
      console.error('Error closing period:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);
      
      // Manejar errores de validación específicos
      if (error.response?.status === 400 && error.response?.data?.error === 'validation_required') {
        const validationData = error.response.data;
        
        console.log('Showing validation modal with data:', validationData);
        
        // Mostrar modal de validación
        setValidationModal({
          show: true,
          periodId,
          validationErrors: validationData.validationErrors,
          summary: validationData.summary
        });
        
        console.log('Validation modal state updated');
      } else {
        toast.error('Error al cerrar el período');
      }
    }
  };

  const handleForceClose = () => {
    if (confirm('¿Estás seguro de que quieres cerrar el período sin que todos hayan completado las acciones?')) {
      handleClosePeriod(validationModal.periodId, true);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'OPEN': return <Clock className="h-4 w-4" />;
      case 'VOTING': return <Calendar className="h-4 w-4" />;
      case 'CLOSED': return <CheckCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'success';
      case 'VOTING': return 'warning';
      case 'CLOSED': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Abierto';
      case 'VOTING': return 'Votación';
      case 'CLOSED': return 'Cerrado';
      default: return status;
    }
  };

  if (!isManagerOrAdmin) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los managers y administradores pueden gestionar períodos.
        </p>
      </div>
    );
  }

  console.log('Validation modal state:', validationModal);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Períodos</h1>
          <p className="text-gray-600">
            Gestiona los períodos de votación
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Período
        </Button>
      </div>

      <div className="grid gap-6">
        {periods.map((period) => (
          <Card key={period.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{period.weekLabel}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant={getStatusColor(period.status)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(period.status)}
                      <span>{getStatusLabel(period.status)}</span>
                    </div>
                  </Badge>
                  {period.status === 'OPEN' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleClosePeriod(period.id)}
                    >
                      Cerrar Período
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Inicio</p>
                  <p className="font-medium">
                    {safeFormat(period.startDate || period.start_date, 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Fin</p>
                  <p className="font-medium">
                    {safeFormat(period.endDate || period.end_date, 'PPP')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Creado</p>
                  <p className="text-sm">
                    {safeFormat(period.createdAt || period.created_at, 'PPp')}
                  </p>
                  {(period.closedAt || period.closed_at) && (
                    <>
                      <p className="text-sm text-gray-600 mt-2">Cerrado</p>
                      <p className="text-sm">
                        {safeFormat(period.closedAt || period.closed_at, 'PPp')}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {period.status === 'OPEN' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Período Activo
                    </span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    Este es el período actual donde se pueden emitir votos.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {periods.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay períodos
              </h3>
              <p className="text-gray-600 mb-4">
                Crea el primer período para comenzar con las votaciones.
              </p>
              <Button onClick={() => setShowModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primer Período
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo Período"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Etiqueta del Período"
            value={formData.weekLabel}
            onChange={(e) => setFormData({ ...formData, weekLabel: e.target.value })}
            required
            placeholder="ej. Semana 1 - Enero 2024"
          />

          <Input
            label="Fecha de Inicio"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />

          <Input
            label="Fecha de Fin"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> El período se creará en estado "Abierto" y los usuarios 
              podrán comenzar a votar inmediatamente.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Crear Período
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Validación de Cierre */}
      <Modal 
        isOpen={validationModal.show} 
        onClose={() => setValidationModal({ show: false, periodId: '', validationErrors: [], summary: '' })}
        title="Validaciones de Cierre de Período"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-2">⚠️ Acciones Pendientes</h4>
            <p className="text-yellow-700 mb-4">{validationModal.summary}</p>
            
            <div className="space-y-3">
              {validationModal.validationErrors.map((validation: any, index: number) => (
                <div key={index} className="bg-white rounded border border-yellow-200 p-3">
                  <h5 className="font-medium text-gray-900 mb-2">{validation.message}</h5>
                  <div className="space-y-1">
                    {validation.users.map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">• {user.name}</span>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">¿Qué deseas hacer?</h4>
            <p className="text-blue-700 text-sm">
              Puedes esperar a que todos completen sus acciones o forzar el cierre del período.
              Si fuerzas el cierre, se procesarán solo los votos y nominaciones existentes.
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setValidationModal({ show: false, periodId: '', validationErrors: [], summary: '' })}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setValidationModal({ show: false, periodId: '', validationErrors: [], summary: '' })}
            >
              Esperar
            </Button>
            <Button
              type="button"
              onClick={handleForceClose}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Forzar Cierre
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}