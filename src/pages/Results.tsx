import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Users, Award, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import type { Tally, Period, User } from '@prisma/client';

export function Results() {
  const { user, isManagerOrAdmin } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [results, setResults] = useState<(Tally & { user?: User })[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [nominations, setNominations] = useState([]);

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
      const [periodResults, periodNominations] = await Promise.all([
        apiClient.getPeriodResults(selectedPeriod),
        apiClient.getNominations(selectedPeriod)
      ]);
      setResults(periodResults);
      setNominations(periodNominations);
    } catch (error) {
      console.warn('Error loading results, using fallback');
      setResults([]);
      setNominations([]);
    }
  };

  const downloadSummary = () => {
    if (!selectedPeriodData || results.length === 0) return;

    const summary = [
      `RESUMEN DE RESULTADOS - ${selectedPeriodData.weekLabel}`,
      `Período: ${safeFormat(selectedPeriodData.startDate)} - ${safeFormat(selectedPeriodData.endDate)}`,
      `Estado: ${selectedPeriodData.status}`,
      '',
      'NOMINACIONES:',
      ''
    ];

    // Agregar nominaciones agrupadas por usuario
    const nominationsByUser = nominations.reduce((acc: any, nomination: any) => {
      const userId = nomination.nominee.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: nomination.nominee,
          nominations: [],
        };
      }
      acc[userId].nominations.push(nomination);
      return acc;
    }, {});

    Object.values(nominationsByUser).forEach((group: any) => {
      summary.push(`${group.user.name}:`);
      group.nominations.forEach((nomination: any) => {
        const project = nomination.project ? ` (${nomination.project.name})` : '';
        summary.push(`  • ${nomination.nominator.name}: "${nomination.reason}"${project}`);
      });
      summary.push('');
    });

    summary.push('RESULTADOS DE VOTACIÓN:');
    summary.push('');

    // Agregar resultados
    results.forEach((result) => {
      const days = result.resultDays > 0 ? `${result.resultDays} días` : 'Sin días';
      summary.push(`${result.user?.name}: ${result.countedVotes} votos → ${days}`);
    });

    if (results.length > 0 && results[0].discardedVoter) {
      summary.push('');
      summary.push(`Voto descartado: ${results[0].discardedVoter.name}`);
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Resultados ${selectedPeriodData.weekLabel}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 15px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: bold; }
        .header p { margin: 10px 0 0 0; font-size: 1.2em; opacity: 0.9; }
        .content { padding: 30px; }
        .section { margin-bottom: 40px; }
        .section h2 { color: #333; font-size: 1.8em; margin-bottom: 20px; border-bottom: 3px solid #4facfe; padding-bottom: 10px; }
        .nominee { background: #f8f9ff; border-radius: 8px; padding: 15px; margin-bottom: 15px; border-left: 4px solid #4facfe; }
        .nominee h3 { margin: 0 0 10px 0; color: #333; font-size: 1.1em; }
        .nomination { background: white; border-radius: 6px; padding: 10px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .nominator { font-weight: bold; color: #4facfe; font-size: 0.9em; }
        .reason { margin: 4px 0; font-style: italic; color: #555; font-size: 0.9em; }
        .project { background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 12px; font-size: 0.8em; display: inline-block; margin-left: 8px; }
        .results { background: #f0f8ff; border-radius: 10px; padding: 20px; }
        .result-item { display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; background: white; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .result-name { font-weight: bold; color: #333; }
        .result-votes { color: #666; }
        .result-days { font-weight: bold; padding: 8px 15px; border-radius: 20px; color: white; }
        .days-3 { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .days-2 { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); color: #333; }
        .days-1 { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); color: #333; }
        .days-0 { background: #e0e0e0; color: #666; }
        .footer { text-align: center; padding: 20px; background: #f5f5f5; color: #666; }
        .celebration { text-align: center; font-size: 3em; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 Resultados ${selectedPeriodData.weekLabel}</h1>
            <p>${safeFormat(selectedPeriodData.startDate)} - ${safeFormat(selectedPeriodData.endDate)}</p>
        </div>
        
        <div class="content">
            <div class="celebration">🎉 ¡Felicitaciones a todos! 🎉</div>
            
            <div class="section">
                <h2>🌟 Nominaciones Destacadas</h2>
                ${Object.values(nominationsByUser).map((group: any) => `
                    <div class="nominee">
                        <h3>👤 ${group.user.name}</h3>
                        ${group.nominations.map((nomination: any) => `
                            <div class="nomination">
                                <div class="nominator">💬 ${nomination.nominator.name}:</div>
                                <div class="reason">"${nomination.reason}"</div>
                                ${nomination.project ? `<span class="project">📁 ${nomination.project.name}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <h2>🏅 Resultados Finales</h2>
                <div class="results">
                    ${results.map((result) => {
                      const daysClass = result.resultDays === 3 ? 'days-3' : result.resultDays === 2 ? 'days-2' : result.resultDays === 1 ? 'days-1' : 'days-0';
                      const daysText = result.resultDays > 0 ? `${result.resultDays} día${result.resultDays > 1 ? 's' : ''}` : 'Sin días';
                      const emoji = result.resultDays === 3 ? '🎆' : result.resultDays === 2 ? '🎉' : result.resultDays === 1 ? '🎈' : '🙏';
                      return `
                        <div class="result-item">
                            <div>
                                <div class="result-name">${emoji} ${result.user?.name}</div>
                                <div class="result-votes">${result.countedVotes} votos recibidos</div>
                            </div>
                            <div class="result-days ${daysClass}">${daysText}</div>
                        </div>
                      `;
                    }).join('')}
                    ${results.length > 0 && results[0].discardedVoter ? `
                        <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; color: #856404;">
                            ℹ️ Voto descartado aleatoriamente: ${results[0].discardedVoter.name}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>¡Sigan así equipo! Cada esfuerzo cuenta y es reconocido</p>
            <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
        </div>
    </div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultados-${selectedPeriodData.weekLabel.replace(/\s+/g, '-')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
          <div className="flex items-center justify-between">
            <CardTitle>Seleccionar Período</CardTitle>
            {selectedPeriodData && results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={downloadSummary}
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar Resumen
              </Button>
            )}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
              {results.length > 0 && results[0].discardedVoter && (
                <div>
                  <p className="text-sm text-gray-600">Voto Descartado</p>
                  <p className="font-medium text-red-600">{results[0].discardedVoter.name}</p>
                  <p className="text-xs text-gray-500">{results[0].discardedVoter.role}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {nominations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nominaciones del Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const nominationsByUser = nominations.reduce((acc: any, nomination: any) => {
                  const userId = nomination.nominee.id;
                  if (!acc[userId]) {
                    acc[userId] = {
                      user: nomination.nominee,
                      nominations: [],
                    };
                  }
                  acc[userId].nominations.push(nomination);
                  return acc;
                }, {});
                
                return Object.values(nominationsByUser).map((group: any) => (
                  <div key={group.user.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium text-sm">
                          {group.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">{group.user.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({group.nominations.length} nominación{group.nominations.length !== 1 ? 'es' : ''})</span>
                      </div>
                    </div>
                    <div className="space-y-2 ml-11">
                      {group.nominations.map((nomination: any) => (
                        <div key={nomination.id} className="text-sm text-gray-700 bg-white rounded px-3 py-2">
                          <div className="mb-2">
                            <span className="font-medium">{nomination.nominator.name}:</span> "{nomination.reason}"
                          </div>
                          {nomination.project && (
                            <Badge variant="outline" size="sm">
                              {nomination.project.name}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
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