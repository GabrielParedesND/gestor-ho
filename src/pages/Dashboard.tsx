import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  Trophy, 
  Clock, 
  Users, 
  TrendingUp,
  Award,
  Target,
  AlertCircle 
} from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { periodService } from '../services/periodService';
import { votingService } from '../services/votingService';
import { apiClient } from '../lib/api';
import { safeFormat, isValidDate } from '../lib/dateUtils';

export function Dashboard() {
  const { user, canVote, isLeader } = useAuth();
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [myGrants, setMyGrants] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const [myPoints, setMyPoints] = useState(0);
  const [myInitiatives, setMyInitiatives] = useState([]);
  const [pendingVotes, setPendingVotes] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      // Current period
      const period = await periodService.getCurrentPeriod();
      setCurrentPeriod(period);

      // My grants
      try {
        const grants = await apiClient.getUserGrants(user.id, true);
        setMyGrants(grants);
      } catch (error) {
        console.warn('Error cargando grants, usando datos de respaldo');
        setMyGrants([]);
      }

      // My votes for current period
      if (period && canVote) {
        try {
          const votes = await votingService.getMyVotesForPeriod(period.id, user.id);
          setMyVotes(votes);

          const candidates = await votingService.getCandidatesForPeriod(period.id);
          setPendingVotes(Math.max(0, candidates.length - votes.length));
        } catch (error) {
          console.warn('Error cargando votos');
          setMyVotes([]);
          setPendingVotes(0);
        }
      }

      // My innovation points (solo para líderes)
      if (isLeader) {
        try {
          const leaderboard = await apiClient.getPointsLeaderboard();
          const userEntry = leaderboard.find((entry: any) => entry.user.id === user.id);
          setMyPoints(userEntry?.availablePoints || 0);
        } catch (error) {
          console.warn('Error cargando puntos');
          setMyPoints(0);
        }
      }

      // My initiatives (if leader)
      if (isLeader) {
        try {
          const initiatives = await apiClient.getUserInitiatives(user.id);
          setMyInitiatives(initiatives.slice(0, 5));
        } catch (error) {
          console.warn('Error cargando iniciativas');
          setMyInitiatives([]);
        }
      }

    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalGrantDays = myGrants.reduce((sum, grant) => sum + grant.days, 0);
  const expiringSoon = myGrants.filter(grant => {
    const expiryDate = grant.expiresAt || grant.expires_at;
    if (!isValidDate(expiryDate)) return false;
    
    const dateObj = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((dateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Resumen de tu participación en el sistema de incentivos
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Días HO Disponibles"
          value={totalGrantDays}
          icon={<Calendar className="h-6 w-6" />}
          color="green"
          change={expiringSoon.length > 0 ? {
            value: `${expiringSoon.length} por vencer`,
            type: 'neutral'
          } : undefined}
        />

        {isLeader && (
          <StatsCard
            title="Puntos de Innovación"
            value={myPoints}
            icon={<Award className="h-6 w-6" />}
            color="purple"
            change={myPoints >= 10 ? {
              value: `${Math.floor(myPoints / 10)} días extra`,
              type: 'increase'
            } : {
              value: `${10 - (myPoints % 10)} para día extra`,
              type: 'neutral'
            }}
          />
        )}

        {canVote && (
          <StatsCard
            title="Votos Disponibles"
            value={pendingVotes}
            icon={<Users className="h-6 w-6" />}
            color={pendingVotes > 0 ? 'blue' : 'green'}
          />
        )}

        {isLeader && (
          <StatsCard
            title="Iniciativas Activas"
            value={myInitiatives.filter(i => i.status !== 'DRAFT').length}
            icon={<Target className="h-6 w-6" />}
            color="blue"
          />
        )}
      </div>

      {/* Current period status */}
      {currentPeriod && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Período Actual: {currentPeriod.weekLabel || currentPeriod.week_label}</CardTitle>
              <Badge variant={currentPeriod.status === 'OPEN' ? 'success' : 'warning'}>
                {currentPeriod.status === 'OPEN' ? 'Abierto' : currentPeriod.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <strong>Inicio:</strong> {safeFormat(currentPeriod.startDate || currentPeriod.start_date, 'PPP')}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Fin:</strong> {safeFormat(currentPeriod.endDate || currentPeriod.end_date, 'PPP')}
                </p>
              </div>
              
              {canVote && currentPeriod.status === 'OPEN' && (
                <div className="flex justify-end">
                  <Button 
                    onClick={() => window.location.href = '/voting'}
                    disabled={pendingVotes === 0}
                  >
                    {pendingVotes > 0 ? `Votar (${pendingVotes} disponibles)` : 'Votos completos'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {expiringSoon.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent>
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">
                  Días de Home Office por vencer
                </h4>
                <p className="text-sm text-yellow-700">
                  Tienes {expiringSoon.length} méritos que vencen pronto. 
                  Asegúrate de usarlos antes de que expiren.
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2 text-yellow-800 hover:bg-yellow-100"
                  onClick={() => window.location.href = '/grants'}
                >
                  Ver mis días
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My recent grants */}
        <Card>
          <CardHeader>
            <CardTitle>Mis Últimos Méritos</CardTitle>
          </CardHeader>
          <CardContent>
            {myGrants.length > 0 ? (
              <div className="space-y-3">
                {myGrants.slice(0, 3).map((grant) => (
                  <div key={grant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{grant.days} días</p>
                      <p className="text-sm text-gray-600">
                        Fuente: {grant.source === 'NORMAL' ? 'Votación' : grant.source}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Vence: {safeFormat(grant.expiresAt || grant.expires_at)}
                      </p>
                      {(grant.expiresAt || grant.expires_at) && expiringSoon.some(g => g.id === grant.id) && (
                        <Badge variant="warning" size="sm">Pronto</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No tienes méritos disponibles
              </p>
            )}
          </CardContent>
        </Card>

        {/* My initiatives (for leaders) */}
        {isLeader && (
          <Card>
            <CardHeader>
              <CardTitle>Mis Iniciativas</CardTitle>
            </CardHeader>
            <CardContent>
              {myInitiatives.length > 0 ? (
                <div className="space-y-3">
                  {myInitiatives.slice(0, 3).map((initiative) => (
                    <div key={initiative.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{initiative.title}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {initiative.type} • {safeFormat(initiative.createdAt || initiative.created_at)}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            initiative.status === 'ADOPTED' ? 'success' :
                            initiative.status === 'PLANNED' ? 'info' : 'default'
                          }
                          size="sm"
                        >
                          {initiative.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No has creado iniciativas aún
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}