-- ============================================================
-- HOUSEY - Supabase Database Schema
-- Run this script in the Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  code VARCHAR(10) PRIMARY KEY,
  host_id VARCHAR(64) NOT NULL,
  host_name VARCHAR(128) NOT NULL,
  pass_key VARCHAR(64),
  status VARCHAR(32) DEFAULT 'lobby',
  called_numbers JSONB DEFAULT '[]'::jsonb,
  current_number INT,
  claims JSONB DEFAULT '{}'::jsonb,
  auto_call_interval INT DEFAULT 5000,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create players table
CREATE TABLE IF NOT EXISTS public.players (
  id VARCHAR(64) PRIMARY KEY,
  room_code VARCHAR(10) REFERENCES public.rooms(code) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  email VARCHAR(255),
  is_host BOOLEAN DEFAULT FALSE,
  ticket JSONB,
  is_connected BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create claims table
CREATE TABLE IF NOT EXISTS public.claims (
  id SERIAL PRIMARY KEY,
  room_code VARCHAR(10) REFERENCES public.rooms(code) ON DELETE CASCADE,
  claim_type VARCHAR(64) NOT NULL,
  winner_id VARCHAR(64),
  winner_name VARCHAR(128) NOT NULL,
  won_at_number INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;

-- 5. Policies allowing server / anon access for game operations
CREATE POLICY "Allow public read on rooms" ON public.rooms FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on rooms" ON public.rooms FOR ALL USING (true);

CREATE POLICY "Allow public read on players" ON public.players FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update on players" ON public.players FOR ALL USING (true);

CREATE POLICY "Allow public read on claims" ON public.claims FOR SELECT USING (true);
CREATE POLICY "Allow public insert on claims" ON public.claims FOR INSERT WITH CHECK (true);

