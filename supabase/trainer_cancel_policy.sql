-- Gir trenere tillatelse til å avbestille bookinger på sine egne slots
CREATE POLICY "Trainers can cancel bookings on their slots" ON bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM availability_slots
      WHERE availability_slots.id = bookings.slot_id
      AND availability_slots.trainer_id = auth.uid()
    )
  );
