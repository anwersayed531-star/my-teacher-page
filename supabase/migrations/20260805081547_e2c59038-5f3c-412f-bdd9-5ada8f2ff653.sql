revoke execute on function public.has_role(uuid, public.app_role) from anon;
revoke execute on function public.is_teacher() from anon;
revoke execute on function public.my_grade() from anon;
revoke execute on function public.is_enrolled(uuid) from anon;
revoke execute on function public.can_view_course(uuid) from anon;
revoke execute on function public.can_view_lesson(uuid) from anon;
revoke execute on function public.redeem_code(text) from anon;
revoke execute on function public.handle_new_user() from anon, authenticated;