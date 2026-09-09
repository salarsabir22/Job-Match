-- Native match chat: recipients can mark messages read, and realtime delivers new rows.

DROP POLICY IF EXISTS "msg_update_party" ON messages;
CREATE POLICY "msg_update_party" ON messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
        AND (m.student_id = auth.uid() OR m.recruiter_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
        AND (m.student_id = auth.uid() OR m.recruiter_id = auth.uid())
    )
  );

ALTER TABLE messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
