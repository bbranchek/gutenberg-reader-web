-- Remove MFA-related columns from profiles table
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS mfa_enabled,
DROP COLUMN IF EXISTS phone_number;