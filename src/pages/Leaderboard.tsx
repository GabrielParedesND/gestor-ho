import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, TrendingUp, Calendar, Users, Target, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/api';
import { safeFormat } from '../lib/dateUtils';
import { getCategoryLabel, getContributionTypeLabel } from '../lib/constants';

// Types
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type Period = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};

type SpecialMention = {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  isActive: boolean;
  validUntil: string;
  createdBy: User;
};

type LeaderboardEntry = {
  user: User;
  totalPoints: number;
  totalDays: number;
  grantsCount: number;
  recentPoints: number;
};

type Nomination = {
  id: string;
  user: User;
  nominatedBy: User;
  reason: string;
  period: Period;
};

type Result = {
  id: string;
  user: User;
  resultDays: number;
  reason: string;
  period: Period;
};

type Achievement = {
  id: string;
  user: User;
  type: string;
  value: number | string;
  reason: string;
  createdAt: Date;
};

// Componentes modulares del leaderboard
function TopPerformersSection({ pointsLeaderboard, grantsLeaderboard }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* MVP del mes */}
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-400 rounded-lg opacity-60" style={{
          backgroundSize: '400% 400%',
          animation: 'borderGradient 3s ease infinite'
        }}></div>
        <Card className="border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-50 relative h-full">
          <CardContent className="text-center p-6 h-full flex flex-col justify-center items-center">
            <Trophy className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
            <h3 className="font-bold text-yellow-800 mb-2">🏆 MVP del Mes</h3>
            <p className="text-xs text-yellow-600 mb-3">Quien más puntos ha ganado este mes por crear iniciativas innovadoras</p>
            {(() => {
              const mvpThisMonth = pointsLeaderboard.find((entry: any) => entry.recentPoints > 0) || pointsLeaderboard[0];
              return mvpThisMonth ? (
                <>
                  <p className="text-lg font-bold text-yellow-900">{mvpThisMonth.user?.name || 'Usuario desconocido'}</p>
                  <p className="text-sm text-yellow-700">{mvpThisMonth.recentPoints || 0} puntos este mes</p>
                  <Badge className="bg-yellow-200 text-yellow-800 mt-3 inline-block">¡Visionario!</Badge>
                </>
              ) : (
                <p className="text-sm text-yellow-700">Sin puntos este mes</p>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Más reconocido */}
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 via-emerald-500 to-green-400 rounded-lg opacity-60" style={{
          backgroundSize: '400% 400%',
          animation: 'borderGradient 3.5s ease infinite'
        }}></div>
        <Card className="border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 relative h-full">
          <CardContent className="text-center p-6 h-full flex flex-col justify-center items-center">
            <Award className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <h3 className="font-bold text-green-800 mb-2">🌟 Más Reconocido</h3>
            <p className="text-xs text-green-600 mb-3">Quien más días de Home Office ha ganado por recibir votos de managers y líderes</p>
            {(() => {
              const topMember = grantsLeaderboard.find((entry: any) => entry.user.role === 'MEMBER' && entry.totalDays > 0);
              return topMember ? (
                <>
                  <p className="text-lg font-bold text-green-900">{topMember.user?.name || 'Usuario desconocido'}</p>
                  <p className="text-sm text-green-700">{topMember.totalDays} días ganados</p>
                  <Badge className="bg-green-200 text-green-800 mt-3 inline-block">¡Trabajo excepcional!</Badge>
                </>
              ) : (
                <p className="text-sm text-green-700">Sin miembros reconocidos aún</p>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      {/* Racha Activa */}
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 rounded-lg opacity-60" style={{
          backgroundSize: '400% 400%',
          animation: 'borderGradient 4s ease infinite'
        }}></div>
        <Card className="border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50 relative h-full">
          <CardContent className="text-center p-6 h-full flex flex-col justify-center items-center">
            <TrendingUp className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <h3 className="font-bold text-blue-800 mb-2">🔥 Racha Activa</h3>
            <p className="text-xs text-blue-600 mb-3">Miembro con más períodos ganando días consecutivos</p>
            {(() => {
              const memberWithStreak = grantsLeaderboard.find((entry: any) => entry.user.role === 'MEMBER' && entry.grantsCount >= 2);
              return memberWithStreak ? (
                <>
                  <p className="text-lg font-bold text-blue-900">{memberWithStreak.user?.name || 'Usuario desconocido'}</p>
                  <p className="text-sm text-blue-700">{memberWithStreak.grantsCount} períodos consecutivos</p>
                  <Badge className="bg-blue-200 text-blue-800 mt-3 inline-block">¡Imparable!</Badge>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-blue-900">Sin racha activa</p>
                  <p className="text-sm text-blue-700">¡Sé el primero!</p>
                  <Badge className="bg-blue-200 text-blue-800 mt-3 inline-block">¡Oportunidad!</Badge>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LeaderboardsGrid({ pointsLeaderboard, grantsLeaderboard, getRankIcon }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Innovation Champions */}
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-6 w-6 text-purple-600" />
            <span className="text-purple-800">🌟 Campeones de Innovación</span>
          </CardTitle>
          <p className="text-sm text-purple-600 mt-1">Ranking histórico por iniciativas aprobadas</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pointsLeaderboard.slice(0, 5).map((entry: any, index: number) => (
              <div key={entry.user?.id || index} className={`flex items-center space-x-4 p-3 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-purple-50 hover:scale-105 ${index === 0 ? 'ring-2 ring-purple-300' : ''}`}>
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index + 1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{entry.user?.name || 'Usuario desconocido'}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-purple-700">{entry.totalPoints} pts</p>
                  <p className="text-xs text-purple-500">
                    🔥 +{entry.recentPoints} este mes
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recognition Stars */}
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-green-600" />
            <span className="text-green-800">🌟 Estrellas del Reconocimiento</span>
          </CardTitle>
          <p className="text-sm text-green-600 mt-1">Ranking histórico de miembros más votados</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER').slice(0, 5).map((entry: any, index: number) => (
              <div key={entry.user?.id || index} className={`flex items-center space-x-4 p-3 bg-gray-50 rounded-lg transition-all duration-300 hover:bg-green-50 hover:scale-105 ${index === 0 ? 'ring-2 ring-green-300' : ''}`}>
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(index + 1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{entry.user?.name || 'Usuario desconocido'}</p>
                  <span className="text-xs text-gray-500">
                    {entry.grantsCount} méritos ganados
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700">{entry.totalDays} días</p>
                  <p className="text-xs text-green-500">
                    🏠 {entry.normalDays} ganados + ✨ {entry.bonusDays} extra
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatisticsSection({ grantsLeaderboard, pointsLeaderboard }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Miembros en racha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <div className="text-2xl font-bold text-orange-600">
              {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER' && entry.grantsCount >= 2).length}
            </div>
            <div>
              <span className="text-orange-800">🔥 Miembros en Racha</span>
              <p className="text-sm text-orange-600 font-normal">Ganaron días en múltiples períodos consecutivos</p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {grantsLeaderboard
              .filter((entry: any) => entry.user.role === 'MEMBER' && entry.grantsCount >= 2)
              .slice(0, 5)
              .map((entry: any, index: number) => (
                <div key={entry.user?.id || index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500 rounded-full p-2 relative">
                      <TrendingUp className="h-4 w-4 text-white" />
                      <div className="absolute -inset-1 bg-orange-400/50 rounded-full animate-ping"></div>
                    </div>
                    <div>
                      <p className="font-medium text-orange-900">{entry.user?.name || 'Usuario desconocido'}</p>
                      <p className="text-sm text-orange-700">{entry.totalDays} días ganados en total</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-200 text-orange-800 animate-pulse">
                    🔥 {entry.grantsCount} períodos
                  </Badge>
                </div>
              ))}
            {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER' && entry.grantsCount >= 2).length === 0 && (
              <div className="text-center py-8 text-orange-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                <p className="font-medium">🔥 ¡Sé el primero en crear una racha!</p>
                <p className="text-sm text-orange-400 mt-2">Gana días en múltiples períodos consecutivos</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del equipo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-purple-800">📆 Estadísticas del Equipo</CardTitle>
          <p className="text-sm text-purple-600">Resumen histórico del rendimiento colectivo</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-500 rounded-full p-2">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-purple-900">Total Puntos de Innovación</span>
              </div>
              <span className="text-xl font-bold text-purple-700">
                {pointsLeaderboard.reduce((sum: number, entry: any) => sum + entry.totalPoints, 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-green-500 rounded-full p-2">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-green-900">Total Días HO Otorgados</span>
              </div>
              <span className="text-xl font-bold text-green-700">
                {grantsLeaderboard.reduce((sum: number, entry: any) => sum + entry.totalDays, 0)}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-500 rounded-full p-2">
                  <Users className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-blue-900">Miembros Reconocidos</span>
              </div>
              <span className="text-xl font-bold text-blue-700">
                {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER' && entry.totalDays > 0).length}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="bg-indigo-500 rounded-full p-2">
                  <Target className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium text-indigo-900">Líderes Innovando</span>
              </div>
              <span className="text-xl font-bold text-indigo-700">
                {pointsLeaderboard.filter((entry: any) => entry.totalPoints > 0 && (entry.user.role.includes('LEADER') || entry.user.role === 'MANAGER')).length}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentAchievementsSection({ recentAchievements, safeFormat }: any) {
  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <span className="text-blue-800">🎉 ¡Momentos de Gloria Recientes!</span>
        </CardTitle>
        <p className="text-sm text-blue-600 mt-1">Celebrando los éxitos de los últimos 3 períodos</p>
      </CardHeader>
      <CardContent>
        {recentAchievements.length > 0 ? (
          <div className="space-y-3">
            {recentAchievements.map((achievement: any) => (
              <div key={achievement.id} className={`flex items-center space-x-4 p-3 border rounded-lg ${achievement.type === 'innovation' ? 'border-purple-200 bg-purple-50' :
                achievement.type === 'recognition' ? 'border-green-200 bg-green-50' :
                  achievement.type === 'nominations' ? 'border-blue-200 bg-blue-50' :
                    'border-orange-200 bg-orange-50'
                }`}>
                <div className={`rounded-full p-2 ${achievement.type === 'innovation' ? 'bg-purple-500' :
                  achievement.type === 'recognition' ? 'bg-green-500' :
                    achievement.type === 'nominations' ? 'bg-blue-500' :
                      'bg-orange-500'
                  }`}>
                  {achievement.type === 'innovation' ? <Award className="h-4 w-4 text-white" /> :
                    achievement.type === 'recognition' ? <Trophy className="h-4 w-4 text-white" /> :
                      achievement.type === 'nominations' ? <Users className="h-4 w-4 text-white" /> :
                        <Medal className="h-4 w-4 text-white" />}
                </div>

                <div className="flex-1">
                  <p className={`font-medium ${achievement.type === 'innovation' ? 'text-purple-900' :
                    achievement.type === 'recognition' ? 'text-green-900' :
                      achievement.type === 'nominations' ? 'text-blue-900' :
                        'text-orange-900'
                    }`}>
                    {achievement.type === 'innovation' ? '💡' :
                      achievement.type === 'recognition' ? '🎆' :
                        achievement.type === 'nominations' ? '🌟' :
                          '🎉'} {achievement.user?.name || 'Usuario desconocido'} {achievement.reason}!
                  </p>
                </div>

                <div className="text-right">
                  <p className={`text-sm ${achievement.type === 'innovation' ? 'text-purple-600' :
                    achievement.type === 'recognition' ? 'text-green-600' :
                      achievement.type === 'nominations' ? 'text-blue-600' :
                        'text-orange-600'
                    }`}>
                    {safeFormat(achievement.createdAt || achievement.created_at)}
                  </p>
                  <p className={`text-xs ${achievement.type === 'innovation' ? 'text-purple-500' :
                    achievement.type === 'recognition' ? 'text-green-500' :
                      achievement.type === 'nominations' ? 'text-blue-500' :
                        'text-orange-500'
                    }`}>
                    {achievement.type === 'innovation' ? '¡Innovador!' :
                      achievement.type === 'recognition' ? '¡Reconocido!' :
                        achievement.type === 'nominations' ? '¡Popular!' :
                          '¡Destacado!'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-blue-500">
            <Award className="h-12 w-12 mx-auto mb-4 text-blue-300" />
            <p className="font-medium">🌟 ¡La próxima historia de éxito podría ser tuya!</p>
            <p className="text-sm text-blue-400 mt-2">Crea iniciativas, innova y ve tu nombre brillar aquí</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente para mostrar reconocimientos por contribución
function RecognitionsSection() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNominationsData();
  }, []);

  const loadNominationsData = async () => {
    try {
      const periods = await apiClient.getPeriods();
      const recentPeriods = periods.slice(0, 3);

      let allNominations: Nomination[] = [];
      let allResults: Result[] = [];

      for (const period of recentPeriods) {
        try {
          const [periodNominations, periodResults] = await Promise.all([
            apiClient.getNominations(period.id),
            apiClient.getPeriodResults(period.id)
          ]);

          allNominations = [...allNominations, ...periodNominations.map((n: any) => ({ ...n, period }))];
          allResults = [...allResults, ...periodResults];
        } catch (error) {
          console.warn(`Error loading period ${period.id}`);
        }
      }

      setNominations(allNominations);
      setResults(allResults);
    } catch (error) {
      console.warn('Error loading nominations data');
    } finally {
      setLoading(false);
    }
  };

  // Obtener nominados que no ganaron días pero sí fueron nominados
  const winnersIds = results.filter(r => r.resultDays > 0).map(r => r.user?.id);
  const nominationsByUser = nominations.reduce((acc: any, nomination: any) => {
    const userId = nomination.nominee.id;
    if (!winnersIds.includes(userId)) {
      if (!acc[userId]) {
        acc[userId] = {
          user: nomination.nominee,
          nominations: [],
        };
      }
      acc[userId].nominations.push(nomination);
    }
    return acc;
  }, {});

  const specialRecognitions = Object.values(nominationsByUser).slice(0, 6);

  return (
    <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-800">
          <span>🌟</span>
          <span>Reconocimientos por Contribución</span>
        </CardTitle>
        <p className="text-sm text-yellow-700">
          Celebrando las valiosas contribuciones de todos los miembros del equipo
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600 mx-auto" />
          </div>
        ) : specialRecognitions.length > 0 ? (
          <>
            <div className="mb-4 p-3 bg-yellow-100 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">
                🌟 ¡Sigue así! Tu trabajo es valorado y cada esfuerzo te acerca más al reconocimiento
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {specialRecognitions.map((recognition: any) => (
                <div key={recognition.user.id} className="bg-white rounded-lg p-4 border border-yellow-200 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-medium text-sm">
                        {recognition.user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{recognition.user.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({recognition.nominations.length} nominación{recognition.nominations.length !== 1 ? 'es' : ''})</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {recognition.nominations.slice(0, 2).map((nomination: any) => (
                      <div key={nomination.id} className="text-sm bg-yellow-50 rounded px-3 py-2 border border-yellow-100">
                        <div className="mb-2">
                          <span className="font-medium text-yellow-800">{nomination.nominator.name}:</span>
                          <span className="text-gray-700 ml-1">"{nomination.reason}"</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {nomination.project && (
                            <Badge variant="outline" size="sm" className="bg-white text-xs">
                              {nomination.project.name}
                            </Badge>
                          )}
                          {nomination.category && (
                            <Badge variant="outline" size="sm" className="bg-blue-50 text-blue-700 text-xs">
                              {getCategoryLabel(nomination.category)}
                            </Badge>
                          )}
                          {nomination.contributionType && (
                            <Badge variant="outline" size="sm" className="bg-purple-50 text-purple-700 text-xs">
                              {getContributionTypeLabel(nomination.contributionType)}
                            </Badge>
                          )}
                          {nomination.period && (
                            <Badge variant="outline" size="sm" className="bg-gray-50 text-gray-600 text-xs">
                              {nomination.period.weekLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {recognition.nominations.length > 2 && (
                      <p className="text-xs text-yellow-600 text-center">
                        +{recognition.nominations.length - 2} nominación{recognition.nominations.length - 2 !== 1 ? 'es' : ''} más
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Award className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              🎆 Próximamente: Reconocimientos Especiales
            </h3>
            <p className="text-yellow-700 mb-4">
              Aquí aparecerán las nominaciones de miembros que, aunque no ganen días de Home Office, sí son reconocidos por sus valiosas contribuciones al equipo.
            </p>
            <div className="bg-yellow-100 rounded-lg p-4 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                📝 <strong>Cómo funciona:</strong> Cuando haya nominaciones de miembros que no resulten ganadores en las votaciones, sus contribuciones aparecerán destacadas aquí para reconocer su esfuerzo y dedicación.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg text-center">
          <p className="text-yellow-800 font-medium">
            🎆 ¡Cada contribución cuenta y es valorada por el equipo!
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            Innovación • Colaboración • Liderazgo • Calidad • Apoyo
          </p>
        </div>
      </CardContent>
    </Card>
  );
}



export function Leaderboard() {
  const [loading, setLoading] = useState(true);
  const [pointsLeaderboard, setPointsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [grantsLeaderboard, setGrantsLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [specialMentions, setSpecialMentions] = useState<SpecialMention[]>([]);
  const [specialRecognitions, setSpecialRecognitions] = useState<any[]>([]);
  const [presentationMode, setPresentationMode] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Calcular total de slides dinámicamente
  const calculateTotalSlides = () => {
    const activeMentions = specialMentions || [];
    const mentionsWithImage = activeMentions.filter((mention: any) => mention.imageUrl);
    const mentionsWithoutImage = activeMentions.filter((mention: any) => !mention.imageUrl);
    
    let totalSlides = 4; // slides base: 0=intro, 1=líderes, 2=estadísticas, 3=reconocimientos por contribución
    
    // Agregar slides individuales para menciones con imagen
    totalSlides += mentionsWithImage.length;
    
    // Agregar un slide para menciones sin imagen (si las hay)
    if (mentionsWithoutImage.length > 0) {
      totalSlides += 1;
    }
    
    // Agregar un slide final de logros recientes
    totalSlides += 1;
    
    return totalSlides;
  };
  
  const totalSlides = calculateTotalSlides();

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (presentationMode) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [presentationMode, totalSlides]);

  const loadLeaderboardData = async () => {
    try {
      // Points leaderboard
      const sortedPoints = await apiClient.getPointsLeaderboard();
      setPointsLeaderboard(sortedPoints);

      // Grants leaderboard con cálculo de rachas optimizado
      const sortedGrants = await apiClient.getGrantsLeaderboard();
      
      // Calcular rachas reales basándose en períodos consecutivos
      try {
        const periods = await apiClient.getPeriods();
        const periodsOrdered = periods.sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        // Obtener todos los resultados de una vez para optimizar
        const allPeriodResults: { [periodId: string]: any[] } = {};
        await Promise.all(
          periodsOrdered.map(async (period: any) => {
            try {
              const results = await apiClient.getPeriodResults(period.id);
              allPeriodResults[period.id] = results;
            } catch (error) {
              console.warn(`Error loading results for period ${period.id}`);
              allPeriodResults[period.id] = [];
            }
          })
        );
        
        // Calcular rachas para cada usuario
        const grantsWithRealStreaks = sortedGrants.map((grant: any) => {
          let maxConsecutiveStreak = 0;
          let currentStreak = 0;
          
          // Revisar cada período en orden cronológico
          for (const period of periodsOrdered) {
            const periodResults = allPeriodResults[period.id] || [];
            const userWonInThisPeriod = periodResults.some((result: any) => 
              result.user?.id === grant.user.id && result.resultDays > 0
            );
            
            if (userWonInThisPeriod) {
              currentStreak += 1;
              maxConsecutiveStreak = Math.max(maxConsecutiveStreak, currentStreak);
            } else {
              currentStreak = 0; // Se rompe la racha
            }
          }
          
          // Debug para el primer usuario
          if (grant.user.id && maxConsecutiveStreak > 0) {
            console.log(`Usuario ${grant.user.name}: racha calculada = ${maxConsecutiveStreak}, total días = ${grant.totalDays}`);
          }
          
          return {
            ...grant,
            grantsCount: maxConsecutiveStreak // Ahora representa la racha consecutiva máxima real
          };
        });
        
        setGrantsLeaderboard(grantsWithRealStreaks);
      } catch (error) {
        console.warn('Error calculating real streaks, using original data');
        setGrantsLeaderboard(sortedGrants);
      }

      // Special mentions activas
      const activeMentions = await apiClient.getActiveSpecialMentions();
      setSpecialMentions(activeMentions);

      // Recent achievements - basado en últimos resultados reales
      try {
        const allAchievements = [];

        // Obtener períodos recientes para logros reales
        const periods = await apiClient.getPeriods();
        const recentPeriods = periods.slice(0, 3); // Últimos 3 períodos

        // Paralelizar llamadas API para mejor rendimiento
        const periodPromises = recentPeriods.map(async (period: any) => {
          try {
            const [periodResults, periodNominations] = await Promise.all([
              apiClient.getPeriodResults(period.id),
              apiClient.getNominations(period.id)
            ]);
            return { period, periodResults, periodNominations };
          } catch (error) {
            console.warn(`Error loading period ${period.id} results`);
            return null;
          }
        });

        const periodData = await Promise.all(periodPromises);

        for (const data of periodData) {
          if (!data) continue;
          const { period, periodResults, periodNominations } = data;

          // Logros por resultados de votación
          for (const result of periodResults) {
            if (result.resultDays >= 3) {
              allAchievements.push({
                id: `recognition-${result.user.id}-${period.id}`,
                user: result.user,
                type: 'recognition',
                value: result.resultDays,
                reason: `ganó ${result.resultDays} días con ${result.countedVotes} votos`,
                createdAt: new Date(period.endDate || period.end_date)
              });
            } else if (result.resultDays > 0) {
              allAchievements.push({
                id: `voted-${result.user.id}-${period.id}`,
                user: result.user,
                type: 'recognition',
                value: result.resultDays,
                reason: `fue reconocido y ganó ${result.resultDays} día${result.resultDays > 1 ? 's' : ''}`,
                createdAt: new Date(period.endDate || period.end_date)
              });
            }
          }

          // Logros por nominaciones múltiples
          const nominationsByUser = periodNominations.reduce((acc: any, nom: any) => {
            if (!acc[nom.nominee.id]) acc[nom.nominee.id] = { user: nom.nominee, count: 0 };
            acc[nom.nominee.id].count++;
            return acc;
          }, {});

          Object.values(nominationsByUser).forEach((entry: any) => {
            if (entry.count >= 2) {
              allAchievements.push({
                id: `nominations-${entry.user.id}-${period.id}`,
                user: entry.user,
                type: 'nominations',
                value: entry.count,
                reason: `fue nominado ${entry.count} veces en ${period.weekLabel}`,
                createdAt: new Date(period.endDate || period.end_date)
              });
            }
          });
        }

        // Logros de innovación recientes (solo si hay puntos recientes)
        const pointsData = await apiClient.getPointsLeaderboard();
        for (const userEntry of pointsData) {
          if (userEntry.user && userEntry.recentPoints > 0) {
            allAchievements.push({
              id: `innovation-${userEntry.user.id}`,
              user: userEntry.user,
              type: 'innovation',
              value: userEntry.recentPoints,
              reason: `ganó ${userEntry.recentPoints} puntos por innovar`,
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 días atrás
            });
          }
        }

        // Ordenar por fecha y tomar los más recientes
        allAchievements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        setRecentAchievements(allAchievements.slice(0, 6));

      } catch (error) {
        console.warn('Error loading recent achievements');
        setRecentAchievements([]);
      }

      // Cargar reconocimientos por contribución (nominados que no ganaron HO)
      try {
        const periods = await apiClient.getPeriods();
        const recentPeriods = periods.slice(0, 3);

        let allNominations: any[] = [];
        let allResults: any[] = [];

        for (const period of recentPeriods) {
          try {
            const [periodNominations, periodResults] = await Promise.all([
              apiClient.getNominations(period.id),
              apiClient.getPeriodResults(period.id)
            ]);

            allNominations = [...allNominations, ...periodNominations.map((n: any) => ({ ...n, period }))];
            allResults = [...allResults, ...periodResults];
          } catch (error) {
            console.warn(`Error loading period ${period.id} nominations`);
          }
        }

        // Obtener nominados que no ganaron días pero sí fueron nominados
        const winnersIds = allResults.filter((r: any) => r.resultDays > 0).map((r: any) => r.user?.id);
        const nominationsByUser = allNominations.reduce((acc: any, nomination: any) => {
          const userId = nomination.nominee.id;
          if (!winnersIds.includes(userId)) {
            if (!acc[userId]) {
              acc[userId] = {
                user: nomination.nominee,
                nominations: [],
              };
            }
            acc[userId].nominations.push(nomination);
          }
          return acc;
        }, {});

        const specialRecognitionsData = Object.values(nominationsByUser).slice(0, 6);
        setSpecialRecognitions(specialRecognitionsData);

      } catch (error) {
        console.warn('Error loading special recognitions');
        setSpecialRecognitions([]);
      }

    } catch (error) {
      console.warn('Error loading leaderboard, using fallback');
      setPointsLeaderboard([]);
      setGrantsLeaderboard([]);
      setRecentAchievements([]);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <div className="h-5 w-5 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const togglePresentationMode = () => {
    setPresentationMode(!presentationMode);
    setCurrentSlide(0);
    if (!presentationMode) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % totalSlides);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);

  if (presentationMode) {
    const renderSlide = () => {
      const activeMentions = specialMentions || [];
      const mentionsWithImage = activeMentions.filter((mention: any) => mention.imageUrl);
      const mentionsWithoutImage = activeMentions.filter((mention: any) => !mention.imageUrl);
      
      // Slides base
      if (currentSlide === 0) {
        // Slide de introducción
        return (
          <>
            <div className="text-center mb-12">
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                🏆 SALÓN DE LA FAMA 🏆
              </h1>
              <p className="text-2xl text-gray-300">¡Celebramos a nuestros héroes del equipo!</p>
            </div>
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <Trophy className="h-20 w-20 text-yellow-400 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-yellow-400 mb-4">🏆 MVP DEL MES</h3>
                  {(() => {
                    const mvp = pointsLeaderboard.find((entry: any) => entry.recentPoints > 0) || pointsLeaderboard[0];
                    return mvp ? (
                      <>
                        <p className="text-4xl font-bold mb-2">{mvp.user?.name || 'Usuario desconocido'}</p>
                        <p className="text-xl text-yellow-300">{mvp.recentPoints || 0} puntos este mes</p>
                      </>
                    ) : <p className="text-xl">Sin datos</p>;
                  })()}
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <Award className="h-20 w-20 text-green-400 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-green-400 mb-4">🌟 MÁS RECONOCIDO</h3>
                  {(() => {
                    const top = grantsLeaderboard.find((entry: any) => entry.user.role === 'MEMBER' && entry.totalDays > 0);
                    return top ? (
                      <>
                        <p className="text-4xl font-bold mb-2">{top.user?.name || 'Usuario desconocido'}</p>
                        <p className="text-xl text-green-300">{top.totalDays} días ganados</p>
                      </>
                    ) : <p className="text-xl">Sin datos</p>;
                  })()}
                </div>
              </div>
              <div className="text-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <TrendingUp className="h-20 w-20 text-blue-400 mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-blue-400 mb-4">🏆 MÁS RECONOCIDO</h3>
                  {(() => {
                    const topMember = grantsLeaderboard.find((entry: any) => entry.user.role === 'MEMBER' && entry.totalDays > 0);
                    return topMember ? (
                      <>
                        <p className="text-4xl font-bold mb-2">{topMember.user?.name || 'Usuario desconocido'}</p>
                        <p className="text-xl text-blue-300">{topMember.totalDays} días ganados</p>
                      </>
                    ) : <p className="text-xl">¡Sé el primero!</p>;
                  })()}
                </div>
              </div>
            </div>
          </>
        );
      }
      
      if (currentSlide === 1) {
        // Slide de líderes en puntos e innovación
        return (
          <div className="grid grid-cols-2 gap-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-4xl font-bold text-purple-400 mb-8 text-center">🌟 CAMPEONES DE INNOVACIÓN</h3>
              <div className="space-y-6">
                {pointsLeaderboard.slice(0, 5).map((entry: any, index: number) => (
                  <div key={entry.user?.id || index} className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                    <div className="flex items-center space-x-6">
                      <div className="text-3xl font-bold text-purple-400">#{index + 1}</div>
                      <div className="text-2xl font-semibold">{entry.user?.name || 'Usuario desconocido'}</div>
                    </div>
                    <div className="text-3xl font-bold text-purple-300">{entry.totalPoints} pts</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-4xl font-bold text-green-400 mb-8 text-center">🏆 ESTRELLAS DEL RECONOCIMIENTO</h3>
              <div className="space-y-6">
                {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER').slice(0, 5).map((entry: any, index: number) => (
                  <div key={entry.user?.id || index} className="flex items-center justify-between p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                    <div className="flex items-center space-x-6">
                      <div className="text-3xl font-bold text-green-400">#{index + 1}</div>
                      <div className="text-2xl font-semibold">{entry.user?.name || 'Usuario desconocido'}</div>
                    </div>
                    <div className="text-3xl font-bold text-green-300">{entry.totalDays} días</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      
      if (currentSlide === 2) {
        // Slide de estadísticas del equipo
        return (
          <div className="grid grid-cols-2 gap-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
              <h3 className="text-4xl font-bold text-orange-400 mb-8 text-center">🏆 MIEMBROS RECONOCIDOS</h3>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-orange-400">
                  {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER' && entry.totalDays > 0).length}
                </div>
                <p className="text-xl text-orange-300">miembros con días ganados</p>
              </div>
              <div className="space-y-4">
                {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER' && entry.totalDays > 0).slice(0, 4).map((entry: any, index: number) => (
                  <div key={entry.user?.id || index} className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                    <div className="text-xl font-semibold">{entry.user?.name || 'Usuario desconocido'}</div>
                    <div className="text-xl font-bold text-orange-300">🏆 {entry.totalDays} días</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-4xl font-bold text-purple-400 mb-8 text-center">📊 ESTADÍSTICAS DEL EQUIPO</h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-purple-500/20 rounded-xl">
                  <span className="text-xl font-medium">Total Puntos de Innovación</span>
                  <span className="text-3xl font-bold text-purple-300">
                    {pointsLeaderboard.reduce((sum: number, entry: any) => sum + entry.totalPoints, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-500/20 rounded-xl">
                  <span className="text-xl font-medium">Total Días HO Otorgados</span>
                  <span className="text-3xl font-bold text-green-300">
                    {grantsLeaderboard.reduce((sum: number, entry: any) => sum + entry.totalDays, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-500/20 rounded-xl">
                  <span className="text-xl font-medium">Miembros Reconocidos</span>
                  <span className="text-3xl font-bold text-blue-300">
                    {grantsLeaderboard.filter((entry: any) => entry.user.role === 'MEMBER' && entry.totalDays > 0).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-indigo-500/20 rounded-xl">
                  <span className="text-xl font-medium">Líderes Innovando</span>
                  <span className="text-3xl font-bold text-indigo-300">
                    {pointsLeaderboard.filter((entry: any) => entry.totalPoints > 0 && (entry.user.role.includes('LEADER') || entry.user.role === 'MANAGER')).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      if (currentSlide === 3) {
        // Slide de reconocimientos por contribución
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h3 className="text-4xl font-bold text-yellow-400 mb-8 text-center">🌟 RECONOCIMIENTOS POR CONTRIBUCIÓN</h3>
            <div className="text-center mb-6">
              <p className="text-xl text-yellow-300">Cada aporte cuenta y merece ser reconocido</p>
            </div>
            
            {specialRecognitions.length > 0 ? (
              <div className="grid grid-cols-2 gap-8">
                {specialRecognitions.slice(0, 4).map((recognition: any) => (
                  <div key={recognition.user.id} className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 shadow-lg">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-12 w-12 bg-yellow-400 rounded-full flex items-center justify-center">
                        <span className="text-yellow-900 font-bold text-lg">
                          {recognition.user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-xl font-bold text-yellow-100">{recognition.user.name}</p>
                        <p className="text-yellow-300">{recognition.nominations.length} nominación{recognition.nominations.length !== 1 ? 'es' : ''}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {recognition.nominations.slice(0, 2).map((nomination: any) => (
                        <div key={nomination.id} className="bg-yellow-400/10 rounded-lg p-3">
                          <p className="text-yellow-200 text-sm">
                            <span className="font-bold">{nomination.nominator.name}:</span> "{nomination.reason}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-yellow-400/20 to-orange-400/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-400/30 shadow-lg">
                  <div className="text-center">
                    <h5 className="text-2xl font-bold text-yellow-100 mb-4">🎯 Nominaciones Destacadas</h5>
                    <p className="text-yellow-200 text-lg leading-relaxed mb-4">
                      Colaboradores que fueron reconocidos por sus aportes valiosos al equipo, 
                      demostrando que cada contribución importa y construye nuestro éxito colectivo.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30 shadow-lg">
                  <div className="text-center">
                    <h5 className="text-2xl font-bold text-blue-100 mb-4">💎 Espíritu de Equipo</h5>
                    <p className="text-blue-200 text-lg leading-relaxed mb-4">
                      Personas que con su actitud, colaboración y dedicación diaria hacen que 
                      nuestro ambiente de trabajo sea extraordinario y motivador para todos.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center mt-8">
              <p className="text-2xl font-bold text-white">
                🙌 ¡Gracias por hacer la diferencia! 🙌
              </p>
            </div>
          </div>
        );
      }
      
      // Slides dinámicos para menciones especiales con imagen
      const imageSlideIndex = currentSlide - 4;
      if (imageSlideIndex >= 0 && imageSlideIndex < mentionsWithImage.length) {
        const mention = mentionsWithImage[imageSlideIndex];
        return (
          <div className="flex items-center justify-center h-full">
            <div className="bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-pink-400/20 backdrop-blur-sm rounded-3xl p-12 border border-yellow-400/30 shadow-2xl max-w-5xl">
              <div className="text-center mb-8">
                <h3 className="text-6xl font-bold text-yellow-400 mb-4">🌟 MENCIÓN ESPECIAL</h3>
                <h4 className="text-4xl font-bold text-white mb-6">{mention.title}</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-12 items-center">
                <div className="text-center">
                  <img 
                    src={mention.imageUrl} 
                    alt={mention.title}
                    className="w-full h-96 object-cover rounded-2xl shadow-2xl border-4 border-yellow-400/30"
                    onError={(e: any) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                
                <div className="space-y-8">
                  <p className="text-2xl text-yellow-100 leading-relaxed">
                    {mention.description}
                  </p>
                  
                  <div className="text-center">
                    <div className="inline-block bg-yellow-400 text-yellow-900 px-8 py-4 rounded-full font-bold text-2xl shadow-lg">
                      ¡Felicitaciones! 🎉
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // Slide para menciones sin imagen (si las hay)
      const noImageSlideIndex = currentSlide - 4 - mentionsWithImage.length;
      if (noImageSlideIndex === 0 && mentionsWithoutImage.length > 0) {
        return (
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
            <h3 className="text-4xl font-bold text-blue-400 mb-8 text-center">🎖️ RECONOCIMIENTOS ESPECIALES</h3>
            {specialMentions?.length > 0 ? (
              <div className="grid grid-cols-2 gap-8">
                {mentionsWithoutImage.map((mention: any) => (
                  <div key={mention.id} className="bg-gradient-to-br from-blue-400/20 to-purple-400/20 backdrop-blur-sm rounded-xl p-6 border border-blue-400/30 shadow-lg">
                    <div className="text-center">
                      <h5 className="text-2xl font-bold text-blue-100 mb-4">{mention.title}</h5>
                      <p className="text-blue-200 text-lg leading-relaxed mb-4">{mention.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Award className="h-24 w-24 mx-auto mb-6 text-blue-300" />
                <p className="text-3xl font-bold">🌟 ¡Próximamente tendremos reconocimientos especiales!</p>
              </div>
            )}
          </div>
        );
      }
      
      // Slide final de momentos de gloria (siempre el último)
      return (
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h3 className="text-4xl font-bold text-blue-400 mb-8 text-center">🎉 MOMENTOS DE GLORIA RECIENTES</h3>
          {recentAchievements.length > 0 ? (
            <div className="grid grid-cols-2 gap-8">
              {recentAchievements.slice(0, 6).map((achievement: any) => (
                <div key={achievement.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 shadow-lg">
                  <div className="text-center mb-4">
                    <div className={`rounded-full p-4 mx-auto mb-3 w-16 h-16 flex items-center justify-center ${achievement.type === 'innovation' ? 'bg-purple-500' :
                      achievement.type === 'recognition' ? 'bg-green-500' :
                        achievement.type === 'nominations' ? 'bg-blue-500' :
                          'bg-orange-500'
                      }`}>
                      {achievement.type === 'innovation' ? <Award className="h-8 w-8 text-white" /> :
                        achievement.type === 'recognition' ? <Trophy className="h-8 w-8 text-white" /> :
                          achievement.type === 'nominations' ? <Users className="h-8 w-8 text-white" /> :
                            <Medal className="h-8 w-8 text-white" />}
                    </div>

                  </div>
                  <p className="text-xl font-semibold mb-3 text-center">{achievement.user?.name || 'Usuario desconocido'}</p>
                  <p className="text-base text-gray-300 text-center leading-relaxed">{achievement.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Award className="h-24 w-24 mx-auto mb-6 text-blue-300" />
              <p className="text-3xl font-bold">🌟 ¡La próxima historia de éxito podría ser tuya!</p>
            </div>
          )}
        </div>
      );
    };

    return (
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-gray-800 text-white overflow-hidden">
        {/* Controles */}
        <div className="absolute top-4 right-4 z-50 flex space-x-2">
          <button onClick={prevSlide} className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button onClick={nextSlide} className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors">
            <ChevronRight className="h-6 w-6" />
          </button>
          <button onClick={togglePresentationMode} className="bg-white/20 hover:bg-white/30 rounded-full p-3 transition-colors">
            <Minimize className="h-6 w-6" />
          </button>
        </div>

        {/* Indicador de diapositiva */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <div key={index} className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/30'
              }`} />
          ))}
        </div>

        <div className="container mx-auto p-8 h-full flex items-center justify-center">
          <div className="w-full">
            {renderSlide()}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón de presentación */}
      <div className="flex justify-end mb-4">
        <button
          onClick={togglePresentationMode}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Maximize className="h-4 w-4" />
          <span>Modo Presentación</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Salón de la Fama 🏆</h1>
        <p className="text-lg text-gray-600">
          ¡Celebramos a nuestros héroes del equipo!
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Reconocimiento, innovación y excelencia en acción
        </p>
      </div>

      {/* Estilos globales para animaciones */}
      <style>{`
        @keyframes borderGradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>

      {/* Top performers showcase */}
      <TopPerformersSection pointsLeaderboard={pointsLeaderboard} grantsLeaderboard={grantsLeaderboard} />

      {/* Leaderboards grid */}
      <LeaderboardsGrid pointsLeaderboard={pointsLeaderboard} grantsLeaderboard={grantsLeaderboard} getRankIcon={getRankIcon} />

      {/* Sección de estadísticas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Miembros en racha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-orange-600">
                {grantsLeaderboard.filter(entry => entry.user.role === 'MEMBER' && entry.grantsCount >= 2).length}
              </div>
              <div>
                <span className="text-orange-800">🔥 Miembros en Racha</span>
                <p className="text-sm text-orange-600 font-normal">Reconocidos en múltiples períodos</p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {grantsLeaderboard
                .filter(entry => entry.user.role === 'MEMBER' && entry.grantsCount >= 2)
                .map((entry, index) => (
                  <div key={entry.user?.id || index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-500 rounded-full p-2 relative">
                        <TrendingUp className="h-4 w-4 text-white" />
                        <div className="absolute -inset-1 bg-orange-400/50 rounded-full animate-ping"></div>
                      </div>
                      <div>
                        <p className="font-medium text-orange-900">{entry.user?.name || 'Usuario desconocido'}</p>
                        <p className="text-sm text-orange-700">{entry.totalDays} días ganados</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-200 text-orange-800 animate-pulse">
                      🔥 {entry.grantsCount} períodos
                    </Badge>
                  </div>
                ))}
              {grantsLeaderboard.filter(entry => entry.user.role === 'MEMBER' && entry.grantsCount >= 2).length === 0 && (
                <div className="text-center py-8 text-orange-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 text-orange-300" />
                  <p className="font-medium">🔥 ¡Sé el primero en crear una racha!</p>
                  <p className="text-sm text-orange-400 mt-2">Mantén tu excelencia por varios períodos consecutivos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas del equipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-800">📊 Estadísticas del Equipo</CardTitle>
            <p className="text-sm text-purple-600">Resumen histórico del rendimiento colectivo</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 rounded-full p-2">
                    <Award className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-purple-900">Total Puntos de Innovación</span>
                </div>
                <span className="text-xl font-bold text-purple-700">
                  {pointsLeaderboard.reduce((sum, entry) => sum + entry.totalPoints, 0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 rounded-full p-2">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-green-900">Total Días HO Otorgados</span>
                </div>
                <span className="text-xl font-bold text-green-700">
                  {grantsLeaderboard.reduce((sum, entry) => sum + entry.totalDays, 0)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 rounded-full p-2">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-blue-900">Miembros Reconocidos</span>
                </div>
                <span className="text-xl font-bold text-blue-700">
                  {grantsLeaderboard.filter(entry => entry.user.role === 'MEMBER' && entry.totalDays > 0).length}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-500 rounded-full p-2">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  <span className="font-medium text-indigo-900">Líderes Innovando</span>
                </div>
                <span className="text-xl font-bold text-indigo-700">
                  {pointsLeaderboard.filter(entry => entry.totalPoints > 0 && (entry.user.role.includes('LEADER') || entry.user.role === 'MANAGER')).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reconocimientos por Contribución */}
      <RecognitionsSection />

      {/* Recent achievements */}
      <RecentAchievementsSection recentAchievements={recentAchievements} safeFormat={safeFormat} />


    </div>
  );
}