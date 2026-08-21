-- 001_init.sql — CashTrack initial schema for Supabase Postgres.
-- Run this in Supabase: SQL Editor -> New query -> Run.
-- Mirrors the SQLAlchemy models in app/models.py exactly.

-- Expenses: 1:1 mirror of the frontend Expense interface (src/types.ts).
create table if not exists expenses (
    id           varchar(32)   primary key,
    amount       double precision not null,
    category     varchar(50)   not null,
    bucket       varchar(20)   not null,
    note         varchar(255)  not null default '',
    date         date          not null,
    timestamp    timestamptz   not null,
    reviewed     boolean       not null default false,
    justified    boolean       not null default false,
    goal_id      varchar(50),
    goal_name    varchar(100),
    goal_image   varchar(255),
    allocations  json
);

create index if not exists ix_expenses_timestamp on expenses (timestamp desc);
create index if not exists ix_expenses_date on expenses (date);

-- Singleton streak table (single-user app).
create table if not exists user_streak (
    id               int  primary key,
    current_streak   int  not null default 0,
    longest_streak   int  not null default 0,
    last_logged_date date
);

-- Singleton settings table.
create table if not exists settings (
    id             int  primary key,
    monthly_budget double precision not null default 15000
);

-- Seed the singleton rows.
insert into user_streak (id, current_streak, longest_streak) values (1, 0, 0)
    on conflict (id) do nothing;
insert into settings (id, monthly_budget) values (1, 15000)
    on conflict (id) do nothing;
