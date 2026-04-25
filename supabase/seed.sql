-- Seed a demo broker and client for local testing.
-- Run this AFTER the initial schema migration.
-- Replace the broker_id UUID with your actual Supabase Auth user ID.

-- Step 1: create a broker row tied to your Supabase Auth account
-- (Replace 'YOUR-AUTH-USER-UUID' with the UUID from Supabase Auth > Users)
insert into public.brokers (id, name, email)
values ('YOUR-AUTH-USER-UUID', 'Test Broker', 'broker@example.com')
on conflict (id) do nothing;

-- Step 2: create a demo client with a known intake token
insert into public.clients (broker_id, business_name, owner_name, owner_contact, intake_token)
values (
  'YOUR-AUTH-USER-UUID',
  'Mission Street Coffee',
  'Maria Garcia',
  'maria@example.com',
  'demo-test-token-123'
)
on conflict (intake_token) do nothing;
