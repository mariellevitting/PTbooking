CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_booked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view slots" ON availability_slots
  FOR SELECT USING (true);

CREATE POLICY "Trainers can manage their own slots" ON availability_slots
  FOR ALL USING (auth.uid() = trainer_id);
