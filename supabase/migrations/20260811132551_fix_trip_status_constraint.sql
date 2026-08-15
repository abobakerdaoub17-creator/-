-- The app uses 'loading', 'active', 'completed', 'cancelled' for trip status,
-- but the DB constraint only allowed 'open', 'closed', 'cancelled'.
-- This caused every trip creation to fail. Align the constraint with the app.

ALTER TABLE trips DROP CONSTRAINT trips_status_check;
ALTER TABLE trips ALTER COLUMN status SET DEFAULT 'loading';
ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('loading', 'active', 'completed', 'cancelled'));
