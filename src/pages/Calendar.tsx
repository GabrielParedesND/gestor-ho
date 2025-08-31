import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Home, Users, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';

export function Calendar() {
  const { user, isManagerOrAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [homeOfficeRequests, setHomeOfficeRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);

  useEffect(() => {
    loadHomeOfficeRequests();
  }, [currentDate]);

  const loadHomeOfficeRequests = async () => {
    try {
      // Obtener todos los grants redimidos con fechas solicitadas
      const logs = await apiClient.getAuditLogs();
      const homeOfficeRequests = logs
        .filter(log => log.action === 'GRANT_REDEEMED')
        .map(log => {
          const newValues = JSON.parse(log.newValues || '{}');
          const meta = JSON.parse(log.meta || '{}');
          return {
            id: log.id,
            user: log.actor,
            requestedDate: newValues.requestedDate,
            redeemedAt: newValues.redeemedAt,
            days: meta.grantDays || 1,
            source: meta.source || 'NORMAL'
          };
        })
        .filter(request => request.requestedDate);

      setHomeOfficeRequests(homeOfficeRequests);
    } catch (error) {
      console.error('Error loading home office requests:', error);
      setHomeOfficeRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // Obtener el primer día de la semana (lunes) para mostrar el calendario completo
  const calendarStart = new Date(monthStart);
  const dayOfWeek = monthStart.getDay();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Lunes = 0
  calendarStart.setDate(monthStart.getDate() - daysToSubtract);
  
  // Obtener el último día de la semana (domingo) 
  const calendarEnd = new Date(monthEnd);
  const endDayOfWeek = monthEnd.getDay();
  const daysToAdd = endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek;
  calendarEnd.setDate(monthEnd.getDate() + daysToAdd);
  
  const monthDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getRequestsForDate = (date: Date) => {
    return homeOfficeRequests.filter(request => {
      try {
        return request.requestedDate && isSameDay(new Date(request.requestedDate), date);
      } catch {
        return false;
      }
    });
  };

  const previousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleDayClick = (date: Date) => {
    const requests = getRequestsForDate(date);
    if (requests.length > 0) {
      setSelectedDate(date);
      setShowDayDetail(true);
    }
  };

  const getSourceLabel = (source: string) => {
    const labels = {
      'NORMAL': 'Votación',
      'SPECIAL': 'Iniciativa',
      'POINTS': 'Puntos',
    };
    return labels[source as keyof typeof labels] || source;
  };

  if (!isManagerOrAdmin) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los managers y administradores pueden ver el calendario de Home Office.
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendario Home Office</h1>
        <p className="text-gray-600">
          Vista de días de Home Office solicitados por el equipo
        </p>
      </div>

      {/* Calendar */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>{format(currentDate, 'MMMM yyyy', { locale: es })}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthDays.map(day => {
              const requests = getRequestsForDate(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={`min-h-[80px] p-2 border rounded-lg transition-colors ${
                    isSameMonth(day, currentDate) 
                      ? 'bg-white border-gray-200' 
                      : 'bg-gray-50 border-gray-100'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''} ${
                    requests.length > 0 ? 'cursor-pointer hover:bg-blue-50' : ''
                  }`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isSameMonth(day, currentDate) ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  
                  {requests.length > 0 && (
                    <div className="space-y-1">
                      {requests.slice(0, 2).map(request => (
                        <div
                          key={request.id}
                          className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded flex items-center"
                          title={`${request.user.name} - Home Office`}
                        >
                          <Home className="h-3 w-3 mr-1" />
                          <span className="truncate">{request.user.name.split(' ')[0]}</span>
                        </div>
                      ))}
                      {requests.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{requests.length - 2} más
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Leyenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
              <span className="text-sm text-gray-600">Día de Home Office solicitado</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Día actual</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen del Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {homeOfficeRequests.filter(r => {
                  try {
                    const requestDate = new Date(r.requestedDate);
                    return r.requestedDate && isSameMonth(requestDate, currentDate);
                  } catch {
                    return false;
                  }
                }).length}
              </div>
              <div className="text-sm text-gray-600">Días HO solicitados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {new Set(homeOfficeRequests.filter(r => {
                  try {
                    const requestDate = new Date(r.requestedDate);
                    return r.requestedDate && isSameMonth(requestDate, currentDate);
                  } catch {
                    return false;
                  }
                }).map(r => r.user.id)).size}
              </div>
              <div className="text-sm text-gray-600">Usuarios únicos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(homeOfficeRequests.filter(r => {
                  try {
                    const requestDate = new Date(r.requestedDate);
                    return r.requestedDate && isSameMonth(requestDate, currentDate);
                  } catch {
                    return false;
                  }
                }).length / monthDays.length * 100)}%
              </div>
              <div className="text-sm text-gray-600">Ocupación promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalle del día */}
      <Modal
        isOpen={showDayDetail}
        onClose={() => setShowDayDetail(false)}
        title={selectedDate ? `Home Office - ${format(selectedDate, 'EEEE, d MMMM yyyy', { locale: es })}` : ''}
      >
        {selectedDate && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {new Set(getRequestsForDate(selectedDate).map(r => r.user.id)).size} persona{new Set(getRequestsForDate(selectedDate).map(r => r.user.id)).size !== 1 ? 's' : ''} en Home Office
              </h3>
              <Badge variant="info">
                {format(selectedDate, 'EEEE', { locale: es })}
              </Badge>
            </div>
            
            <div className="space-y-3">
              {getRequestsForDate(selectedDate).map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Home className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{request.user.name}</p>
                      <p className="text-sm text-gray-500">{request.user.email}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" size="sm">
                          {getSourceLabel(request.source)}
                        </Badge>
                        <span className="text-xs text-gray-400">
                          Solicitado: {request.redeemedAt ? format(new Date(request.redeemedAt), 'dd/MM/yyyy HH:mm') : 'Fecha no disponible'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">{request.days}</div>
                    <div className="text-xs text-gray-500">día{request.days !== 1 ? 's' : ''}</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {new Set(getRequestsForDate(selectedDate).map(r => r.user.id)).size} persona{new Set(getRequestsForDate(selectedDate).map(r => r.user.id)).size !== 1 ? 's' : ''} en Home Office
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}