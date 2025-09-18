-- Supabase Auth Schema DDL Export
-- Project ID: jnttwzuqutvsfrhpnwrz
-- Generated: 2025-01-18
-- 
-- WARNING: This is the actual DDL for Supabase's auth schema
-- DO NOT EXECUTE this against your database as it may cause conflicts
-- This is for reference and documentation purposes only

-- ================================
-- CREATE SCHEMA
-- ================================
CREATE SCHEMA IF NOT EXISTS auth;

-- ================================
-- CUSTOM ENUMS
-- ================================

-- Authentication Assurance Level
CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2', 
    'aal3'
);

-- Multi-Factor Authentication Factor Type
CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);

-- Multi-Factor Authentication Factor Status
CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);

-- OAuth Code Challenge Method
CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);

-- One-Time Token Type
CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);

-- OAuth Registration Type
CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);

-- ================================
-- SEQUENCES
-- ================================

-- Sequence for refresh_tokens
CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ================================
-- TABLES
-- ================================

-- Users table (main authentication table)
CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::text,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL
);

-- Sessions table
CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);

-- Identities table (OAuth providers)
CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text DEFAULT lower((identity_data ->> 'email'::text)),
    id uuid DEFAULT gen_random_uuid() NOT NULL
);

-- Refresh tokens table
CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass) NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);

-- Audit log entries table
CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);

-- Flow state table (OAuth flow management)
CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);

-- Instances table
CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Multi-Factor Authentication tables
CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);

-- One-time tokens table
CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

-- OAuth clients table
CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_id text NOT NULL,
    client_secret_hash text NOT NULL,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);

-- SAML providers table
CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text
);

-- SAML relay states table
CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid
);

-- Schema migrations table
CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);

-- SSO domains table
CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- SSO providers table
CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean
);

-- ================================
-- PRIMARY KEYS
-- ================================

ALTER TABLE ONLY auth.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.identities ADD CONSTRAINT identities_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.refresh_tokens ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.audit_log_entries ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.flow_state ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.instances ADD CONSTRAINT instances_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.mfa_factors ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.mfa_challenges ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.mfa_amr_claims ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);
ALTER TABLE ONLY auth.one_time_tokens ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.oauth_clients ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.saml_providers ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.saml_relay_states ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.schema_migrations ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);
ALTER TABLE ONLY auth.sso_domains ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);
ALTER TABLE ONLY auth.sso_providers ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);

-- ================================
-- UNIQUE CONSTRAINTS
-- ================================

ALTER TABLE ONLY auth.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY auth.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
ALTER TABLE ONLY auth.identities ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);
ALTER TABLE ONLY auth.refresh_tokens ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);
ALTER TABLE ONLY auth.oauth_clients ADD CONSTRAINT oauth_clients_client_id_key UNIQUE (client_id);
ALTER TABLE ONLY auth.saml_providers ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);

-- ================================
-- FOREIGN KEY CONSTRAINTS
-- ================================

ALTER TABLE ONLY auth.sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.identities ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.refresh_tokens ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.mfa_factors ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.mfa_challenges ADD CONSTRAINT mfa_challenges_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.mfa_amr_claims ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.one_time_tokens ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.saml_providers ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.saml_relay_states ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;
ALTER TABLE ONLY auth.saml_relay_states ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;

-- ================================
-- INDEXES
-- ================================

-- Users table indexes
CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);
CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));
CREATE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (email IS NOT NULL);
CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);

-- Sessions table indexes
CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);
CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);

-- Identities table indexes
CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);
CREATE INDEX identities_email_idx ON auth.identities USING btree (email);

-- Refresh tokens table indexes
CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);
CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);
CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);
CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);

-- Audit log indexes
CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);

-- Flow state indexes
CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);
CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);
CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);

-- MFA indexes
CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);
CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);
CREATE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);
CREATE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);
CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);

-- One-time tokens indexes
CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);
CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);
CREATE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);

-- OAuth clients indexes
CREATE INDEX oauth_clients_client_id_idx ON auth.oauth_clients USING btree (client_id);
CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);

-- ================================
-- NOTES
-- ================================
-- This DDL represents Supabase's managed auth schema structure
-- 
-- Key Features:
-- 1. Complete user authentication and session management
-- 2. Multi-factor authentication (TOTP, WebAuthn, Phone)
-- 3. OAuth/SAML SSO provider support
-- 4. Audit logging and security tracking
-- 5. Token refresh and one-time token management
-- 6. Email/phone confirmation workflows
-- 
-- WARNING: This schema is managed by Supabase
-- Do not attempt to recreate or modify this schema manually
-- Use Supabase Auth APIs and dashboard for configuration