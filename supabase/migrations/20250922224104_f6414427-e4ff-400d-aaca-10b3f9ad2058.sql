-- Delete users except bbranchek@gmail.com
-- Note: We'll delete from profiles first, then from auth.users

-- Delete profiles for users we want to remove
DELETE FROM public.profiles 
WHERE user_id IN (
  '81c54e28-f7e4-43a9-a0b0-43959e47a49b', -- cbranchek@hotmail.com
  '8ce893b8-96e3-4057-9e84-8fb7a7c333b3', -- bbranchek@hotmail.com  
  'ec1bc223-8b69-4241-bacc-36f6b22c9376'  -- bbranchek@acm.org
);

-- Delete the auth users (this will cascade to related tables)
DELETE FROM auth.users 
WHERE id IN (
  '81c54e28-f7e4-43a9-a0b0-43959e47a49b', -- cbranchek@hotmail.com
  '8ce893b8-96e3-4057-9e84-8fb7a7c333b3', -- bbranchek@hotmail.com
  'ec1bc223-8b69-4241-bacc-36f6b22c9376'  -- bbranchek@acm.org
);