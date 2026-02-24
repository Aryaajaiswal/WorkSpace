-- ============================================
-- SEAT BOOKING SYSTEM — DATABASE SCHEMA
-- Run this file first to create all tables
-- ============================================

-- Drop tables in reverse dependency order (for clean resets)
DROP TABLE IF EXISTS seat_bookings CASCADE;
DROP TABLE IF EXISTS seat_allocations CASCADE;
DROP TABLE IF EXISTS holidays CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS teams CASCADE;

-- Teams (10 teams, 5 per batch)
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  batch INT NOT NULL CHECK (batch IN (1, 2))
);

-- Seats (50 total: 40 designated + 10 floater)
CREATE TABLE seats (
  id SERIAL PRIMARY KEY,
  seat_number VARCHAR(10) NOT NULL UNIQUE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('designated', 'floater')),
  zone VARCHAR(10) NOT NULL CHECK (zone IN ('A', 'B'))
);

-- Users (80 employees + admins)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  team_id INT REFERENCES teams(id),
  batch INT CHECK (batch IN (1, 2)),
  is_designated BOOLEAN NOT NULL DEFAULT true,
  seat_id INT REFERENCES seats(id)   -- the designated seat for this user
);

-- System-generated designated seat allocations
-- Pre-generated for 2 weeks based on batch schedule
CREATE TABLE seat_allocations (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_id INT NOT NULL REFERENCES seats(id),
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'released')),
  UNIQUE(seat_id, date)   -- one person per seat per day
);

-- User-created floater bookings
CREATE TABLE seat_bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seat_id INT NOT NULL REFERENCES seats(id),
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  booked_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)   -- one booking per user per day
);

-- Public holidays (no bookings allowed)
CREATE TABLE holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_seat_allocations_date ON seat_allocations(date);
CREATE INDEX idx_seat_allocations_user ON seat_allocations(user_id);
CREATE INDEX idx_seat_bookings_date ON seat_bookings(date);
CREATE INDEX idx_seat_bookings_user ON seat_bookings(user_id);

-- System settings table (configurable options)
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(50) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Default settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('designated_seat_count', '40', 'Number of designated seats in Zone A'),
('floater_seat_count', '10', 'Number of floater seats in Zone B'),
('zone_a_name', 'Zone A — Designated Seats', 'Display name for Zone A'),
('zone_b_name', 'Zone B — Floater Seats', 'Display name for Zone B'),
('floater_booking_hour', '15', 'Hour when floater booking opens (24-hour format)'),
('batch1_week1_days', '1,2,3', 'Batch 1 week 1 office days (comma-separated: 1=Mon, 5=Fri)'),
('batch1_week2_days', '4,5', 'Batch 1 week 2 office days'),
('batch2_week1_days', '4,5', 'Batch 2 week 1 office days'),
('batch2_week2_days', '1,2,3', 'Batch 2 week 2 office days'),
('company_name', 'WorkSpace', 'Company name for display'),
('app_subtitle', 'Seat Booking', 'App subtitle');
