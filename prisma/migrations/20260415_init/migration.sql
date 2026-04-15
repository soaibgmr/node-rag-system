-- Migration: create initial tables for users, roles, user_role_mappings, countries
-- Generated to allow applying schema directly when Prisma migrate cannot connect

BEGIN;

-- Provide a UUID generator. Uses pgcrypto's gen_random_uuid();
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50) NOT NULL UNIQUE,
  description varchar(500),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(255) NOT NULL UNIQUE,
  email varchar(255) UNIQUE,
  password varchar(255) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);

-- User <-> Role mapping table
CREATE TABLE IF NOT EXISTS user_role_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_role UNIQUE (user_id, role_id),
  CONSTRAINT fk_urm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_urm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);

-- Countries table
CREATE TABLE IF NOT EXISTS countries (
  code_iso3 varchar(5) PRIMARY KEY,
  name varchar(400) NOT NULL,
  code varchar(5) NOT NULL UNIQUE,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3)
);

CREATE INDEX IF NOT EXISTS idx_country_name ON countries(name);

COMMIT;
