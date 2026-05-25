create extension if not exists "pgcrypto";

with branch_seed(id, name, city, region, manager_name) as (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, 'فرع جدة', 'جدة', 'منطقة مكة المكرمة', 'سلمان الحربي'),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'فرع الرياض', 'الرياض', 'منطقة الرياض', 'عبدالله العتيبي'),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'فرع الدمام', 'الدمام', 'المنطقة الشرقية', 'ناصر الدوسري'),
    ('10000000-0000-0000-0000-000000000004'::uuid, 'فرع مكة', 'مكة', 'منطقة مكة المكرمة', 'ماجد القرشي'),
    ('10000000-0000-0000-0000-000000000005'::uuid, 'فرع المدينة', 'المدينة', 'منطقة المدينة المنورة', 'فهد السلمي')
)
insert into public.branches (id, name, city, region, manager_name, is_active)
select id, name, city, region, manager_name, true
from branch_seed seed
where not exists (select 1 from public.branches b where b.name = seed.name);

with category_seed(name, description) as (
  values
    ('الأدوات الصحية', 'خلاطات ومغاسل ومستلزمات الحمامات'),
    ('السيراميك والبورسلان', 'بلاط داخلي وخارجي وبورسلان'),
    ('المطابخ', 'مطابخ وتجهيزات ومساحات تخزين'),
    ('الرخام والجرانيت', 'رخام طبيعي وجرانيت وبدائل حجرية'),
    ('الباركيه والأرضيات', 'أرضيات خشبية وبدائلها'),
    ('مواد البناء', 'مواد تأسيس وتشطيب للمشاريع'),
    ('أخرى', 'اهتمامات غير مصنفة')
)
insert into public.interest_categories (name, description, is_active)
select name, description, true
from category_seed
on conflict (name) do update
set description = excluded.description,
    is_active = true;

with source_seed(name, description) as (
  values
    ('زيارة مباشرة للمعرض', 'عميل حضر للمعرض مباشرة'),
    ('واتساب', 'تواصل عبر واتساب'),
    ('اتصال', 'تواصل هاتفي'),
    ('موقع إلكتروني', 'طلب وارد من الموقع الإلكتروني'),
    ('QR داخل المعرض', 'تسجيل اهتمام من نموذج QR داخل المعرض'),
    ('إعلان سناب شات', 'حملة سناب شات'),
    ('إعلان إنستغرام', 'حملة إنستغرام'),
    ('إعلان تيك توك', 'حملة تيك توك'),
    ('توصية من عميل', 'إحالة من عميل سابق'),
    ('حملة تسويقية', 'حملة تسويقية عامة'),
    ('أخرى', 'مصدر آخر')
)
insert into public.lead_sources (name, description, is_active)
select name, description, true
from source_seed
on conflict (name) do update
set description = excluded.description,
    is_active = true;

