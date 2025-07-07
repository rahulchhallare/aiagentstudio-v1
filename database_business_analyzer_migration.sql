-- Business Analysis tables for Supabase
-- Run this SQL in your Supabase SQL editor

-- Business Analysis table
CREATE TABLE IF NOT EXISTS business_analyses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  website_url TEXT NOT NULL,
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  industry TEXT NOT NULL,
  pain_points JSONB NOT NULL,
  workflows JSONB NOT NULL,
  content_summary TEXT NOT NULL,
  key_features JSONB NOT NULL,
  target_audience TEXT NOT NULL,
  current_tech JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id SERIAL PRIMARY KEY,
  analysis_id INTEGER NOT NULL REFERENCES business_analyses(id),
  solution_type TEXT NOT NULL,
  solution_name TEXT NOT NULL,
  description TEXT NOT NULL,
  estimated_cost_savings INTEGER NOT NULL,
  estimated_time_savings TEXT NOT NULL,
  implementation_difficulty TEXT NOT NULL,
  roi_percentage INTEGER NOT NULL,
  industry_benchmark TEXT NOT NULL,
  priority_score INTEGER NOT NULL,
  template_id TEXT NOT NULL,
  customization_data JSONB NOT NULL,
  reasoning TEXT NOT NULL,
  rag_evidence JSONB,
  case_studies JSONB,
  ethical_considerations TEXT,
  compliance_requirements JSONB,
  monitoring_metrics JSONB,
  implementation_timeline TEXT,
  expected_revenue INTEGER,
  risk_factors JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Agent Templates table
CREATE TABLE IF NOT EXISTS ai_agent_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  solution_type TEXT NOT NULL,
  industry TEXT NOT NULL,
  template_config JSONB NOT NULL,
  capabilities JSONB NOT NULL,
  integration_requirements JSONB NOT NULL,
  pricing_model TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deployed Solutions table
CREATE TABLE IF NOT EXISTS deployed_solutions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  analysis_id INTEGER NOT NULL REFERENCES business_analyses(id),
  template_id INTEGER NOT NULL REFERENCES ai_agent_templates(id),
  solution_name TEXT NOT NULL,
  deployment_status TEXT NOT NULL DEFAULT 'pending',
  deployment_url TEXT,
  deployment_id TEXT,
  configuration JSONB NOT NULL,
  performance_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_analyses_user_id ON business_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_analysis_id ON ai_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_deployed_solutions_user_id ON deployed_solutions(user_id);
CREATE INDEX IF NOT EXISTS idx_deployed_solutions_analysis_id ON deployed_solutions(analysis_id);

-- Disable Row Level Security for application-managed access control
ALTER TABLE business_analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations DISABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE deployed_solutions DISABLE ROW LEVEL SECURITY;

-- Drop existing RLS policies if they exist
DROP POLICY IF EXISTS "Users can view their own business analyses" ON business_analyses;
DROP POLICY IF EXISTS "Users can insert their own business analyses" ON business_analyses;
DROP POLICY IF EXISTS "Users can view recommendations for their analyses" ON ai_recommendations;
DROP POLICY IF EXISTS "Users can insert recommendations for their analyses" ON ai_recommendations;
DROP POLICY IF EXISTS "Everyone can view active AI agent templates" ON ai_agent_templates;
DROP POLICY IF EXISTS "Users can view their own deployed solutions" ON deployed_solutions;
DROP POLICY IF EXISTS "Users can insert their own deployed solutions" ON deployed_solutions;
DROP POLICY IF EXISTS "Users can update their own deployed solutions" ON deployed_solutions;

-- Grant appropriate permissions to authenticated users
-- Replace 'authenticated' with your actual database role if different
GRANT SELECT, INSERT, UPDATE, DELETE ON business_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_recommendations TO authenticated;
GRANT SELECT ON ai_agent_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON deployed_solutions TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE business_analyses_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ai_recommendations_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ai_agent_templates_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE deployed_solutions_id_seq TO authenticated;