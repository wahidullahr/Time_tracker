-- TimeOS Ultimate - Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee',
  access_code TEXT NOT NULL UNIQUE,
  assigned_company_ids UUID[] DEFAULT '{}',
  is_blocked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies Table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Time Entries Table
CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  description TEXT NOT NULL,
  seconds INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX idx_users_access_code ON users(access_code);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_date ON time_entries(date);
CREATE INDEX idx_time_entries_company_name ON time_entries(company_name);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Allow anonymous users to read all users"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous users to insert users"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update users"
  ON users FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous users to delete users"
  ON users FOR DELETE
  USING (true);

-- RLS Policies for companies table
CREATE POLICY "Allow anonymous users to read all companies"
  ON companies FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous users to insert companies"
  ON companies FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update companies"
  ON companies FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous users to delete companies"
  ON companies FOR DELETE
  USING (true);

-- RLS Policies for time_entries table
CREATE POLICY "Allow anonymous users to read all time entries"
  ON time_entries FOR SELECT
  USING (true);

CREATE POLICY "Allow anonymous users to insert time entries"
  ON time_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow anonymous users to update time entries"
  ON time_entries FOR UPDATE
  USING (true);

CREATE POLICY "Allow anonymous users to delete time entries"
  ON time_entries FOR DELETE
  USING (true);

-- Optional: Create a function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts with access codes for authentication';
COMMENT ON TABLE companies IS 'Stores client companies for time tracking';
COMMENT ON TABLE time_entries IS 'Stores time tracking entries for users';
COMMENT ON COLUMN users.access_code IS 'Unique 6-digit code for user authentication';
COMMENT ON COLUMN users.assigned_company_ids IS 'Array of company UUIDs this user can track time for';
COMMENT ON COLUMN time_entries.seconds IS 'Duration in seconds';
