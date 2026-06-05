-- Trigger: sett is_booked = true automatisk når booking opprettes
CREATE OR REPLACE FUNCTION handle_new_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE availability_slots SET is_booked = true WHERE id = NEW.slot_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_new_booking();

-- Trigger: sett is_booked = false igjen når booking avbestilles
CREATE OR REPLACE FUNCTION handle_cancelled_booking()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    UPDATE availability_slots SET is_booked = false WHERE id = NEW.slot_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_cancelled ON bookings;
CREATE TRIGGER on_booking_cancelled
  AFTER UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION handle_cancelled_booking();
