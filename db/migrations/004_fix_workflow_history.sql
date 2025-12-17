-- Add missing columns for frontend compatibility
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS tests_passed BOOLEAN DEFAULT FALSE;
ALTER TABLE workflow_history ADD COLUMN IF NOT EXISTS documentation_type VARCHAR(50);
