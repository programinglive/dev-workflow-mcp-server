-- Create workflow_history table
CREATE TABLE IF NOT EXISTS workflow_history (
  id SERIAL PRIMARY KEY,
  task_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  commit_message TEXT,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tests_passed BOOLEAN DEFAULT FALSE,
  documentation_type VARCHAR(50),
  user_id INTEGER REFERENCES users(id)
);

-- Create index on completed_at for faster sorting
CREATE INDEX IF NOT EXISTS idx_workflow_history_completed_at ON workflow_history(completed_at DESC);
