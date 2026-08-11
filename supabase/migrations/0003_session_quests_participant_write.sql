-- Let participants attach/detach quests on their OWN sessions from the Quests
-- app. Staff keep full access via the existing sq_write policy; RLS policies for
-- the same command are OR'd, so these simply add the participant-owned case.

create policy sq_insert_own on public.session_quests for insert
  with check (exists (
    select 1 from public.schedule_sessions s
    where s.id = session_id and s.participant_id = auth.uid()
  ));

create policy sq_delete_own on public.session_quests for delete
  using (exists (
    select 1 from public.schedule_sessions s
    where s.id = session_id and s.participant_id = auth.uid()
  ));
