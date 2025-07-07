
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

-- Enable Row Level Security (RLS)
ALTER TABLE business_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployed_solutions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own business analyses" ON business_analyses
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own business analyses" ON business_analyses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view recommendations for their analyses" ON ai_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM business_analyses 
      WHERE business_analyses.id = ai_recommendations.analysis_id 
      AND business_analyses.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert recommendations for their analyses" ON ai_recommendations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_analyses 
      WHERE business_analyses.id = ai_recommendations.analysis_id 
      AND business_analyses.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Everyone can view active AI agent templates" ON ai_agent_templates
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Users can view their own deployed solutions" ON deployed_solutions
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own deployed solutions" ON deployed_solutions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own deployed solutions" ON deployed_solutions
  FOR UPDATE USING (auth.uid()::text = user_id::text);
