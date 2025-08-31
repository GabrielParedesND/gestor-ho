import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type UserRole = 'ADMIN' | 'MANAGER' | 'LEADER_DEV' | 'LEADER_PO' | 'LEADER_INFRA' | 'MEMBER';
export type PeriodStatus = 'OPEN' | 'VOTING' | 'CLOSED';
export type InitiativeType = 'DEV' | 'PO' | 'INFRA';
export type InitiativeStatus = 'DRAFT' | 'PLANNED' | 'ADOPTED' | 'IMPACTFUL';
export type GrantSource = 'NORMAL' | 'SPECIAL' | 'POINTS' | 'BONUS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  team_id?: string;
  active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Period {
  id: string;
  week_label: string;
  start_date: string;
  end_date: string;
  status: PeriodStatus;
  timezone: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  user_id: string;
  period_id: string;
  role_at_period: UserRole;
  notes?: string;
  created_at: string;
  user?: User;
}

export interface Vote {
  id: string;
  period_id: string;
  voter_id: string;
  target_user_id: string;
  weight: number;
  comment?: string;
  created_at: string;
  updated_at: string;
  voter?: User;
  target_user?: User;
}

export interface Tally {
  id: string;
  period_id: string;
  user_id: string;
  raw_votes: number;
  counted_votes: number;
  discarded_voter_id?: string;
  manager_included: boolean;
  result_days: number;
  calculation_seed?: string;
  created_at: string;
  user?: User;
  discarded_voter?: User;
}

export interface InnovationPoint {
  id: string;
  user_id: string;
  period_id?: string;
  value: number;
  reason: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
  user?: User;
  approver?: User;
}

export interface Initiative {
  id: string;
  user_id: string;
  period_id?: string;
  type: InitiativeType;
  title: string;
  description?: string;
  status: InitiativeStatus;
  kpi_impact?: any;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  approver?: User;
}

export interface HomeOfficeGrant {
  id: string;
  user_id: string;
  period_id?: string;
  days: number;
  source: GrantSource;
  expires_at?: string;
  redeemed: boolean;
  redeemed_at?: string;
  notes?: string;
  created_at: string;
  user?: User;
  period?: Period;
}

export interface AuditLog {
  id: string;
  actor_user_id?: string;
  action: string;
  entity: string;
  entity_id: string;
  old_values?: any;
  new_values?: any;
  meta?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  actor?: User;
}

export interface Setting {
  id: string;
  key: string;
  value: any;
  description?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}