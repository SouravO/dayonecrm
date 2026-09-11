-- ============================================================
-- Migration 004: Add logo_url column to startups table
-- ============================================================

ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS logo_url TEXT;
