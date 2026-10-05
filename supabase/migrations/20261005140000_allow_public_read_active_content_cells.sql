-- Public membership renewal needs active content cells to be readable
-- because the public form and submission validator use the live org_units tree.
drop policy if exists "public read active join units" on public.org_units;

create policy "public read active join units"
on public.org_units
for select
to anon
using (
  is_active = true
  and unit_type = any (array['cell'::text,'department'::text,'field_team'::text])
);