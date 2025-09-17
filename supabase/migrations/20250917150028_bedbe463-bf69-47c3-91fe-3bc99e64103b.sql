-- Add phone number to profiles table for 2FA
ALTER TABLE public.profiles 
ADD COLUMN phone_number TEXT,
ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;