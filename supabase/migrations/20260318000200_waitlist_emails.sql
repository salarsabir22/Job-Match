-- 1) Allow recruiters to read job_swipes for their own jobs
DROP POLICY IF EXISTS "js_select_recruiter_own_job" ON job_swipes;

CREATE POLICY "js_select_recruiter_own_job" ON job_swipes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM jobs
    WHERE jobs.id = job_swipes.job_id
      AND jobs.recruiter_id = auth.uid()
  )
);