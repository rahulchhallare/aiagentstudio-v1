-- Create the business_analyses table
CREATE TABLE IF NOT EXISTS public.business_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    website_url TEXT NOT NULL,
    business_name TEXT,
    business_type TEXT,
    industry_analysis TEXT,
    pain_points TEXT[],
    current_workflows TEXT[],
    technology_stack TEXT[],
    raw_analysis_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create the ai_recommendations table
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id SERIAL PRIMARY KEY,
    business_analysis_id INTEGER NOT NULL REFERENCES public.business_analyses(id) ON DELETE CASCADE,
    solution_type TEXT NOT NULL,
    solution_name TEXT NOT NULL,
    description TEXT,
    estimated_cost_savings DECIMAL(10,2),
    estimated_time_savings TEXT,
    implementation_difficulty TEXT CHECK (implementation_difficulty IN ('easy', 'medium', 'hard')),
    roi_percentage DECIMAL(5,2),
    industry_benchmark TEXT,
    priority_score INTEGER,
    template_id TEXT,
    customization_data JSONB,
    reasoning TEXT,
    rag_evidence TEXT[],
    case_studies TEXT[],
    ethical_considerations TEXT,
    compliance_requirements TEXT[],
    monitoring_metrics TEXT[],
    implementation_timeline TEXT,
    expected_revenue DECIMAL(12,2),
    risk_factors TEXT[],
    availability_status TEXT CHECK (availability_status IN ('Available', 'Missing')),
    creation_prompt JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_business_analyses_user_id ON public.business_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_business_analyses_created_at ON public.business_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_business_analysis_id ON public.ai_recommendations(business_analysis_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_solution_type ON public.ai_recommendations(solution_type);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_availability_status ON public.ai_recommendations(availability_status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.business_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS (basic policies - you may want to customize these)
CREATE POLICY "Users can view their own business analyses" ON public.business_analyses
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own business analyses" ON public.business_analyses
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view recommendations for their analyses" ON public.ai_recommendations
    FOR SELECT USING (
        business_analysis_id IN (
            SELECT id FROM public.business_analyses 
            WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can insert recommendations for their analyses" ON public.ai_recommendations
    FOR INSERT WITH CHECK (
        business_analysis_id IN (
            SELECT id FROM public.business_analyses 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.business_analyses TO authenticated;
GRANT ALL ON public.ai_recommendations TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;