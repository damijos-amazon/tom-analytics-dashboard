-- Performance indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON public.users(last_login);

-- Performance indexes for table_data
CREATE INDEX IF NOT EXISTS idx_table_data_table_id ON public.table_data(table_id);
CREATE INDEX IF NOT EXISTS idx_table_data_employee_name ON public.table_data(employee_name);
CREATE INDEX IF NOT EXISTS idx_table_data_created_by ON public.table_data(created_by);
CREATE INDEX IF NOT EXISTS idx_table_data_updated_at ON public.table_data(updated_at);
CREATE INDEX IF NOT EXISTS idx_table_data_composite ON public.table_data(table_id, employee_name);

-- Performance indexes for table_configurations
CREATE INDEX IF NOT EXISTS idx_table_configurations_created_at ON public.table_configurations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_table_configurations_version ON public.table_configurations(version);

-- Performance indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_composite ON public.audit_logs(user_id, action, created_at DESC);

-- Performance indexes for employee_records
CREATE INDEX IF NOT EXISTS idx_employee_records_updated_at ON public.employee_records(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_records_created_by ON public.employee_records(created_by);

-- Performance indexes for sso_config
CREATE INDEX IF NOT EXISTS idx_sso_config_provider ON public.sso_config(provider);
CREATE INDEX IF NOT EXISTS idx_sso_config_enabled ON public.sso_config(enabled);