with seed_users(id, email, password, full_name, phone, role, branch_name) as (
  values
    ('20000000-0000-0000-0000-000000000001'::uuid, 'admin@ebaa.local', 'EbaaTest123!', 'نورة السعدي', '0501000001', 'admin', null),
    ('20000000-0000-0000-0000-000000000002'::uuid, 'manager@ebaa.local', 'EbaaTest123!', 'عبدالعزيز القحطاني', '0501000002', 'general_manager', null),
    ('20000000-0000-0000-0000-000000000003'::uuid, 'jeddah.supervisor@ebaa.local', 'EbaaTest123!', 'هند الحربي', '0501000003', 'branch_supervisor', 'فرع جدة'),
    ('20000000-0000-0000-0000-000000000004'::uuid, 'riyadh.supervisor@ebaa.local', 'EbaaTest123!', 'خالد العتيبي', '0501000004', 'branch_supervisor', 'فرع الرياض'),
    ('20000000-0000-0000-0000-000000000005'::uuid, 'sales.jeddah@ebaa.local', 'EbaaTest123!', 'محمد الغامدي', '0501000005', 'sales_employee', 'فرع جدة'),
    ('20000000-0000-0000-0000-000000000006'::uuid, 'sales.riyadh@ebaa.local', 'EbaaTest123!', 'سارة الدوسري', '0501000006', 'sales_employee', 'فرع الرياض'),
    ('20000000-0000-0000-0000-000000000007'::uuid, 'sales.dammam@ebaa.local', 'EbaaTest123!', 'فيصل الشهري', '0501000007', 'sales_employee', 'فرع الدمام'),
    ('20000000-0000-0000-0000-000000000008'::uuid, 'sales.makkah@ebaa.local', 'EbaaTest123!', 'ريم القرشي', '0501000008', 'sales_employee', 'فرع مكة'),
    ('20000000-0000-0000-0000-000000000009'::uuid, 'inactive@ebaa.local', 'EbaaTest123!', 'تركي السبيعي', '0501000009', 'sales_employee', 'فرع جدة')
)
insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000'::uuid,
  id,
  'authenticated',
  'authenticated',
  email,
  crypt(password, gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('full_name', full_name),
  false,
  '',
  '',
  '',
  ''
from seed_users
on conflict (id) do update
set email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    updated_at = now(),
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data;

with seed_users(id, email, full_name) as (
  values
    ('20000000-0000-0000-0000-000000000001'::uuid, 'admin@ebaa.local', 'نورة السعدي'),
    ('20000000-0000-0000-0000-000000000002'::uuid, 'manager@ebaa.local', 'عبدالعزيز القحطاني'),
    ('20000000-0000-0000-0000-000000000003'::uuid, 'jeddah.supervisor@ebaa.local', 'هند الحربي'),
    ('20000000-0000-0000-0000-000000000004'::uuid, 'riyadh.supervisor@ebaa.local', 'خالد العتيبي'),
    ('20000000-0000-0000-0000-000000000005'::uuid, 'sales.jeddah@ebaa.local', 'محمد الغامدي'),
    ('20000000-0000-0000-0000-000000000006'::uuid, 'sales.riyadh@ebaa.local', 'سارة الدوسري'),
    ('20000000-0000-0000-0000-000000000007'::uuid, 'sales.dammam@ebaa.local', 'فيصل الشهري'),
    ('20000000-0000-0000-0000-000000000008'::uuid, 'sales.makkah@ebaa.local', 'ريم القرشي'),
    ('20000000-0000-0000-0000-000000000009'::uuid, 'inactive@ebaa.local', 'تركي السبيعي')
)
insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  id::text,
  id,
  email,
  jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true, 'full_name', full_name),
  'email',
  now(),
  now(),
  now()
from seed_users
on conflict (provider, provider_id) do update
set identity_data = excluded.identity_data,
    updated_at = now();

with seed_users(id, email, full_name, phone, role, branch_name, is_active) as (
  values
    ('20000000-0000-0000-0000-000000000001'::uuid, 'admin@ebaa.local', 'نورة السعدي', '0501000001', 'admin', null, true),
    ('20000000-0000-0000-0000-000000000002'::uuid, 'manager@ebaa.local', 'عبدالعزيز القحطاني', '0501000002', 'general_manager', null, true),
    ('20000000-0000-0000-0000-000000000003'::uuid, 'jeddah.supervisor@ebaa.local', 'هند الحربي', '0501000003', 'branch_supervisor', 'فرع جدة', true),
    ('20000000-0000-0000-0000-000000000004'::uuid, 'riyadh.supervisor@ebaa.local', 'خالد العتيبي', '0501000004', 'branch_supervisor', 'فرع الرياض', true),
    ('20000000-0000-0000-0000-000000000005'::uuid, 'sales.jeddah@ebaa.local', 'محمد الغامدي', '0501000005', 'sales_employee', 'فرع جدة', true),
    ('20000000-0000-0000-0000-000000000006'::uuid, 'sales.riyadh@ebaa.local', 'سارة الدوسري', '0501000006', 'sales_employee', 'فرع الرياض', true),
    ('20000000-0000-0000-0000-000000000007'::uuid, 'sales.dammam@ebaa.local', 'فيصل الشهري', '0501000007', 'sales_employee', 'فرع الدمام', true),
    ('20000000-0000-0000-0000-000000000008'::uuid, 'sales.makkah@ebaa.local', 'ريم القرشي', '0501000008', 'sales_employee', 'فرع مكة', true),
    ('20000000-0000-0000-0000-000000000009'::uuid, 'inactive@ebaa.local', 'تركي السبيعي', '0501000009', 'sales_employee', 'فرع جدة', false)
)
insert into public.profiles (id, full_name, email, phone, role, branch_id, is_active)
select
  seed.id,
  seed.full_name,
  seed.email,
  seed.phone,
  seed.role,
  (select b.id from public.branches b where b.name = seed.branch_name order by b.created_at limit 1),
  seed.is_active
