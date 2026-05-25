create extension if not exists "pgcrypto";

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text not null,
  region text,
  manager_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  role text not null check (role in ('sales_employee', 'branch_supervisor', 'general_manager', 'admin')),
  branch_id uuid references public.branches(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.interest_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  secondary_phone text,
  city text,
  district text,
  email text,
  source_id uuid references public.lead_sources(id),
  assigned_employee_id uuid references public.profiles(id),
  branch_id uuid references public.branches(id),
  current_status text not null default 'new' check (
    current_status in (
      'new',
      'interested',
      'needs_follow_up',
      'quotation_requested',
      'quotation_sent',
      'negotiation',
      'sold',
      'not_interested',
      'closed'
    )
  ),
  purchase_probability text check (purchase_probability is null or purchase_probability in ('low', 'medium', 'high', 'very_high')),
  general_notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visits (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  branch_id uuid not null references public.branches(id),
  sales_employee_id uuid not null references public.profiles(id),
  visit_datetime timestamptz not null default now(),
  visit_type text not null check (visit_type in ('showroom_visit', 'call', 'whatsapp', 'qr_form', 'website', 'other')),
  interest_category_id uuid references public.interest_categories(id),
  requested_product text,
  budget_range text,
  has_measurements boolean not null default false,
  needs_second_visit boolean not null default false,
  customer_status text not null default 'new' check (
    customer_status in (
      'new',
      'interested',
      'needs_follow_up',
      'quotation_requested',
      'quotation_sent',
      'negotiation',
      'sold',
      'not_interested',
      'closed'
    )
  ),
  purchase_probability text check (purchase_probability is null or purchase_probability in ('low', 'medium', 'high', 'very_high')),
  next_follow_up_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  visit_id uuid references public.visits(id) on delete set null,
  assigned_employee_id uuid not null references public.profiles(id),
  follow_up_type text not null check (follow_up_type in ('call', 'whatsapp', 'second_visit', 'send_quotation', 'other')),
  scheduled_at timestamptz not null,
  completed_at timestamptz,
  result text,
  status text not null default 'upcoming' check (status in ('upcoming', 'due_today', 'overdue', 'completed', 'cancelled')),
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  old_value jsonb,
  new_value jsonb,
  performed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  is_read boolean not null default false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  imported_by uuid references public.profiles(id),
  total_rows integer not null default 0,
  success_rows integer not null default 0,
  failed_rows integer not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_branch on public.profiles(branch_id);
create index if not exists idx_customers_assigned_employee on public.customers(assigned_employee_id);
create index if not exists idx_customers_branch on public.customers(branch_id);
create index if not exists idx_customers_status on public.customers(current_status);
create index if not exists idx_visits_customer on public.visits(customer_id);
create index if not exists idx_visits_branch_datetime on public.visits(branch_id, visit_datetime desc);
create index if not exists idx_visits_sales_employee on public.visits(sales_employee_id);
create index if not exists idx_follow_ups_customer on public.follow_ups(customer_id);
create index if not exists idx_follow_ups_assigned_scheduled on public.follow_ups(assigned_employee_id, scheduled_at);
create index if not exists idx_notifications_user_read on public.notifications(user_id, is_read);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at before update on public.branches
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists interest_categories_set_updated_at on public.interest_categories;
create trigger interest_categories_set_updated_at before update on public.interest_categories
for each row execute function public.set_updated_at();

drop trigger if exists lead_sources_set_updated_at on public.lead_sources;
create trigger lead_sources_set_updated_at before update on public.lead_sources
for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists visits_set_updated_at on public.visits;
create trigger visits_set_updated_at before update on public.visits
for each row execute function public.set_updated_at();

drop trigger if exists follow_ups_set_updated_at on public.follow_ups;
create trigger follow_ups_set_updated_at before update on public.follow_ups
for each row execute function public.set_updated_at();

create or replace function public.get_current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.get_current_user_branch_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select branch_id from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.get_current_user_role() = 'admin'; $$;

create or replace function public.is_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.get_current_user_role() = 'general_manager'; $$;

create or replace function public.is_branch_supervisor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.get_current_user_role() = 'branch_supervisor'; $$;

create or replace function public.is_sales_employee()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select public.get_current_user_role() = 'sales_employee'; $$;

alter table public.profiles enable row level security;
alter table public.branches enable row level security;
alter table public.interest_categories enable row level security;
alter table public.lead_sources enable row level security;
alter table public.customers enable row level security;
alter table public.visits enable row level security;
alter table public.follow_ups enable row level security;
alter table public.activity_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.import_batches enable row level security;

drop policy if exists profiles_select_scoped on public.profiles;
create policy profiles_select_scoped on public.profiles
for select to authenticated
using (
  id = auth.uid()
  or public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
);

drop policy if exists profiles_insert_admin on public.profiles;
create policy profiles_insert_admin on public.profiles
for insert to authenticated
with check (public.is_admin());

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists profiles_delete_admin on public.profiles;
create policy profiles_delete_admin on public.profiles
for delete to authenticated
using (public.is_admin());

drop policy if exists branches_select_scoped on public.branches;
create policy branches_select_scoped on public.branches
for select to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or id = public.get_current_user_branch_id()
);

drop policy if exists branches_manage_admin on public.branches;
create policy branches_manage_admin on public.branches
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists interest_categories_select_staff on public.interest_categories;
create policy interest_categories_select_staff on public.interest_categories
for select to authenticated
using (true);

drop policy if exists interest_categories_manage_admin on public.interest_categories;
create policy interest_categories_manage_admin on public.interest_categories
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists lead_sources_select_staff on public.lead_sources;
create policy lead_sources_select_staff on public.lead_sources
for select to authenticated
using (true);

drop policy if exists lead_sources_manage_admin on public.lead_sources;
create policy lead_sources_manage_admin on public.lead_sources
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists customers_select_scoped on public.customers;
create policy customers_select_scoped on public.customers
for select to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (assigned_employee_id = auth.uid() or created_by = auth.uid()))
);

