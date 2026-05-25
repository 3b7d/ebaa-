drop policy if exists activity_logs_select_scoped on public.activity_logs;

create policy activity_logs_select_scoped on public.activity_logs
for select to authenticated
using (
  public.is_admin()
  or public.is_manager()
  or (
    entity_type = 'customer'
    and exists (
      select 1
      from public.customers c
      where c.id = activity_logs.entity_id
        and (
          (public.is_branch_supervisor() and c.branch_id = public.get_current_user_branch_id())
          or (public.is_sales_employee() and (c.assigned_employee_id = auth.uid() or c.created_by = auth.uid()))
        )
    )
  )
  or (
    entity_type = 'visit'
    and exists (
      select 1
      from public.visits v
      where v.id = activity_logs.entity_id
        and (
          (public.is_branch_supervisor() and v.branch_id = public.get_current_user_branch_id())
          or (public.is_sales_employee() and (v.sales_employee_id = auth.uid() or v.created_by = auth.uid()))
        )
    )
  )
  or (
    entity_type = 'follow_up'
    and exists (
      select 1
      from public.follow_ups f
      join public.customers c on c.id = f.customer_id
      where f.id = activity_logs.entity_id
        and (
          f.assigned_employee_id = auth.uid()
          or f.created_by = auth.uid()
          or (public.is_branch_supervisor() and c.branch_id = public.get_current_user_branch_id())
        )
    )
  )
);
