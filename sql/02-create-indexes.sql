-- TOM Analytics Dashboard - Database Indexes
-- This script creates indexes for performance optimization

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- Table data indexes
CREATE INDEX IF NOT EXISTS idx_table_data_table_id ON public.table_data(table_id);
CREATE INDEX IF NOT EXISTS idx_table_data_employee_name ON public.table_data(employee_name);
CREATE INDEX IF NOT EXISTS idx_table_data_created_by ON public.table_data(created_by);
CREATE INDEX IF NOT EXISTS idx_table_data_updated_at ON public.table_data(updated_at);

-- Table configurations indexes
CREATE INDEX IF NOT EXISTS idx_table_configurations_created_at ON public.table_configurations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_configurations_created_by ON public.table_configurations(created_by);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);

-- Employee records indexes
CREATE INDEX IF NOT EXISTS idx_employee_records_updated_at ON public.employee_records(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_records_created_by ON public.employee_records(created_by);

-- SSO config indexes
CREATE INDEX IF NOT EXISTS idx_sso_config_provider ON public.sso_config(provider);
CREATE INDEX IF NOT EXISTS idx_sso_config_enabled ON public.sso_config(enabled);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_table_data_table_employee ON public.table_data(table_id, employee_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON public.audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_range ON public.audit_logs(created_at DESC, user_id);