drop policy if exists customers_insert_scoped on public.customers;
create policy customers_insert_scoped on public.customers
for insert to authenticated
with check (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (assigned_employee_id = auth.uid() or created_by = auth.uid()))
);

drop policy if exists customers_update_scoped on public.customers;
create policy customers_update_scoped on public.customers
for update to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (assigned_employee_id = auth.uid() or created_by = auth.uid()))
)
with check (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (assigned_employee_id = auth.uid() or created_by = auth.uid()))
);

drop policy if exists visits_select_scoped on public.visits;
create policy visits_select_scoped on public.visits
for select to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (sales_employee_id = auth.uid() or created_by = auth.uid()))
);

drop policy if exists visits_insert_scoped on public.visits;
create policy visits_insert_scoped on public.visits
for insert to authenticated
with check (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (sales_employee_id = auth.uid() or created_by = auth.uid()))
);

drop policy if exists visits_update_scoped on public.visits;
create policy visits_update_scoped on public.visits
for update to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (sales_employee_id = auth.uid() or created_by = auth.uid()))
)
with check (
  public.is_admin()
  or public.is_manager()
  or (public.is_branch_supervisor() and branch_id = public.get_current_user_branch_id())
  or (public.is_sales_employee() and (sales_employee_id = auth.uid() or created_by = auth.uid()))
);

drop policy if exists follow_ups_select_scoped on public.follow_ups;
create policy follow_ups_select_scoped on public.follow_ups
for select to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or assigned_employee_id = auth.uid()
  or created_by = auth.uid()
  or (
    public.is_branch_supervisor()
    and exists (
      select 1 from public.customers c
      where c.id = follow_ups.customer_id
        and c.branch_id = public.get_current_user_branch_id()
    )
  )
);

drop policy if exists follow_ups_insert_scoped on public.follow_ups;
create policy follow_ups_insert_scoped on public.follow_ups
for insert to authenticated
with check (
  public.is_admin()
  or public.is_manager()
  or assigned_employee_id = auth.uid()
  or created_by = auth.uid()
  or (
    public.is_branch_supervisor()
    and exists (
      select 1 from public.customers c
      where c.id = follow_ups.customer_id
        and c.branch_id = public.get_current_user_branch_id()
    )
  )
);

drop policy if exists follow_ups_update_scoped on public.follow_ups;
create policy follow_ups_update_scoped on public.follow_ups
for update to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or assigned_employee_id = auth.uid()
  or created_by = auth.uid()
  or (
    public.is_branch_supervisor()
    and exists (
      select 1 from public.customers c
      where c.id = follow_ups.customer_id
        and c.branch_id = public.get_current_user_branch_id()
    )
  )
)
with check (
  public.is_admin()
  or public.is_manager()
  or assigned_employee_id = auth.uid()
  or created_by = auth.uid()
  or (
    public.is_branch_supervisor()
    and exists (
      select 1 from public.customers c
      where c.id = follow_ups.customer_id
        and c.branch_id = public.get_current_user_branch_id()
    )
  )
);

drop policy if exists activity_logs_select_scoped on public.activity_logs;
create policy activity_logs_select_scoped on public.activity_logs
for select to authenticated
using (public.is_admin() or public.is_manager());

drop policy if exists activity_logs_insert_staff on public.activity_logs;
create policy activity_logs_insert_staff on public.activity_logs
for insert to authenticated
with check (performed_by = auth.uid() or public.is_admin());

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
for update to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_admin on public.notifications
for insert to authenticated
with check (public.is_admin());

drop policy if exists import_batches_select_management on public.import_batches;
create policy import_batches_select_management on public.import_batches
for select to authenticated
using (public.is_admin() or public.is_manager());

drop policy if exists import_batches_manage_admin on public.import_batches;
create policy import_batches_manage_admin on public.import_batches
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

insert into public.interest_categories (name)
values
  ('الأدوات الصحية'),
  ('السيراميك والبورسلان'),
  ('المطابخ'),
  ('الرخام والجرانيت'),
  ('الباركيه والأرضيات'),
  ('مواد البناء'),
  ('أخرى')
on conflict (name) do nothing;

insert into public.lead_sources (name)
values
  ('زيارة مباشرة للمعرض'),
  ('واتساب'),
  ('اتصال'),
  ('موقع إلكتروني'),
  ('QR داخل المعرض'),
  ('إعلان سناب شات'),
  ('إعلان إنستغرام'),
  ('إعلان تيك توك'),
  ('توصية من عميل'),
  ('حملة تسويقية'),
  ('أخرى')
on conflict (name) do nothing;

insert into public.branches (name, city)
values
  ('فرع جدة', 'جدة'),
  ('فرع الرياض', 'الرياض'),
  ('فرع الدمام', 'الدمام'),
  ('فرع مكة', 'مكة'),
  ('فرع المدينة', 'المدينة')
on conflict do nothing;
