-- Performance Optimization Views
-- Create materialized and regular views for complex queries

-- View: User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
    u.id,
    u.email,
    u.role,
    u.status,
    u.last_login,
    COUNT(DISTINCT al.id) FILTER (WHERE al.action = 'login') as login_count,
    COUNT(DISTINCT al.id) FILTER (WHERE al.action IN ('data_update', 'data_delete')) as data_action_count,
    MAX(al.created_at) as last_activity,
    COUNT(DISTINCT td.id) as table_records_count
FROM public.users u
LEFT JOIN public.audit_logs al ON u.id = al.user_id
LEFT JOIN public.table_data td ON u.id = td.created_by
GROUP BY u.id, u.email, u.role, u.status, u.last_login;

COMMENT ON VIEW user_activity_summary IS 'Summary of user activity including login counts and data actions';

-- View: Recent audit logs with user details
CREATE OR REPLACE VIEW recent_audit_logs AS
SELECT 
    al.id,
    al.user_id,
    u.email as user_email,
    u.role as user_role,
    al.action,
    al.resource_type,
    al.resource_id,
    al.details,
    al.ip_address,
    al.created_at
FROM public.audit_logs al
LEFT JOIN public.users u ON al.user_id = u.id
WHERE al.created_at > NOW() - INTERVAL '30 days'
ORDER BY al.created_at DESC;

COMMENT ON VIEW recent_audit_logs IS 'Audit logs from the last 30 days with user details';

-- View: Table data statistics
CREATE OR REPLACE VIEW table_data_statistics AS
SELECT 
    table_id,
    COUNT(*) as record_count,
    COUNT(DISTINCT employee_name) as unique_employees,
    MAX(updated_at) as last_updated,
    MIN(created_at) as first_created,
    COUNT(DISTINCT created_by) as contributor_count
FROM public.table_data
GROUP BY table_id;

COMMENT ON VIEW table_data_statistics IS 'Statistics for each table including record counts and update times';

-- View: Active users with recent activity
CREATE OR REPLACE VIEW active_users_with_activity AS
SELECT 
    u.id,
    u.email,
    u.role,
    u.last_login,
    u.created_at,
    COUNT(DISTINCT al.id) as recent_actions,
    MAX(al.created_at) as last_action_time
FROM public.users u
LEFT JOIN public.audit_logs al ON u.id = al.user_id 
    AND al.created_at > NOW() - INTERVAL '7 days'
WHERE u.status = 'active'
GROUP BY u.id, u.email, u.role, u.last_login, u.created_at
ORDER BY last_action_time DESC NULLS LAST;

COMMENT ON VIEW active_users_with_activity IS 'Active users with their recent activity in the last 7 days';

-- Materialized View: Daily login statistics (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_login_statistics AS
SELECT 
    DATE(created_at) as login_date,
    COUNT(*) as login_count,
    COUNT(DISTINCT user_id) as unique_users,
    ARRAY_AGG(DISTINCT user_id) as user_ids
FROM public.audit_logs
WHERE action = 'login'
    AND created_at > NOW() - INTERVAL '90 days'
GROUP BY DATE(created_at)
ORDER BY login_date DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_login_stats_date 
ON daily_login_statistics(login_date);

COMMENT ON MATERIALIZED VIEW daily_login_statistics IS 'Daily login statistics for the last 90 days (materialized for performance)';

-- Materialized View: User role distribution
CREATE MATERIALIZED VIEW IF NOT EXISTS user_role_distribution AS
SELECT 
    role,
    status,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.users
GROUP BY role, status
ORDER BY role, status;

COMMENT ON MATERIALIZED VIEW user_role_distribution IS 'Distribution of users by role and status';

-- Materialized View: Most active users (last 30 days)
CREATE MATERIALIZED VIEW IF NOT EXISTS most_active_users AS
SELECT 
    u.id,
    u.email,
    u.role,
    COUNT(al.id) as action_count,
    COUNT(DISTINCT DATE(al.created_at)) as active_days,
    MAX(al.created_at) as last_activity
FROM public.users u
INNER JOIN public.audit_logs al ON u.id = al.user_id
WHERE al.created_at > NOW() - INTERVAL '30 days'
    AND al.action IN ('data_update', 'data_delete', 'config_update')
GROUP BY u.id, u.email, u.role
ORDER BY action_count DESC
LIMIT 100;

CREATE UNIQUE INDEX IF NOT EXISTS idx_most_active_users_id 
ON most_active_users(id);

COMMENT ON MATERIALIZED VIEW most_active_users IS 'Top 100 most active users in the last 30 days';

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_performance_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY daily_login_statistics;
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_role_distribution;
    REFRESH MATERIALIZED VIEW CONCURRENTLY most_active_users;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_performance_views IS 'Refresh all materialized views for performance optimization';

-- Schedule automatic refresh (requires pg_cron extension)
-- Uncomment if pg_cron is available:
-- SELECT cron.schedule('refresh-performance-views', '0 */6 * * *', 'SELECT refresh_performance_views()');
