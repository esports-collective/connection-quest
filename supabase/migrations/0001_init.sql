-- Quests — initial schema + RLS
-- Enums ---------------------------------------------------------------
create type user_role        as enum ('participant','staff','admin');
create type quest_style      as enum ('structured','open');
create type quest_difficulty as enum ('starter','regular','epic');
create type support_context  as enum ('self_led','sw_supported');
create type evidence_grade   as enum ('self_reported','noted','photo','staff_observed');
create type note_cadence     as enum ('weekly','monthly');
create type note_status      as enum ('draft','approved');
create type goal_source      as enum ('astalty','manual');

-- Profiles ------------------------------------------------------------
-- Minimal PII: short display name (e.g. "Hailey W") + optional Astalty id.
create table public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  role           user_role     not null default 'participant',
  display_name   text          not null,
  astalty_id     text,
  interests      text[]        not null default '{}',
  preferences    jsonb         not null default '{}',
  consent_photos boolean       not null default false,
  cadence        note_cadence  not null default 'monthly',
  created_at     timestamptz   not null default now()
);

-- Role helpers (SECURITY DEFINER avoids RLS recursion on profiles) -----
create or replace function public.app_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff','admin')
  );
$$;

-- Auto-create a profile when a new auth user signs up -----------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'participant')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Quests (shared library) --------------------------------------------
create table public.quests (
  id           uuid primary key default gen_random_uuid(),
  code         text unique,
  title        text not null,
  category     text not null,
  style        quest_style not null default 'structured',
  type         text,
  difficulty   quest_difficulty not null default 'starter',
  est_minutes  int,
  location     text,
  description  text not null,
  skills_built text[] not null default '{}',
  capacities   text[] not null default '{}',
  xp           int not null default 10,
  yn_questions jsonb not null default '[]',   -- [{prompt, is_capacity}]
  created_by   uuid references public.profiles(id),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Participant goals (mirrored from Astalty; mock for now) -------------
create table public.participant_goals (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references public.profiles(id) on delete cascade,
  name            text not null,
  source          goal_source not null default 'manual',
  astalty_goal_id text,
  created_at      timestamptz not null default now()
);

-- Completions (the evidence unit) ------------------------------------
create table public.completions (
  id              uuid primary key default gen_random_uuid(),
  participant_id  uuid not null references public.profiles(id) on delete cascade,
  quest_id        uuid references public.quests(id) on delete set null,
  free_form_title text,
  completed_at    timestamptz not null default now(),
  author_id       uuid references public.profiles(id),   -- staff who logged/enriched
  sw_present      boolean not null default false,
  sw_name         text,
  support_context support_context not null default 'self_led',
  chosen          boolean not null default true,          -- chosen vs offered
  yn_answers      jsonb not null default '[]',            -- [{prompt, answer:bool, is_capacity}]
  xp_awarded      int not null default 0,
  evidence_grade  evidence_grade not null default 'self_reported',
  observation     text,
  photo_url       text,
  created_at      timestamptz not null default now()
);
create index on public.completions (participant_id, completed_at desc);

-- Completion <-> participant goal (AI-suggested, staff-adjustable) ----
create table public.completion_goals (
  completion_id uuid not null references public.completions(id) on delete cascade,
  goal_id       uuid not null references public.participant_goals(id) on delete cascade,
  ai_suggested  boolean not null default true,
  primary key (completion_id, goal_id)
);

-- Period notes (AI-drafted, staff-approved) --------------------------
create table public.period_notes (
  id                 uuid primary key default gen_random_uuid(),
  participant_id     uuid not null references public.profiles(id) on delete cascade,
  period_start       date not null,
  period_end         date not null,
  cadence            note_cadence not null default 'monthly',
  draft_body         text not null,
  status             note_status not null default 'draft',
  approved_by        uuid references public.profiles(id),
  approved_at        timestamptz,
  pushed_to_astalty  boolean not null default false,
  created_at         timestamptz not null default now()
);

-- Row Level Security --------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.quests            enable row level security;
alter table public.participant_goals enable row level security;
alter table public.completions       enable row level security;
alter table public.completion_goals  enable row level security;
alter table public.period_notes      enable row level security;

-- profiles: read own or (staff reads floor); write own or staff
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or public.is_staff());
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid() or public.is_staff());
create policy profiles_update on public.profiles for update
  using (id = auth.uid() or public.is_staff())
  with check (id = auth.uid() or public.is_staff());

-- quests: everyone authed reads active; staff manage
create policy quests_select on public.quests for select
  using (is_active or public.is_staff());
create policy quests_write on public.quests for all
  using (public.is_staff()) with check (public.is_staff());

-- participant_goals: own read / staff read+write
create policy goals_select on public.participant_goals for select
  using (participant_id = auth.uid() or public.is_staff());
create policy goals_write on public.participant_goals for all
  using (public.is_staff()) with check (public.is_staff());

-- completions: own read+insert; staff full
create policy completions_select on public.completions for select
  using (participant_id = auth.uid() or public.is_staff());
create policy completions_insert on public.completions for insert
  with check (participant_id = auth.uid() or public.is_staff());
create policy completions_update on public.completions for update
  using (participant_id = auth.uid() or public.is_staff())
  with check (participant_id = auth.uid() or public.is_staff());
create policy completions_delete on public.completions for delete
  using (public.is_staff());

-- completion_goals: readable by the completion's owner or staff; staff write
create policy cg_select on public.completion_goals for select
  using (exists (
    select 1 from public.completions c
    where c.id = completion_id and (c.participant_id = auth.uid() or public.is_staff())
  ));
create policy cg_write on public.completion_goals for all
  using (public.is_staff()) with check (public.is_staff());

-- period_notes: staff only (internal clinical documentation)
create policy notes_all on public.period_notes for all
  using (public.is_staff()) with check (public.is_staff());
