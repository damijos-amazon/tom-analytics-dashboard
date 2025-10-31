-- ============================================
-- TOM Analytics Dashboard - Database Schema
-- ============================================
-- This script creates all necessary tables for the authentication and database system
-- Run this script in your Supabase SQL Editor after creating a new project

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE
-- ============================================
-- Extends Supabase auth.users with role and status information
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

-- Add index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================
-- 2. TABLE DATA STORAGE
-- ============================================
-- Stores all table data from the dashboard
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

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_table_data_table_id ON public.table_data(table_id);
CREATE INDEX IF NOT EXISTS idx_table_data_employee_name ON public.table_data(employee_name);
CREATE INDEX IF NOT EXISTS idx_table_data_updated_at ON public.table_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_data_data_gin ON public.table_data USING GIN(data);

-- ============================================
-- 3. TABLE CONFIGURATIONS
-- ============================================
-- Stores table configuration with versioning
CREATE TABLE IF NOT EXISTS public.table_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for version queries
CREATE INDEX IF NOT EXISTS idx_table_configurations_created_at ON public.table_configurations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_configurations_version ON public.table_configurations(version DESC);

-- ============================================
-- 4. AUDIT LOGS
-- ============================================
-- Records all user actions for compliance and security
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

-- Add indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);

-- ============================================
-- 5. EMPLOYEE RECORDS
-- ============================================
-- Stores employee data for the dashboard
CREATE TABLE IF NOT EXISTS public.employee_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_data JSONB NOT NULL,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_records_updated_at ON public.employee_records(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_records_data_gin ON public.employee_records USING GIN(employee_data);

-- ============================================
-- 6. SSO CONFIGURATION
-- ============================================
-- Stores SSO provider configurations (encrypted)
CREATE TABLE IF NOT EXISTS public.sso_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL UNIQUE,
    config JSONB NOT NULL,
    enabled BOOLEAN DEFAULT true,
    updated_by UUID REFERENCES public.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for provider lookups
CREATE INDEX IF NOT EXISTS idx_sso_config_provider ON public.sso_config(provider);
CREATE INDEX IF NOT EXISTS idx_sso_config_enabled ON public.sso_config(enabled);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
-- Automatically update updated_at timestamp

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
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
