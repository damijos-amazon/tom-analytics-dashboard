-- TOM Analytics Dashboard - Database Schema
-- This script creates all necessary tables for the authentication and database system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('super_admin', 'admin', 'manager')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    blocked_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES public.users(id),
    block_reason TEXT
);

-- Table data storage
CREATE TABLE IF NOT EXISTS public.table_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    data JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(table_id, employee_name)
);

-- Table configurations
CREATE TABLE IF NOT EXISTS public.table_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee records
CREATE TABLE IF NOT EXISTS public.employee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_data JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SSO configuration (encrypted)
CREATE TABLE IF NOT EXISTS public.sso_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL UNIQUE,
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_data_updated_at BEFORE UPDATE ON public.table_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_configurations_updated_at BEFORE UPDATE ON public.table_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_records_updated_at BEFORE UPDATE ON public.employee_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_config_updated_at BEFORE UPDATE ON public.sso_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
