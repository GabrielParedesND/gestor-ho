import { apiClient } from '../lib/api';
import { fallbackUsers, fallbackPeriods } from '../lib/fallbackData';
import type { Vote, User } from '@prisma/client';

export const votingService = {
  async getVotesForPeriod(periodId: string): Promise<(Vote & { voter?: User; targetUser?: User })[]> {
    try {
      return await apiClient.getVotesForPeriod(periodId);
    } catch (error) {
      console.warn('Usando datos de respaldo para votos');
      return []; // Retornar array vacío como respaldo
    }
  },

  async getMyVotesForPeriod(periodId: string, voterId: string): Promise<(Vote & { targetUser?: User })[]> {
    try {
      const allVotes = await apiClient.getVotesForPeriod(periodId);
      return allVotes.filter((vote: any) => vote.voterId === voterId);
    } catch (error) {
      console.warn('Usando datos de respaldo para mis votos');
      return [];
    }
  },

  async castVote(
    periodId: string,
    voterId: string,
    targetUserId: string,
    comment?: string
  ): Promise<Vote & { targetUser?: User }> {
    try {
      return await apiClient.castVote({
        periodId,
        voterId,
        targetUserId,
        comment,
      });
    } catch (error) {
      console.warn('Modo de respaldo: voto simulado');
      const targetUser = fallbackUsers.find(u => u.id === targetUserId);
      return {
        id: Date.now().toString(),
        periodId,
        voterId,
        targetUserId,
        weight: 1,
        comment: comment || null,
        createdAt: new Date(),
        updatedAt: new Date(),
        targetUser,
      } as any;
    }
  },

  async removeVote(periodId: string, voterId: string, targetUserId: string): Promise<void> {
    try {
      await apiClient.castVote({
        periodId,
        voterId,
        targetUserId,
        comment: null,
        remove: true,
      });
    } catch (error) {
      console.warn('Modo de respaldo: eliminación de voto simulada');
      // En modo de respaldo, simplemente no hacemos nada
    }
  },

  async getCandidatesForPeriod(periodId: string): Promise<User[]> {
    try {
      return await apiClient.getCandidatesForPeriod(periodId);
    } catch (error) {
      console.warn('Usando datos de respaldo para candidatos');
      return fallbackUsers.filter(u => u.role !== 'ADMIN' && u.role !== 'MANAGER');
    }
  },

  async getVotingSummary(periodId: string) {
    const votes = await this.getVotesForPeriod(periodId);
    const candidates = await this.getCandidatesForPeriod(periodId);

    const summary = candidates.map(candidate => {
      const userVotes = votes.filter(v => v.targetUserId === candidate.id);
      const voterNames = userVotes.map(v => v.voter?.name).filter(Boolean);
      
      return {
        user: candidate,
        voteCount: userVotes.length,
        voters: voterNames,
        hasManagerVote: userVotes.some(v => v.voter?.role === 'MANAGER'),
      };
    });

    return summary.sort((a, b) => b.voteCount - a.voteCount);
  },
};