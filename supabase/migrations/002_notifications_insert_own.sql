drop policy if exists notifications_insert_admin on public.notifications;
create policy notifications_insert_own_or_admin on public.notifications
for insert to authenticated
with check (user_id = auth.uid() or public.is_admin());
