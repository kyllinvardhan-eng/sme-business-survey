CREATE TABLE survey_responses (
  id BIGSERIAL PRIMARY KEY,
  response_id TEXT UNIQUE NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  industry TEXT,
  company_size TEXT,
  role TEXT,
  time_consuming_tasks TEXT,
  manual_work_areas TEXT[],
  tasks_being_missed TEXT,
  hours_lost_per_week TEXT,
  desired_specialist_support TEXT[],
  ideal_additional_role TEXT,
  systems_used TEXT[],
  named_software TEXT,
  business_visibility_score INTEGER,
  daily_brief_value_score INTEGER,
  desired_outcomes TEXT[],
  ai_action_comfort TEXT,
  willingness_to_pay TEXT,
  definition_of_value TEXT,
  biggest_frustration TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_company TEXT,
  followup_permission BOOLEAN DEFAULT FALSE,
  utm_source TEXT DEFAULT 'organic'
);

-- Enable Row Level Security
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Allow the public "anon" key to INSERT new responses (survey submissions),
-- but not to SELECT/UPDATE/DELETE. Handled server-side via the
-- submit-response Netlify function.
CREATE POLICY "Allow anonymous inserts"
  ON survey_responses
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Reads for the admin dashboard go through the get-responses Netlify
-- function using the SUPABASE_SERVICE_ROLE_KEY (server-side only, never
-- exposed to the browser), which bypasses RLS. No SELECT policy is
-- granted to the anon key.
