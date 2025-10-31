-- ============================================
-- TOM Analytics Dashboard - Row Level Security (RLS) Policies
-- ============================================
-- This script configures RLS policies for all tables
-- Run this script after creating the tables

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
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

-- Admins and super admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND status = 'active'
    )
);

-- Only super admin can insert new users (typically handled by auth triggers)
CREATE POLICY "Super admin can insert users"
ON public.users FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
        AND status = 'active'
    )
);

-- Only super admin can modify users
CREATE POLICY "Super admin can modify users"
ON public.users FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
        AND status = 'active'
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
        AND status = 'active'
    )
)
WITH CHECK (
    -- Cannot modify super_admin accounts
    (SELECT role FROM public.users WHERE id = public.users.id) != 'super_admin'
);

-- ============================================
-- TABLE DATA POLICIES
-- ============================================

-- All authenticated active users can read table data
CREATE POLICY "Authenticated users can read table data"
ON public.table_data FOR SELECT
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- All authenticated active users can insert table data
CREATE POLICY "Authenticated users can insert table data"
ON public.table_data FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- All authenticated active users can update table data
CREATE POLICY "Authenticated users can update table data"
ON public.table_data FOR UPDATE
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- All authenticated active users can delete table data
CREATE POLICY "Authenticated users can delete table data"
ON public.table_data FOR DELETE
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- ============================================
-- TABLE CONFIGURATIONS POLICIES
-- ============================================

-- All authenticated active users can read configurations
CREATE POLICY "Authenticated users can read configurations"
ON public.table_configurations FOR SELECT
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- All authenticated active users can insert configurations
CREATE POLICY "Authenticated users can insert configurations"
ON public.table_configurations FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- ============================================
-- AUDIT LOGS POLICIES
-- ============================================

-- Only admins can read audit logs
CREATE POLICY "Admins can read audit logs"
ON public.audit_logs FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
        AND status = 'active'
    )
);

-- All authenticated users can insert audit logs (system-generated)
CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
);

-- ============================================
-- EMPLOYEE RECORDS POLICIES
-- ============================================

-- All authenticated active users can read employee records
CREATE POLICY "Authenticated users can read employee records"
ON public.employee_records FOR SELECT
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- All authenticated active users can insert employee records
CREATE POLICY "Authenticated users can insert employee records"
ON public.employee_records FOR INSERT
WITH CHECK (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- All authenticated active users can update employee records
CREATE POLICY "Authenticated users can update employee records"
ON public.employee_records FOR UPDATE
USING (
    auth.role() = 'authenticated'
    AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND status = 'active'
    )
);

-- ============================================
-- SSO CONFIGURATION POLICIES
-- ============================================

-- Only super admin can read SSO config
CREATE POLICY "Super admin can read SSO config"
ON public.sso_config FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
        AND status = 'active'
    )
);

-- Only super admin can modify SSO config
CREATE POLICY "Super admin can modify SSO config"
ON public.sso_config FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role = 'super_admin'
        AND status = 'active'
    )
);
