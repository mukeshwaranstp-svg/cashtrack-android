-- 002_sync.sql — tables for the sync layer (profile, wallet, goals, history,
-- todos, companion, misc) + extra app-preference columns on settings.
-- Run in Supabase: SQL Editor -> New query -> Run (after 001_init.sql).

-- Extend the settings singleton with app-level preferences that previously
-- lived in localStorage (currency, theme, alerts, challenge).
alter table settings
    add column if not exists currency text not null default '₹',
    add column if not exists theme text not null default 'system',
    add column if not exists alert_enabled boolean not null default true,
    add column if not exists alert_threshold double precision not null default 1000,
    add column if not exists challenge_days int not null default 7;

-- Wallet: single row (id=1). XP/coins + progression stats.
create table if not exists wallet (
    id int primary key,
    xp int not null default 0,
    coins int not null default 0,
    total_xp_earned int not null default 0,
    total_coins_earned int not null default 0,
    freeze_count int not null default 0,
    completed_missions_count int not null default 0,
    completed_streak_dates json not null default '[]',
    unlocked_achievements json not null default '[]'
);

-- Profile: single row (id=1).
create table if not exists profile (
    id int primary key,
    avatar text not null default '🦁',
    name text not null default '',
    username text not null default '',
    email text not null default '',
    bio text not null default '',
    profile_pic text
);

-- Savings goals: mirrors the frontend SavingsGoal shape.
create table if not exists savings_goals (
    id varchar(32) primary key,
    name text not null,
    target double precision not null,
    current double precision not null default 0,
    image text not null default '🎯',
    deadline date,
    priority int not null default 1,
    notes text not null default '',
    completed boolean not null default false,
    completion_date date,
    difficulty text not null default 'Common',
    status text not null default 'On Track',
    created_at timestamptz not null default now()
);

create index if not exists ix_savings_goals_completed on savings_goals (completed, priority);

-- Savings deposit history.
create table if not exists savings_history (
    id varchar(32) primary key,
    goal_id varchar(32),
    goal_name text not null,
    amount double precision not null,
    date date not null,
    type text not null default 'deposit',
    notes text not null default ''
);

create index if not exists ix_savings_history_date on savings_history (date desc);

-- To-dos.
create table if not exists todos (
    id varchar(32) primary key,
    text text not null,
    completed boolean not null default false,
    category text not null default '',
    sort_order int not null default 0
);

-- Companion/mascot: single row (id=1).
create table if not exists companion (
    id int primary key,
    selected text not null default 'waguri',
    visibility text not null default 'events',
    custom_image text,
    custom_name text,
    onboarded boolean not null default false
);

-- Misc app flags: single row (id=1), JSON bucket.
create table if not exists misc_state (
    id int primary key,
    data json not null default '{}'
);

-- Seed singleton rows.
insert into wallet (id, xp, coins, total_xp_earned, total_coins_earned)
    values (1, 0, 0, 0, 0) on conflict (id) do nothing;
insert into profile (id) values (1) on conflict (id) do nothing;
insert into companion (id) values (1) on conflict (id) do nothing;
insert into misc_state (id, data) values (1, '{}') on conflict (id) do nothing;
insert into settings (id, monthly_budget) values (1, 15000)
    on conflict (id) do nothing;
