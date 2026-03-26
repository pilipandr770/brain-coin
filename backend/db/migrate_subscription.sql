-- Run once to add subscription fields to existing databases
SET search_path TO braincoin;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin             BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id   VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_sub_id        VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_status           VARCHAR(20) DEFAULT 'none';
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at        TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS sub_current_period_end TIMESTAMP;

-- Add check constraint safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'users' AND constraint_name = 'users_sub_status_check'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_sub_status_check
      CHECK (sub_status IN ('none','trialing','active','past_due','canceled'));
  END IF;
END $$;
