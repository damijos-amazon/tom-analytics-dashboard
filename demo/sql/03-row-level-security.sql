-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sso_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can view their own record
CREATE POLICY "Users can view own record"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- Super admin can insert users (during SSO first login)
CREATE POLICY "Super admin can insert users"
ON public.users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- Super admin can modify users
CREATE POLICY "Super admin can modify users"
ON public.users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- Admins can update user status (for blocking)
CREATE POLICY "Admins can update user status"
ON public.users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    -- Cannot modify super_admin accounts
    role != 'super_admin'
);

-- Users can update their own last_login
CREATE POLICY "Users can update own last_login"
ON public.users FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLE_DATA POLICIES
-- ============================================

-- All authenticated users can read table data
CREATE POLICY "Authenticated users can read table data"
ON public.table_data FOR SELECT
USING (auth.role() = 'authenticated');

-- All authenticated users can insert table data
CREATE POLICY "Authenticated users can insert table data"
ON public.table_data FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update table data
CREATE POLICY "Authenticated users can update table data"
ON public.table_data FOR UPDATE
USING (auth.role() = 'authenticated');

-- All authenticated users can delete table data
CREATE POLICY "Authenticated users can delete table data"
ON public.table_data FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- TABLE_CONFIGURATIONS POLICIES
-- ============================================

-- All authenticated users can read configurations
CREATE POLICY "Authenticated users can read configurations"
ON public.table_configurations FOR SELECT
USING (auth.role() = 'authenticated');

-- All authenticated users can insert configurations
CREATE POLICY "Authenticated users can insert configurations"
ON public.table_configurations FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update configurations
CREATE POLICY "Authenticated users can update configurations"
ON public.table_configurations FOR UPDATE
USING (auth.role() = 'authenticated');

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================

-- All authenticated users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
);

-- ============================================
-- EMPLOYEE_RECORDS POLICIES
-- ============================================

-- All authenticated users can read employee records
CREATE POLICY "Authenticated users can read employee records"
ON public.employee_records FOR SELECT
USING (auth.role() = 'authenticated');

-- All authenticated users can insert employee records
CREATE POLICY "Authenticated users can insert employee records"
ON public.employee_records FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- All authenticated users can update employee records
CREATE POLICY "Authenticated users can update employee records"
ON public.employee_records FOR UPDATE
USING (auth.role() = 'authenticated');

-- ============================================
-- SSO_CONFIG POLICIES
-- ============================================

-- Only super admin can read SSO config
CREATE POLICY "Super admin can read SSO config"
ON public.sso_config FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- Only super admin can insert SSO config
CREATE POLICY "Super admin can insert SSO config"
ON public.sso_config FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);

-- Only super admin can update SSO config
CREATE POLICY "Super admin can update SSO config"
ON public.sso_config FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
    )
);