from seed_users seed
on conflict (id) do update
set full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone,
    role = excluded.role,
    branch_id = excluded.branch_id,
    is_active = excluded.is_active;

with customer_names(name) as (
  select *
  from unnest(array[
    'أحمد الزهراني', 'فاطمة المالكي', 'يوسف الحربي', 'لينا العتيبي', 'سعد القحطاني',
    'هيا الدوسري', 'ناصر الغامدي', 'ريم الشهري', 'عبدالله السلمي', 'مشاعل المطيري',
    'خالد العنزي', 'نورة القرشي', 'فيصل الحربي', 'أمل العتيبي', 'تركي الدوسري',
    'سارة القحطاني', 'ماجد الغامدي', 'عبير الزهراني', 'بندر الشهري', 'رنا المالكي',
    'عبدالرحمن السبيعي', 'منى الحربي', 'طلال العتيبي', 'غادة الدوسري', 'وليد القرشي',
    'شهد الغامدي', 'نايف الزهراني', 'خلود المالكي', 'إبراهيم السلمي', 'دانة المطيري',
    'سلطان العنزي', 'جواهر الحربي', 'رامي القحطاني', 'أروى الدوسري', 'بدر الغامدي',
    'مها الشهري', 'صالح الزهراني', 'نجلاء العتيبي', 'فهد المالكي', 'بيان القرشي',
    'حسن السلمي', 'لطيفة الدوسري', 'عبدالمجيد الحربي', 'رغد الغامدي', 'مشاري العتيبي',
    'هند الزهراني', 'زياد المطيري', 'شروق القحطاني', 'رائد الشهري', 'لمى المالكي'
  ]) as names(name)
),
numbered as (
  select row_number() over () as i, name from customer_names
),
customer_seed as (
  select
    i,
    ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid as id,
    name as full_name,
    ('05' || lpad((50000000 + i)::text, 8, '0')) as phone,
    (array['جدة','الرياض','الدمام','مكة'])[((i - 1) % 4) + 1] as city,
    (array['الروضة','النخيل','الشاطئ','الياسمين','العوالي','الفيصلية'])[((i - 1) % 6) + 1] as district,
    (array['زيارة مباشرة للمعرض','واتساب','اتصال','موقع إلكتروني','QR داخل المعرض','إعلان سناب شات','إعلان إنستغرام','إعلان تيك توك','توصية من عميل','حملة تسويقية'])[((i - 1) % 10) + 1] as source_name,
    (array['فرع جدة','فرع الرياض','فرع الدمام','فرع مكة'])[((i - 1) % 4) + 1] as branch_name,
    (array[
      '20000000-0000-0000-0000-000000000005',
      '20000000-0000-0000-0000-000000000006',
      '20000000-0000-0000-0000-000000000007',
      '20000000-0000-0000-0000-000000000008'
    ]::uuid[])[((i - 1) % 4) + 1] as employee_id,
    case
      when i % 10 = 0 then 'sold'
      when i % 9 = 0 then 'negotiation'
      when i % 8 = 0 then 'quotation_sent'
      when i % 7 = 0 then 'quotation_requested'
      when i % 6 = 0 then 'needs_follow_up'
      when i % 5 = 0 then 'not_interested'
      when i % 4 = 0 then 'interested'
      else 'new'
    end as current_status,
    case
      when i % 10 = 0 then 'very_high'
      when i % 3 = 0 then 'high'
      when i % 2 = 0 then 'medium'
      else 'low'
    end as purchase_probability
  from numbered
)
insert into public.customers (
  id,
  full_name,
  phone,
  secondary_phone,
  city,
  district,
  email,
  source_id,
  assigned_employee_id,
  branch_id,
  current_status,
  purchase_probability,
  general_notes,
  created_by,
  created_at,
  updated_at
)
select
  seed.id,
  seed.full_name,
  seed.phone,
  case when seed.i % 6 = 0 then ('05' || lpad((60000000 + seed.i)::text, 8, '0')) else null end,
  seed.city,
  seed.district,
  null,
  (select s.id from public.lead_sources s where s.name = seed.source_name limit 1),
  seed.employee_id,
  (select b.id from public.branches b where b.name = seed.branch_name order by b.created_at limit 1),
  seed.current_status,
  seed.purchase_probability,
  case when seed.i % 4 = 0 then 'يرغب العميل بزيارة المعرض خلال الأسبوع القادم.' else null end,
  seed.employee_id,
  now() - ((seed.i % 28) || ' days')::interval,
  now() - ((seed.i % 10) || ' days')::interval
