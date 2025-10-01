/*
  # Habits Tracking System

  1. New Tables
    - `habits`
      - `id` (uuid, primary key) - Unique identifier for each habit
      - `user_id` (uuid) - Reference to the user (auth.users)
      - `title` (text) - The habit title (e.g., "Smoking", "Drinking")
      - `start_date` (timestamptz) - When the user started tracking
      - `current_streak` (integer) - Current consecutive days without the habit
      - `longest_streak` (integer) - Best streak achieved
      - `last_reset_date` (timestamptz) - Last time the streak was reset
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `habit_logs`
      - `id` (uuid, primary key) - Unique identifier for each log entry
      - `habit_id` (uuid) - Reference to habits table
      - `log_date` (date) - Date of the log entry
      - `status` (text) - Status: 'success' or 'reset'
      - `notes` (text) - Optional notes
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on both tables
    - Users can only access their own habits and logs
    - Policies for authenticated users to create, read, update, and delete their own data
*/

-- Create habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_date timestamptz DEFAULT now() NOT NULL,
  current_streak integer DEFAULT 0 NOT NULL,
  longest_streak integer DEFAULT 0 NOT NULL,
  last_reset_date timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create habit_logs table
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  log_date date DEFAULT CURRENT_DATE NOT NULL,
  status text DEFAULT 'success' NOT NULL CHECK (status IN ('success', 'reset')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for habits table
CREATE POLICY "Users can view own habits"
  ON habits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits"
  ON habits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for habit_logs table
CREATE POLICY "Users can view own habit logs"
  ON habit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_logs.habit_id
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own habit logs"
  ON habit_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_logs.habit_id
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own habit logs"
  ON habit_logs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_logs.habit_id
      AND habits.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_logs.habit_id
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own habit logs"
  ON habit_logs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM habits
      WHERE habits.id = habit_logs.habit_id
      AND habits.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_log_date ON habit_logs(log_date);