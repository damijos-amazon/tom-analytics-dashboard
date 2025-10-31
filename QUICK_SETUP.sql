-- QUICK SETUP FOR TOM ANALYTICS
-- Run this entire script in Supabase SQL Editor

-- 1. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'manager',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create table_data table
CREATE TABLE IF NOT EXISTS public.table_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    data JSONB NOT NULL,
    user_id UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.table_data ENABLE ROW LEVEL SECURITY;

-- 4. Create policies (allow authenticated users)
CREATE POLICY "Allow authenticated users to read users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read table_data" ON public.table_data
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert table_data" ON public.table_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update table_data" ON public.table_data
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Done! Your database is ready.
