revoke execute on function public.create_dental_workspace() from public,anon,authenticated;
revoke execute on function public.current_clinic() from public,anon; grant execute on function public.current_clinic() to authenticated;
revoke execute on function public.has_role(uuid,public.app_role) from public,anon; grant execute on function public.has_role(uuid,public.app_role) to authenticated;
revoke execute on function public.clinic_accepts_booking(uuid) from public; grant execute on function public.clinic_accepts_booking(uuid) to anon,authenticated;
revoke execute on function public.available_slots(uuid) from public; grant execute on function public.available_slots(uuid) to anon,authenticated;
revoke execute on function public.reserve_slot(uuid,timestamptz,text,text) from public; grant execute on function public.reserve_slot(uuid,timestamptz,text,text) to anon,authenticated;
revoke execute on function public.booking_clinic(uuid) from public; grant execute on function public.booking_clinic(uuid) to anon,authenticated;
revoke execute on function public.public_clinic(uuid) from public; grant execute on function public.public_clinic(uuid) to anon,authenticated;