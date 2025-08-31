import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { apiClient } from '../lib/api';
import toast from 'react-hot-toast';

export function Settings() {
  const { user, isAdmin } = useAuth();
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState({
    system_name: 'Sistema de Incentivo HO',
    voting_deadline_hour: '17',
    max_votes_per_candidate: '4',
    grant_expiry_days: '60',
    points_for_bonus_day: '10',
    points_for_approval: '5',
    points_for_impact: '5',
    timezone: 'America/Mexico_City',
    email_notifications: true,
    auto_close_periods: false
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const allSettings = await apiClient.getSettings();
      const settingsObj = allSettings.reduce((acc: any, setting: any) => {
        acc[setting.key] = JSON.parse(setting.value);
        return acc;
      }, {});
      
      setSettings(prev => ({ ...prev, ...settingsObj }));
    } catch (error) {
      console.warn('Error loading settings, using defaults:', error);
      // Usar configuraciones por defecto si no se pueden cargar
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.saveSettings(settings, user?.id);
      await refreshSettings(); // Refrescar configuraciones en el contexto
      toast.success('Configuración guardada correctamente');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error al guardar la configuración (modo de respaldo activo)');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('¿Estás seguro de que quieres restaurar la configuración por defecto?')) {
      setSettings({
        system_name: 'Sistema de Incentivo HO',
        voting_deadline_hour: '17',
        max_votes_per_candidate: '4',
        grant_expiry_days: '60',
        points_for_bonus_day: '10',
        points_for_approval: '5',
        points_for_impact: '5',
        timezone: 'America/Mexico_City',
        email_notifications: true,
        auto_close_periods: false
      });
      toast.success('Configuración restaurada');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <SettingsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los administradores pueden acceder a la configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-gray-600">
          Configura los parámetros del sistema
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Nombre del Sistema"
              value={settings.system_name}
              onChange={(e) => setSettings({ ...settings, system_name: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zona Horaria
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="America/Mexico_City">América/Ciudad de México</option>
                <option value="America/New_York">América/Nueva York</option>
                <option value="Europe/Madrid">Europa/Madrid</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Votaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Hora límite para votar (24h)"
              type="number"
              min="0"
              max="23"
              value={settings.voting_deadline_hour}
              onChange={(e) => setSettings({ ...settings, voting_deadline_hour: e.target.value })}
              required
              help="Hora en formato 24h (ej. 17 para las 5:00 PM)"
            />

            <Input
              label="Máximo de votos por candidato"
              type="number"
              min="1"
              max="10"
              value={settings.max_votes_per_candidate}
              onChange={(e) => setSettings({ ...settings, max_votes_per_candidate: e.target.value })}
              required
              help="Si se excede este número, se descartará un voto al azar"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Grants</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Días de expiración de grants"
              type="number"
              min="1"
              max="365"
              value={settings.grant_expiry_days}
              onChange={(e) => setSettings({ ...settings, grant_expiry_days: e.target.value })}
              required
              help="Número de días después de los cuales expiran los grants"
            />

            <Input
              label="Puntos necesarios para día extra"
              type="number"
              min="1"
              max="20"
              value={settings.points_for_bonus_day}
              onChange={(e) => setSettings({ ...settings, points_for_bonus_day: e.target.value })}
              required
              help="Puntos de innovación necesarios para obtener un día extra"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Puntos de Innovación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Puntos por iniciativa aprobada"
              type="number"
              min="1"
              max="20"
              value={settings.points_for_approval}
              onChange={(e) => setSettings({ ...settings, points_for_approval: e.target.value })}
              required
              help="Puntos otorgados cuando se aprueba una iniciativa"
            />

            <Input
              label="Puntos por iniciativa impactante"
              type="number"
              min="1"
              max="20"
              value={settings.points_for_impact}
              onChange={(e) => setSettings({ ...settings, points_for_impact: e.target.value })}
              required
              help="Puntos adicionales cuando una iniciativa se marca como impactante"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuración de Notificaciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="email_notifications"
                checked={settings.email_notifications}
                onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="email_notifications" className="ml-2 block text-sm text-gray-900">
                Enviar notificaciones por email
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_close_periods"
                checked={settings.auto_close_periods}
                onChange={(e) => setSettings({ ...settings, auto_close_periods: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="auto_close_periods" className="ml-2 block text-sm text-gray-900">
                Cerrar períodos automáticamente
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent>
            <div className="flex items-start space-x-3">
              <div className="bg-yellow-500 rounded-full p-1">
                <SettingsIcon className="h-4 w-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-yellow-900">Modo de Desarrollo</h4>
                <p className="text-sm text-yellow-800 mt-1">
                  Actualmente el sistema está funcionando con datos simulados. 
                  Para usar Supabase en producción, configura las variables de entorno 
                  y cambia VITE_USE_MOCK_DATA a false.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="ghost"
            onClick={handleReset}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Restaurar Defaults
          </Button>
          <Button type="submit" loading={loading}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}