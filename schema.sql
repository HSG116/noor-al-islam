
-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create users table
create table public.users (
  id uuid references auth.users on delete cascade not null primary key,
  name text,
  email text,
  avatar_url text,
  total_points integer default 0,
  streak_days integer default 0,
  badges_array text[] default '{}',
  last_login timestamptz default now(),
  last_quiz_date date,
  last_submission_date date,
  active_challenges jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;

-- Create policies for users
create policy "Public profiles are viewable by everyone."
  on public.users for select
  using ( true );

create policy "Users can insert their own profile."
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.users for update
  using ( auth.uid() = id );

-- Create daily_quizzes table
create table public.daily_quizzes (
  id uuid default uuid_generate_v4() primary key,
  date date not null,
  question_text text not null,
  media_url text,
  type text check (type in ('text', 'image', 'audio')),
  options_array text[] not null,
  correct_answer_index integer not null,
  created_by uuid references public.users(id),
  creator_name text,
  created_at timestamptz default now()
);

-- Enable RLS for quizzes
alter table public.daily_quizzes enable row level security;

-- Create policies for quizzes
create policy "Quizzes are viewable by everyone."
  on public.daily_quizzes for select
  using ( true );

create policy "Authenticated users can create quizzes."
  on public.daily_quizzes for insert
  with check ( auth.role() = 'authenticated' );

-- Function to handle new user creation automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, name, email, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
