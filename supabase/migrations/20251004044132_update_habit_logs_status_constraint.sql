/*
  # Update habit_logs status constraint

  1. Changes
    - Modify the status check constraint on habit_logs table to include 'note' as a valid status
    - This allows users to add notes without requiring a reset or success event
  
  2. Security
    - No changes to RLS policies
*/

-- Drop the existing constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%habit_logs_status_check%'
  ) THEN
    ALTER TABLE habit_logs DROP CONSTRAINT habit_logs_status_check;
  END IF;
END $$;

-- Add the updated constraint with 'note' included
ALTER TABLE habit_logs 
ADD CONSTRAINT habit_logs_status_check 
CHECK (status IN ('success', 'reset', 'note'));