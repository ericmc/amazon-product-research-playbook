-- Create opportunities table for storing analyzed products
CREATE TABLE public.opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('jungle_scout', 'helium_10', 'amazon_poe', 'manual')),
  criteria JSONB NOT NULL DEFAULT '[]',
  final_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scored', 'analyzing', 'sourcing', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create raw_imports table for audit trail
CREATE TABLE public.raw_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  source TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  field_mappings JSONB NOT NULL DEFAULT '{}',
  import_metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;

-- Create policies for opportunities
CREATE POLICY "Users can view their own opportunities" 
ON public.opportunities 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own opportunities" 
ON public.opportunities 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunities" 
ON public.opportunities 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own opportunities" 
ON public.opportunities 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create policies for raw_imports
CREATE POLICY "Users can view their own raw imports" 
ON public.raw_imports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own raw imports" 
ON public.raw_imports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_opportunities_user_id ON public.opportunities(user_id);
CREATE INDEX idx_opportunities_created_at ON public.opportunities(created_at DESC);
CREATE INDEX idx_raw_imports_opportunity_id ON public.raw_imports(opportunity_id);
CREATE INDEX idx_raw_imports_user_id ON public.raw_imports(user_id);