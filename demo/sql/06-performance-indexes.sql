-- Performance Optimization Indexes
-- Add indexes to frequently queried columns for improved query performance

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at DESC);

-- Table data indexes
CREATE INDEX IF NOT EXISTS idx_table_data_table_id ON public.table_data(table_id);
CREATE INDEX IF NOT EXISTS idx_table_data_employee_name ON public.table_data(employee_name);
CREATE INDEX IF NOT EXISTS idx_table_data_created_by ON public.table_data(created_by);
CREATE INDEX IF NOT EXISTS idx_table_data_updated_at ON public.table_data(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_data_composite ON public.table_data(table_id, employee_name);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON public.audit_logs(user_id, action, created_at DESC);

-- Table configurations indexes
CREATE INDEX IF NOT EXISTS idx_table_configurations_created_by ON public.table_configurations(created_by);
CREATE INDEX IF NOT EXISTS idx_table_configurations_created_at ON public.table_configurations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_configurations_version ON public.table_configurations(version DESC);

-- Employee records indexes
CREATE INDEX IF NOT EXISTS idx_employee_records_updated_at ON public.employee_records(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_records_created_by ON public.employee_records(created_by);

-- SSO config indexes
CREATE INDEX IF NOT EXISTS idx_sso_config_provider ON public.sso_config(provider);
CREATE INDEX IF NOT EXISTS idx_sso_config_enabled ON public.sso_config(enabled);

-- GIN indexes for JSONB columns (for faster JSON queries)
CREATE INDEX IF NOT EXISTS idx_table_data_data_gin ON public.table_data USING GIN(data);
CREATE INDEX IF NOT EXISTS idx_table_configurations_config_gin ON public.table_configurations USING GIN(config);
CREATE INDEX IF NOT EXISTS idx_employee_records_data_gin ON public.employee_records USING GIN(employee_data);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details_gin ON public.audit_logs USING GIN(details);

-- Partial indexes for active users (more efficient for common queries)
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(id, email, role) 
WHERE status = 'active';

-- Partial index for recent audit logs (last 90 days)
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent ON public.audit_logs(created_at DESC, user_id, action)
WHERE created_at > NOW() - INTERVAL '90 days';

-- Comments for documentation
COMMENT ON INDEX idx_users_email IS 'Index for user lookup by email';
COMMENT ON INDEX idx_table_data_composite IS 'Composite index for table data queries by table_id and employee_name';
COMMENT ON INDEX idx_audit_logs_composite IS 'Composite index for audit log queries by user, action, and date';
COMMENT ON INDEX idx_users_active IS 'Partial index for active users only';
COMMENT ON INDEX idx_audit_logs_recent IS 'Partial index for recent audit logs (90 days)';
