-- ========================================
-- Reminder Table Updates Migration
-- ========================================
-- This script updates the reminders table to align with frontend:
-- 1. Adds 'priority' column
-- 2. Updates 'type' enum (test, general instead of custom)
-- 3. Updates 'status' enum (pending, dismissed, completed instead of scheduled, cancelled, failed)

-- Step 1: Add priority column
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';

-- Step 2: Update existing type values
-- Change 'custom' to 'general'
UPDATE reminders 
SET type = 'general' 
WHERE type = 'custom';

-- Step 3: Convert type column to varchar temporarily
ALTER TABLE reminders 
ALTER COLUMN type TYPE VARCHAR(50);

-- Drop old enum
DROP TYPE IF EXISTS "reminders_type_enum" CASCADE;

-- Create new enum with updated values
CREATE TYPE "reminders_type_enum" AS ENUM ('appointment', 'medication', 'followup', 'test', 'general');

-- Apply new enum to column
ALTER TABLE reminders 
ALTER COLUMN type TYPE "reminders_type_enum" 
USING type::text::"reminders_type_enum";

-- Set default
ALTER TABLE reminders 
ALTER COLUMN type SET DEFAULT 'general'::"reminders_type_enum";

-- Step 4: Update existing status values
-- Map old statuses to new ones
UPDATE reminders 
SET status = CASE 
  WHEN status = 'scheduled' THEN 'pending'
  WHEN status = 'cancelled' THEN 'dismissed'
  WHEN status = 'failed' THEN 'dismissed'
  ELSE status
END;

-- Convert status column to varchar temporarily
ALTER TABLE reminders 
ALTER COLUMN status TYPE VARCHAR(50);

-- Drop old enum
DROP TYPE IF EXISTS "reminders_status_enum" CASCADE;

-- Create new enum with updated values
CREATE TYPE "reminders_status_enum" AS ENUM ('pending', 'sent', 'dismissed', 'completed');

-- Apply new enum to column
ALTER TABLE reminders 
ALTER COLUMN status TYPE "reminders_status_enum" 
USING status::text::"reminders_status_enum";

-- Set default
ALTER TABLE reminders 
ALTER COLUMN status SET DEFAULT 'pending'::"reminders_status_enum";

-- Step 5: Create priority enum and apply it
DROP TYPE IF EXISTS "reminders_priority_enum" CASCADE;

CREATE TYPE "reminders_priority_enum" AS ENUM ('low', 'medium', 'high', 'urgent');

ALTER TABLE reminders 
ALTER COLUMN priority TYPE "reminders_priority_enum" 
USING priority::text::"reminders_priority_enum";

ALTER TABLE reminders 
ALTER COLUMN priority SET DEFAULT 'medium'::"reminders_priority_enum";

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default 
FROM information_schema.columns 
WHERE table_name = 'reminders' 
ORDER BY ordinal_position;

-- Display updated reminders
SELECT COUNT(*) as total_reminders, status, priority 
FROM reminders 
GROUP BY status, priority;

COMMIT;
