/*
# Sistema de Incentivo de Home Office - Schema Inicial

## Tablas principales:
1. **Users** - Usuarios del sistema con roles y equipos
2. **Teams** - Equipos de trabajo (opcional)
3. **Periods** - Períodos de votación semanales
4. **Candidates** - Candidatos elegibles por período
5. **Votes** - Votos emitidos por los líderes
6. **Tallies** - Resultados calculados por usuario/período
7. **Innovation Points** - Puntos de gamificación
8. **Initiatives** - Iniciativas de los líderes
9. **Home Office Grants** - Días de HO otorgados
10. **Audit Logs** - Registro completo de auditoría
11. **Settings** - Configuraciones del sistema

## Seguridad:
- RLS habilitado en todas las tablas
- Políticas por rol y contexto
- Auditoría completa de cambios
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA', 'MEMBER');
CREATE TYPE period_status AS ENUM ('OPEN', 'VOTING', 'CLOSED');
CREATE TYPE initiative_type AS ENUM ('DEV', 'PO', 'INFRA');
CREATE TYPE initiative_status AS ENUM ('DRAFT', 'PLANNED', 'ADOPTED', 'IMPACTFUL');
CREATE TYPE grant_source AS ENUM ('NORMAL', 'SPECIAL', 'POINTS', 'BONUS');

-- Teams table
CREATE TABLE teams (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    email text UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'MEMBER',
    team_id uuid REFERENCES teams(id),
    active boolean DEFAULT true,
    avatar_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Periods table
CREATE TABLE periods (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_label text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    status period_status DEFAULT 'OPEN',
    timezone text DEFAULT 'America/Mexico_City',
    closed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Candidates table
CREATE TABLE candidates (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    role_at_period user_role NOT NULL,
    notes text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, period_id)
);

-- Votes table
CREATE TABLE votes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    voter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight integer DEFAULT 1,
    comment text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(period_id, voter_id, target_user_id)
);

-- Tallies table (resultados calculados)
CREATE TABLE tallies (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id uuid NOT NULL REFERENCES periods(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_votes integer DEFAULT 0,
    counted_votes integer DEFAULT 0,
    discarded_voter_id uuid REFERENCES users(id),
    manager_included boolean DEFAULT false,
    result_days integer DEFAULT 0,
    calculation_seed text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(period_id, user_id)
);

-- Innovation Points table
CREATE TABLE innovation_points (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_id uuid REFERENCES periods(id) ON DELETE CASCADE,
    value integer DEFAULT 1,
    reason text NOT NULL,
    approved_by uuid REFERENCES users(id),
    approved_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- Initiatives table
CREATE TABLE initiatives (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_id uuid REFERENCES periods(id) ON DELETE CASCADE,
    type initiative_type NOT NULL,
    title text NOT NULL,
    description text,
    status initiative_status DEFAULT 'DRAFT',
    kpi_impact jsonb,
    approved boolean DEFAULT false,
    approved_by uuid REFERENCES users(id),
    approved_at timestamptz,
    attachment_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Home Office Grants table
CREATE TABLE home_office_grants (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_id uuid REFERENCES periods(id) ON DELETE CASCADE,
    days integer NOT NULL,
    source grant_source DEFAULT 'NORMAL',
    expires_at timestamptz,
    redeemed boolean DEFAULT false,
    redeemed_at timestamptz,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- Audit Logs table
CREATE TABLE audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text NOT NULL,
    old_values jsonb,
    new_values jsonb,
    meta jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamptz DEFAULT now()
);

-- Settings table
CREATE TABLE settings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_by uuid REFERENCES users(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_periods_status ON periods(status);
CREATE INDEX idx_periods_dates ON periods(start_date, end_date);
CREATE INDEX idx_votes_period ON votes(period_id);
CREATE INDEX idx_votes_voter ON votes(voter_id);
CREATE INDEX idx_tallies_period ON tallies(period_id);
CREATE INDEX idx_innovation_points_user ON innovation_points(user_id);
CREATE INDEX idx_initiatives_user ON initiatives(user_id);
CREATE INDEX idx_initiatives_period ON initiatives(period_id);
CREATE INDEX idx_grants_user ON home_office_grants(user_id);
CREATE INDEX idx_grants_expires ON home_office_grants(expires_at) WHERE NOT redeemed;
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);

-- Enable RLS on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tallies ENABLE ROW LEVEL SECURITY;
ALTER TABLE innovation_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE home_office_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM users 
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN get_user_role() = 'ADMIN';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is manager or admin
CREATE OR REPLACE FUNCTION is_manager_or_admin()
RETURNS boolean AS $$
BEGIN
    RETURN get_user_role() IN ('ADMIN', 'MANAGER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is leader
CREATE OR REPLACE FUNCTION is_leader()
RETURNS boolean AS $$
BEGIN
    RETURN get_user_role() IN ('LEADER_DEV', 'LEADER_PO', 'LEADER_INFRA', 'MANAGER');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies

-- Teams policies
CREATE POLICY "Teams are viewable by authenticated users"
    ON teams FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Teams manageable by admins"
    ON teams FOR ALL
    TO authenticated
    USING (is_admin());

-- Users policies
CREATE POLICY "Users can view their own data"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id OR is_manager_or_admin());

CREATE POLICY "All authenticated can view basic user info"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage users"
    ON users FOR ALL
    TO authenticated
    USING (is_admin());

-- Periods policies
CREATE POLICY "Periods are viewable by authenticated users"
    ON periods FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Periods manageable by admins"
    ON periods FOR ALL
    TO authenticated
    USING (is_admin());

-- Candidates policies
CREATE POLICY "Candidates viewable by authenticated users"
    ON candidates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Candidates manageable by admins"
    ON candidates FOR ALL
    TO authenticated
    USING (is_admin());

-- Votes policies
CREATE POLICY "Users can view votes in open periods"
    ON votes FOR SELECT
    TO authenticated
    USING (
        is_manager_or_admin() OR 
        voter_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM periods p 
            WHERE p.id = period_id AND p.status IN ('OPEN', 'VOTING')
        )
    );

CREATE POLICY "Leaders can vote"
    ON votes FOR INSERT
    TO authenticated
    WITH CHECK (
        is_leader() AND 
        voter_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM periods p 
            WHERE p.id = period_id AND p.status = 'OPEN'
        )
    );

CREATE POLICY "Leaders can update their votes"
    ON votes FOR UPDATE
    TO authenticated
    USING (
        voter_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM periods p 
            WHERE p.id = period_id AND p.status = 'OPEN'
        )
    );

-- Tallies policies
CREATE POLICY "Tallies viewable by authenticated users"
    ON tallies FOR SELECT
    TO authenticated
    USING (
        is_manager_or_admin() OR 
        user_id = auth.uid()
    );

CREATE POLICY "Tallies manageable by admins"
    ON tallies FOR ALL
    TO authenticated
    USING (is_admin());

-- Innovation points policies
CREATE POLICY "Innovation points viewable by all authenticated"
    ON innovation_points FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create innovation points"
    ON innovation_points FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Managers can approve innovation points"
    ON innovation_points FOR UPDATE
    TO authenticated
    USING (is_manager_or_admin());

-- Initiatives policies
CREATE POLICY "Initiatives viewable by all authenticated"
    ON initiatives FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Leaders can create initiatives"
    ON initiatives FOR INSERT
    TO authenticated
    WITH CHECK (is_leader() AND user_id = auth.uid());

CREATE POLICY "Leaders can update their initiatives"
    ON initiatives FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() OR is_manager_or_admin());

-- Home office grants policies
CREATE POLICY "Users can view their grants"
    ON home_office_grants FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() OR is_manager_or_admin());

CREATE POLICY "Grants manageable by admins"
    ON home_office_grants FOR ALL
    TO authenticated
    USING (is_admin());

-- Audit logs policies
CREATE POLICY "Audit logs viewable by managers and admins"
    ON audit_logs FOR SELECT
    TO authenticated
    USING (is_manager_or_admin());

CREATE POLICY "Anyone can create audit logs"
    ON audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Settings policies
CREATE POLICY "Settings viewable by authenticated users"
    ON settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Settings manageable by admins"
    ON settings FOR ALL
    TO authenticated
    USING (is_admin());

-- Insert default settings
INSERT INTO settings (key, value, description) VALUES
    ('friday_hour', '17', 'Hour to close periods (24h format)'),
    ('timezone', '"America/Mexico_City"', 'Default timezone for period evaluation'),
    ('min_quorum', '3', 'Minimum votes required for valid results'),
    ('grant_expiry_days', '60', 'Days until HO grants expire'),
    ('points_for_bonus_day', '4', 'Innovation points needed for bonus day');