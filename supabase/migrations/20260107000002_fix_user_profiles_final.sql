-- Fix user_profiles RLS Policies - Final Fix
-- Generated: 2026-01-07
-- Wrap auth.uid() in subqueries for user_profiles policies

-- ============================================
-- FIX: user_profiles policies with subqueries
-- These were created in first migration without subqueries
-- ============================================

-- Drop and recreate with proper subqueries
DROP POLICY IF EXISTS "Users view own profile" ON public.user_profiles;
CREATE POLICY "Users view own profile" ON public.user_profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users update own profile" ON public.user_profiles;
CREATE POLICY "Users update own profile" ON public.user_profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "Users insert own profile" ON public.user_profiles;
CREATE POLICY "Users insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- ============================================
-- SUMMARY
-- ============================================
-- This migration fixes the last 3 warnings for user_profiles
-- by wrapping auth.uid() in (SELECT auth.uid())
--
-- After this migration, only 1 warning should remain:
-- ✅ Leaked password protection (enable in Auth → Settings)
