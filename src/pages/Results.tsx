import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Users, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import type { Tally, Period, User } from '@prisma/client';

export function Results() {
  const { user, isManagerOrAdmin } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [results, setResults] = useState<(Tally & { user?: User })[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);

  useEffect(() => {
    loadPeriods();
  }, []);

  useEffect(() => {
    if (selectedPeriod) {
      loadResults();
    }
  }, [selectedPeriod]);

  const loadPeriods = async () => {
    try {
      const allPeriods = await apiClient.getPeriods();
      setPeriods(allPeriods);
      if (allPeriods.length > 0) {
        setSelectedPeriod(allPeriods[0].id);
      }
    } catch (error) {
      console.warn('Error loading periods, using fallback');
      setPeriods([]);
    }
  };

  const loadResults = async () => {
    try {
      const periodResults = await apiClient.getPeriodResults(selectedPeriod);
      setResults(periodResults);
    } catch (error) {
      console.warn('Error loading results, using fallback');
      setResults([]);
    }
  };

  if (!isManagerOrAdmin) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los managers y administradores pueden ver los resultados.
        </p>
      </div>
    );
  }

  const selectedPeriodData = periods.find(p => p.id === selectedPeriod);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Resultados</h1>
        <p className="text-gray-600">
          Resultados de las votaciones por período
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Período</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.weekLabel} - {period.status}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedPeriodData && (
        <Card>
          <CardHeader>
            <CardTitle>Información del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Período</p>
                <p className="font-medium">{selectedPeriodData.weekLabel}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant={selectedPeriodData.status === 'CLOSED' ? 'success' : 'warning'}>
                  {selectedPeriodData.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-gray-600">Fechas</p>
                <p className="text-sm">
                  {safeFormat(selectedPeriodData.startDate)} - 
                  {safeFormat(selectedPeriodData.endDate)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resultados de Votación</CardTitle>
        </CardHeader>
        <CardContent>
          {results.length > 0 ? (
            <div className="space-y-4">
              {results.map((result) => (
                <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-700">
                        {result.user?.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{result.user?.name}</p>
                      <p className="text-sm text-gray-600">{result.user?.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Votos Brutos</p>
                      <p className="font-medium">{result.rawVotes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Votos Contados</p>
                      <p className="font-medium">{result.countedVotes}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Días Ganados</p>
                      <Badge variant={result.resultDays > 0 ? 'success' : 'default'}>
                        {result.resultDays} días
                      </Badge>
                    </div>
                    {result.managerIncluded && (
                      <div className="text-center">
                        <Badge variant="info" size="sm">
                          Manager incluido
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay resultados para este período</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}