from customer_seed seed
on conflict (id) do update
set full_name = excluded.full_name,
    phone = excluded.phone,
    secondary_phone = excluded.secondary_phone,
    city = excluded.city,
    district = excluded.district,
    source_id = excluded.source_id,
    assigned_employee_id = excluded.assigned_employee_id,
    branch_id = excluded.branch_id,
    current_status = excluded.current_status,
    purchase_probability = excluded.purchase_probability,
    general_notes = excluded.general_notes,
    updated_at = excluded.updated_at;

with visit_seed as (
  select
    i,
    ('40000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid as id,
    ('30000000-0000-0000-0000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid as customer_id,
    (array['الأدوات الصحية','السيراميك والبورسلان','المطابخ','الرخام والجرانيت','الباركيه والأرضيات','مواد البناء','أخرى'])[((i - 1) % 7) + 1] as category_name,
    case
      when i % 10 = 0 then 'qr_form'
      when i % 6 = 0 then 'whatsapp'
      when i % 5 = 0 then 'call'
      else 'showroom_visit'
    end as visit_type,
    case
      when i % 10 = 0 then 'sold'
      when i % 9 = 0 then 'negotiation'
      when i % 8 = 0 then 'quotation_sent'
      when i % 7 = 0 then 'quotation_requested'
      when i % 6 = 0 then 'needs_follow_up'
      when i % 4 = 0 then 'interested'
      else 'new'
    end as customer_status,
    case
      when i % 10 = 0 then 'very_high'
      when i % 3 = 0 then 'high'
      when i % 2 = 0 then 'medium'
      else 'low'
    end as purchase_probability
  from generate_series(1, 80) as g(i)
)
insert into public.visits (
  id,
  customer_id,
  branch_id,
  sales_employee_id,
  visit_datetime,
  visit_type,
  interest_category_id,
  requested_product,
  budget_range,
  has_measurements,
  needs_second_visit,
  customer_status,
  purchase_probability,
  next_follow_up_at,
  notes,
  created_by,
  created_at,
  updated_at
)
select
  seed.id,
  seed.customer_id,
  c.branch_id,
  c.assigned_employee_id,
  now() - ((seed.i % 30) || ' days')::interval + ((seed.i % 8) || ' hours')::interval,
  seed.visit_type,
  (select cat.id from public.interest_categories cat where cat.name = seed.category_name limit 1),
  (array['خلاطات ومغاسل','بورسلان أرضيات','تصميم مطبخ','رخام درج','باركيه غرف','مواد تأسيس'])[((seed.i - 1) % 6) + 1],
  (array['أقل من 10,000 ريال','10,000 - 25,000 ريال','25,000 - 50,000 ريال','أكثر من 50,000 ريال'])[((seed.i - 1) % 4) + 1],
  seed.i % 3 = 0,
  seed.i % 5 = 0,
  seed.customer_status,
  seed.purchase_probability,
  case when seed.i % 4 = 0 then now() + ((seed.i % 9) || ' days')::interval else null end,
  case when seed.visit_type = 'qr_form' then 'زيارة واردة من نموذج QR داخل المعرض.' else 'تم تسجيل اهتمام العميل ومراجعة الخيارات المناسبة.' end,
  c.assigned_employee_id,
  now() - ((seed.i % 30) || ' days')::interval,
  now() - ((seed.i % 12) || ' days')::interval
from visit_seed seed
join public.customers c on c.id = seed.customer_id
on conflict (id) do update
set customer_id = excluded.customer_id,
    branch_id = excluded.branch_id,
    sales_employee_id = excluded.sales_employee_id,
    visit_datetime = excluded.visit_datetime,
    visit_type = excluded.visit_type,
    interest_category_id = excluded.interest_category_id,
    requested_product = excluded.requested_product,
    budget_range = excluded.budget_range,
    has_measurements = excluded.has_measurements,
    needs_second_visit = excluded.needs_second_visit,
    customer_status = excluded.customer_status,
    purchase_probability = excluded.purchase_probability,
    next_follow_up_at = excluded.next_follow_up_at,
    notes = excluded.notes,
    updated_at = excluded.updated_at;

with follow_up_seed as (
  select
    i,
    ('50000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid as id,
    ('30000000-0000-0000-0000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid as customer_id,
    ('40000000-0000-0000-0000-' || lpad((((i - 1) % 80) + 1)::text, 12, '0'))::uuid as visit_id,
    (array['call','whatsapp','second_visit','send_quotation','other'])[((i - 1) % 5) + 1] as follow_up_type
  from generate_series(1, 60) as g(i)
)
insert into public.follow_ups (
  id,
  customer_id,
  visit_id,
  assigned_employee_id,
  follow_up_type,
  scheduled_at,
  completed_at,
  result,
  status,
  notes,
  created_by,
  created_at,
  updated_at
)
select
  seed.id,
  seed.customer_id,
  seed.visit_id,
  c.assigned_employee_id,
  seed.follow_up_type,
  case
    when seed.i % 5 = 0 then now() - ((seed.i % 6 + 1) || ' days')::interval
    when seed.i % 4 = 0 then now() - ((seed.i % 7 + 1) || ' days')::interval
    when seed.i % 3 = 0 then date_trunc('day', now()) + ((9 + seed.i % 8) || ' hours')::interval
    else now() + ((seed.i % 14 + 1) || ' days')::interval
  end,
  case when seed.i % 5 = 0 then now() - ((seed.i % 3 + 1) || ' days')::interval else null end,
  case when seed.i % 5 = 0 then 'تم التواصل مع العميل وتحديث الاهتمام.' else null end,
  case
    when seed.i % 15 = 0 then 'cancelled'
    when seed.i % 5 = 0 then 'completed'
    when seed.i % 4 = 0 then 'overdue'
    when seed.i % 3 = 0 then 'due_today'
    else 'upcoming'
  end,
  case when seed.i % 4 = 0 then 'يلزم تواصل سريع مع العميل.' else 'متابعة مجدولة ضمن خطة المبيعات.' end,
  c.assigned_employee_id,
  now() - ((seed.i % 20) || ' days')::interval,
  now() - ((seed.i % 9) || ' days')::interval
from follow_up_seed seed
join public.customers c on c.id = seed.customer_id
on conflict (id) do update
set customer_id = excluded.customer_id,
    visit_id = excluded.visit_id,
    assigned_employee_id = excluded.assigned_employee_id,
    follow_up_type = excluded.follow_up_type,
    scheduled_at = excluded.scheduled_at,
    completed_at = excluded.completed_at,
    result = excluded.result,
    status = excluded.status,
    notes = excluded.notes,
    updated_at = excluded.updated_at;

insert into public.activity_logs (id, entity_type, entity_id, action, old_value, new_value, performed_by, created_at)
select
  ('60000000-0000-0000-0001-' || lpad(i::text, 12, '0'))::uuid,
  'customer',
  ('30000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  'customer_created',
  null,
  jsonb_build_object('source', 'seed'),
  (array[
    '20000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000008'
  ]::uuid[])[((i - 1) % 4) + 1],
  now() - ((i % 28) || ' days')::interval
from generate_series(1, 50) as g(i)
on conflict (id) do update
set created_at = excluded.created_at;

insert into public.activity_logs (id, entity_type, entity_id, action, old_value, new_value, performed_by, created_at)
select
  ('60000000-0000-0000-0002-' || lpad(i::text, 12, '0'))::uuid,
  'visit',
  ('40000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  'visit_created',
  null,
  jsonb_build_object('source', 'seed'),
  v.sales_employee_id,
  now() - ((i % 30) || ' days')::interval
from generate_series(1, 80) as g(i)
join public.visits v on v.id = ('40000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
on conflict (id) do update
set created_at = excluded.created_at;

insert into public.activity_logs (id, entity_type, entity_id, action, old_value, new_value, performed_by, created_at)
select
  ('60000000-0000-0000-0003-' || lpad(i::text, 12, '0'))::uuid,
  'follow_up',
  ('50000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  case when i % 5 = 0 then 'follow_up_completed' else 'follow_up_created' end,
  null,
  jsonb_build_object('source', 'seed'),
  f.assigned_employee_id,
  now() - ((i % 20) || ' days')::interval
from generate_series(1, 60) as g(i)
join public.follow_ups f on f.id = ('50000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid
on conflict (id) do update
set action = excluded.action,
    created_at = excluded.created_at;

insert into public.notifications (
  id,
  user_id,
  title,
  message,
  type,
  is_read,
  related_entity_type,
  related_entity_id,
  created_at
)
select
  ('70000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
  (array[
    '20000000-0000-0000-0000-000000000003',
    '20000000-0000-0000-0000-000000000004',
    '20000000-0000-0000-0000-000000000005',
    '20000000-0000-0000-0000-000000000006',
    '20000000-0000-0000-0000-000000000007',
    '20000000-0000-0000-0000-000000000008'
  ]::uuid[])[((i - 1) % 6) + 1],
  case
    when i % 4 = 0 then 'متابعة متأخرة'
    when i % 3 = 0 then 'زيارة جديدة من نموذج QR'
    when i % 2 = 0 then 'تم إسناد عميل لك'
    else 'متابعة مستحقة اليوم'
  end,
  case
    when i % 4 = 0 then 'توجد متابعة متأخرة تحتاج إجراء اليوم.'
    when i % 3 = 0 then 'تم تسجيل اهتمام جديد من نموذج QR داخل المعرض.'
    when i % 2 = 0 then 'تم إسناد عميل جديد إلى حسابك.'
    else 'لديك متابعة مستحقة اليوم مع أحد العملاء.'
  end,
  case
    when i % 4 = 0 then 'follow_up_overdue'
    when i % 3 = 0 then 'qr_visit_created'
    when i % 2 = 0 then 'customer_assigned'
    else 'follow_up_due_today'
  end,
  i % 5 = 0,
  case when i % 3 = 0 then 'visit' when i % 2 = 0 then 'customer' else 'follow_up' end,
  case
    when i % 3 = 0 then ('40000000-0000-0000-0000-' || lpad((((i - 1) % 80) + 1)::text, 12, '0'))::uuid
    when i % 2 = 0 then ('30000000-0000-0000-0000-' || lpad((((i - 1) % 50) + 1)::text, 12, '0'))::uuid
    else ('50000000-0000-0000-0000-' || lpad((((i - 1) % 60) + 1)::text, 12, '0'))::uuid
  end,
  now() - ((i % 8) || ' days')::interval
from generate_series(1, 24) as g(i)
on conflict (id) do update
set user_id = excluded.user_id,
    title = excluded.title,
    message = excluded.message,
    type = excluded.type,
    is_read = excluded.is_read,
    related_entity_type = excluded.related_entity_type,
    related_entity_id = excluded.related_entity_id,
    created_at = excluded.created_at;
