CREATE TABLE IF NOT EXISTS bookings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_id uuid REFERENCES availability_slots(id) ON DELETE CASCADE NOT NULL,
  booker_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  dancer_name text NOT NULL,
  dance_style text NOT NULL,
  status text NOT NULL DEFAULT 'confirmed',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookers can see their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = booker_id);

CREATE POLICY "Trainers can see bookings for their slots" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM availability_slots
      WHERE availability_slots.id = bookings.slot_id
      AND availability_slots.trainer_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = booker_id);

CREATE POLICY "Bookers can cancel their own bookings" ON bookings
  FOR UPDATE USING (auth.uid() = booker_id);
