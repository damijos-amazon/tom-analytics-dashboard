-- Function to automatically create user record on first SSO login
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status)
    VALUES (NEW.id, NEW.email, 'manager', 'active')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user record on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to prevent super admin deletion
CREATE OR REPLACE FUNCTION public.prevent_super_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role = 'super_admin' THEN
        RAISE EXCEPTION 'Cannot delete super admin account';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger to prevent super admin deletion
CREATE TRIGGER prevent_super_admin_delete
    BEFORE DELETE ON public.users
    FOR EACH ROW EXECUTE FUNCTION public.prevent_super_admin_deletion();

-- Function to terminate sessions when user is blocked
CREATE OR REPLACE FUNCTION public.terminate_blocked_user_sessions()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'blocked' AND OLD.status != 'blocked' THEN
        -- Delete all sessions for this user
        DELETE FROM auth.sessions WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to terminate sessions on user block
CREATE TRIGGER on_user_blocked
    AFTER UPDATE ON public.users
    FOR EACH ROW
    WHEN (NEW.status = 'blocked' AND OLD.status != 'blocked')
    EXECUTE FUNCTION public.terminate_blocked_user_sessions();
