/*
  # Add last_tracked_at field to habits table

  1. Changes
    - Add `last_tracked_at` (timestamptz, nullable) to `habits` table
      - Stores the timestamp when user last clicked "Start Tracking"
      - Used to calculate 24-hour countdown timer
    
  2. Purpose
    - Enable 24-hour tracking system instead of manual day increments
    - Allow users to track when they last checked in
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'habits' AND column_name = 'last_tracked_at'
  ) THEN
    ALTER TABLE habits ADD COLUMN last_tracked_at timestamptz;
  END IF;
END $$;
