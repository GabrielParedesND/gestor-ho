import React, { useEffect, useState } from 'react';
import { Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { VotingCard } from '../components/voting/VotingCard';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import { periodService } from '../services/periodService';
import { votingService } from '../services/votingService';
import { useAuditLog } from '../hooks/useAuditLog';
import { safeFormat } from '../lib/dateUtils';
import toast from 'react-hot-toast';

export function Voting() {
  const { user, canVote } = useAuth();
  const { log } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [myVotes, setMyVotes] = useState([]);
  const [votingSummary, setVotingSummary] = useState([]);

  useEffect(() => {
    if (canVote) {
      loadVotingData();
    }
  }, [user?.id, canVote]);

  const loadVotingData = async () => {
    if (!user) return;

    try {
      const period = await periodService.getCurrentPeriod();
      if (!period) {
        return;
      }

      setCurrentPeriod(period);

      const [candidatesList, votes, summary] = await Promise.all([
        votingService.getCandidatesForPeriod(period.id),
        votingService.getMyVotesForPeriod(period.id, user.id),
        votingService.getVotingSummary(period.id),
      ]);

      setCandidates(candidatesList);
      setMyVotes(votes);
      setVotingSummary(summary);

    } catch (error) {
      console.error('Error loading voting data:', error);
      toast.error('Error al cargar los datos de votación');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (targetUserId: string, comment?: string) => {
    if (!currentPeriod || !user) return;

    try {
      await votingService.castVote(currentPeriod.id, user.id, targetUserId, comment);
      
      await log({
        action: 'VOTE_CAST',
        entity: 'vote',
        entityId: `${currentPeriod.id}-${targetUserId}`,
        newValues: { targetUserId, comment },
      });

      toast.success('Voto registrado correctamente');
      loadVotingData();
    } catch (error) {
      console.error('Error casting vote:', error);
      toast.error('Error al registrar el voto');
    }
  };

  const handleRemoveVote = async (targetUserId: string) => {
    if (!currentPeriod || !user) return;

    try {
      await votingService.removeVote(currentPeriod.id, user.id, targetUserId);
      
      await log({
        action: 'VOTE_REMOVED',
        entity: 'vote',
        entityId: `${currentPeriod.id}-${targetUserId}`,
      });

      toast.success('Voto eliminado');
      loadVotingData();
    } catch (error) {
      console.error('Error removing vote:', error);
      toast.error('Error al eliminar el voto');
    }
  };

  if (!canVote) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Acceso Restringido</h2>
        <p className="text-gray-600 mt-2">
          Solo los líderes y gerentes pueden participar en las votaciones.
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
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">No hay período activo</h2>
        <p className="text-gray-600 mt-2">
          Actualmente no hay ningún período de votación abierto.
        </p>
      </div>
    );
  }

  const getVoteForCandidate = (candidateId: string) => {
    return myVotes.find(vote => vote.targetUserId === candidateId);
  };

  const votedCount = myVotes.length;
  const totalCandidates = candidates.length;
  const votingProgress = totalCandidates > 0 ? (votedCount / totalCandidates) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Votaciones</h1>
        <p className="text-gray-600">
          Vota por los miembros del equipo para el período: {currentPeriod.week_label}
        </p>
      </div>

      {/* Period info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Información del Período</CardTitle>
            <Badge variant="success">Votación Abierta</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Período</p>
              <p className="font-medium">{currentPeriod.weekLabel || currentPeriod.week_label}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha límite</p>
              <p className="font-medium">
                {safeFormat(currentPeriod.endDate || currentPeriod.end_date, 'PPP')} - 17:00
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Votos emitidos</p>
              <p className="font-medium">
                {votedCount} de {totalCandidates} candidatos
                {votedCount > 0 && (
                  <CheckCircle className="h-4 w-4 text-green-500 inline ml-2" />
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Opcional votar por todos
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voting list */}
      <Card>
        <CardHeader>
          <CardTitle>Candidatos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const vote = getVoteForCandidate(candidate.id);
              return (
                <div key={candidate.id} className="block md:hidden">
                  <VotingCard
                    user={candidate}
                    hasVoted={!!vote}
                    comment={vote?.comment}
                    onVote={handleVote}
                    onRemoveVote={handleRemoveVote}
                    disabled={currentPeriod.status !== 'OPEN'}
                  />
                </div>
              );
            })}
            
            {/* Desktop view - single line */}
            <div className="hidden md:block space-y-3">
              {candidates.map((candidate) => {
                const vote = getVoteForCandidate(candidate.id);
                return (
                  <VotingCard
                    key={candidate.id}
                    user={candidate}
                    hasVoted={!!vote}
                    comment={vote?.comment}
                    onVote={handleVote}
                    onRemoveVote={handleRemoveVote}
                    disabled={currentPeriod.status !== 'OPEN'}
                  />
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voting summary for managers */}
      {user?.role === 'MANAGER' && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Votaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {votingSummary.map((summary) => (
                <div key={summary.user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{summary.user.name}</p>
                      <p className="text-sm text-gray-600">
                        {summary.voteCount} votos • 
                        {summary.hasManagerVote ? ' Incluye tu voto' : ' Sin tu voto'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={
                        summary.voteCount >= 3 ? 'success' :
                        summary.voteCount === 2 ? 'warning' : 'default'
                      }
                    >
                      {summary.voteCount >= 3 ? '3 días' : 
                       summary.voteCount === 2 ? '1 día' : 'Sin días'}
                    </Badge>
                    {summary.voters.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        De: {summary.voters.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent>
          <div className="flex items-start space-x-3">
            <div className="bg-blue-500 rounded-full p-1">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900">Instrucciones de Votación</h4>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• <strong>Vota A FAVOR</strong> de los miembros que consideres merecen días de Home Office</li>
                <li>• <strong>No es obligatorio</strong> votar por todos los candidatos</li>
                <li>• Puedes agregar comentarios opcionales para justificar tu voto</li>
                <li>• Puedes cambiar o eliminar tus votos hasta el viernes a las 17:00</li>
                <li>• Se descartará 1 voto al azar si hay más de 4 votos para el mismo candidato</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}