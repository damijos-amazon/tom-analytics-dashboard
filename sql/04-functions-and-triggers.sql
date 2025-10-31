-- TOM Analytics Dashboard - Functions and Triggers
-- This script creates database functions and triggers for automation

-- ============================================================================
-- FUNCTION: Auto-create user record on auth signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status)
    VALUES (
        NEW.id,
        NEW.email,
        'manager', -- Default role
        'active'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record when auth.users record is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- FUNCTION: Increment configuration version
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_config_version()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the latest version number
    SELECT COALESCE(MAX(version), 0) + 1 INTO NEW.version
    FROM public.table_configurations;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-increment version on new configuration
DROP TRIGGER IF EXISTS on_config_insert ON public.table_configurations;
CREATE TRIGGER on_config_insert
    BEFORE INSERT ON public.table_configurations
    FOR EACH ROW EXECUTE FUNCTION public.increment_config_version();

-- ============================================================================
-- FUNCTION: Validate user role changes
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_role_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent demotion of super admin
    IF OLD.role = 'super_admin' AND NEW.role != 'super_admin' THEN
        -- Check if the user making the change is also a super admin
        IF NOT EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            AND role = 'super_admin'
        ) THEN
            RAISE EXCEPTION 'Cannot demote super admin';
        END IF;
    END IF;
    
    -- Prevent blocking of super admin
    IF OLD.role = 'super_admin' AND NEW.status = 'blocked' THEN
        RAISE EXCEPTION 'Cannot block super admin';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate role changes
DROP TRIGGER IF EXISTS validate_user_role_change ON public.users;
CREATE TRIGGER validate_user_role_change
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.validate_role_change();

-- ============================================================================
-- FUNCTION: Clean up old audit logs (optional maintenance)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.audit_logs
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get user statistics
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_statistics()
RETURNS TABLE (
    total_users BIGINT,
    active_users BIGINT,
    blocked_users BIGINT,
    super_admins BIGINT,
    admins BIGINT,
    managers BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_users,
        COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_users,
        COUNT(*) FILTER (WHERE status = 'blocked')::BIGINT AS blocked_users,
        COUNT(*) FILTER (WHERE role = 'super_admin')::BIGINT AS super_admins,
        COUNT(*) FILTER (WHERE role = 'admin')::BIGINT AS admins,
        COUNT(*) FILTER (WHERE role = 'manager')::BIGINT AS managers
    FROM public.users;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: Get recent activity
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_recent_activity(days INTEGER DEFAULT 30, limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    action TEXT,
    user_email TEXT,
    resource_type TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.action,
        u.email AS user_email,
        al.resource_type,
        al.created_at
    FROM public.audit_logs al
    LEFT JOIN public.users u ON al.user_id = u.id
    WHERE al.created_at >= NOW() - (days || ' days')::INTERVAL
    ORDER BY al.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
