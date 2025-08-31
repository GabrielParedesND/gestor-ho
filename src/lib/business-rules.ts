import type { Vote, User, UserRole } from './supabase';

// Deterministic random number generator using period ID as seed
function seedrandom(seed: string): () => number {
  let x = 0;
  for (let i = 0; i < seed.length; i++) {
    x = ((x << 5) - x + seed.charCodeAt(i)) & 0xffffffff;
  }
  
  return function() {
    x = Math.imul(16807, x) & 0x7fffffff;
    return x / 0x80000000;
  };
}

export interface VotingResult {
  rawVotes: number;
  countedVotes: number;
  discardedVoterId?: string;
  managerIncluded: boolean;
  resultDays: number;
}

export const businessRules = {
  // Calculate voting results for a user in a specific period
  calculateVotingResult(
    votes: Vote[], 
    targetUserId: string, 
    periodId: string
  ): VotingResult {
    // Get votes for this specific user
    const userVotes = votes.filter(v => v.target_user_id === targetUserId);
    const rawVotes = userVotes.length;
    
    if (rawVotes === 0) {
      return {
        rawVotes: 0,
        countedVotes: 0,
        managerIncluded: false,
        resultDays: 0,
      };
    }

    // If we have exactly 3 or fewer votes, count them all
    if (rawVotes <= 3) {
      const managerVote = userVotes.some(v => v.voter?.role === 'MANAGER');
      const days = this.calculateDaysFromVotes(rawVotes, managerVote);
      
      return {
        rawVotes,
        countedVotes: rawVotes,
        managerIncluded: managerVote,
        resultDays: days,
      };
    }

    // If we have 4 votes, discard one randomly (deterministic)
    const rng = seedrandom(`${periodId}-${targetUserId}`);
    const discardIndex = Math.floor(rng() * userVotes.length);
    const discardedVote = userVotes[discardIndex];
    const countedVotes = userVotes.filter((_, index) => index !== discardIndex);
    
    const managerIncluded = countedVotes.some(v => v.voter?.role === 'MANAGER');
    const days = this.calculateDaysFromVotes(countedVotes.length, managerIncluded);

    return {
      rawVotes,
      countedVotes: countedVotes.length,
      discardedVoterId: discardedVote.voter_id,
      managerIncluded,
      resultDays: days,
    };
  },

  // Calculate days based on vote count and manager inclusion
  calculateDaysFromVotes(voteCount: number, managerIncluded: boolean): number {
    if (voteCount < 2) return 0;
    if (voteCount === 2) return 1;
    if (voteCount === 3) {
      return managerIncluded ? 3 : 2;
    }
    return 0; // Should not happen with proper logic
  },

  // Check if user meets quorum requirements
  meetsQuorum(voteCount: number, minQuorum: number = 3): boolean {
    return voteCount >= Math.min(minQuorum, 3); // Max 3 counted votes
  },

  // Role-based permissions
  getVotingRoles(): UserRole[] {
    return ['MANAGER', 'LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA'];
  },

  getCandidateRoles(): UserRole[] {
    return ['MEMBER']; // By default, only members are candidates
  },

  getLeaderRoles(): UserRole[] {
    return ['LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA'];
  },

  // Innovation points calculation
  calculateBonusDaysFromPoints(points: number, pointsPerDay: number = 4): number {
    return Math.floor(points / pointsPerDay);
  },

  // Grant expiration
  isGrantExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  },

  // Check if grant expires soon (within 7 days)
  isGrantExpiringSoon(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return expiryDate <= sevenDaysFromNow && expiryDate > now;
  },

  // Validate initiative completion for leaders
  canLeaderGetBonusDay(initiative: any): boolean {
    return initiative.status === 'ADOPTED' || initiative.status === 'IMPACTFUL';
  },

  // Generate special vote days (1-3 random)
  generateSpecialVoteDays(seed: string): number {
    const rng = seedrandom(seed);
    return Math.floor(rng() * 3) + 1; // 1-3 days
  },
};