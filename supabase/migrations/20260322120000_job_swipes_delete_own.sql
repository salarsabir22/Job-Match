-- Allow students to remove a saved swipe or replace it with an apply (delete + insert pattern).
DROP POLICY IF EXISTS "js_delete_own" ON job_swipes;
CREATE POLICY "js_delete_own" ON job_swipes FOR DELETE
  USING (student_id = auth.uid() AND auth_user_role() = 'student');
