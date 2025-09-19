# Database Schema Documentation

## Overview

This document outlines the database schemas used by the Amazon Product Research Playbook application. The system supports both local storage (browser) and cloud storage (Supabase) for data persistence.

## Storage Options

### Local Storage
- **Advantages**: Fast, works offline, no authentication required
- **Disadvantages**: Limited to single browser, data can be lost
- **Implementation**: Uses browser localStorage with JSON serialization

### Supabase Cloud Storage
- **Advantages**: Synced across devices, backed up, secure
- **Disadvantages**: Requires authentication, internet connection
- **Implementation**: PostgreSQL database with Row Level Security

## Table Schemas

### 1. opportunities

Stores product opportunity data and scoring results.

```sql
CREATE TABLE public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '[]'::jsonb,
  final_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft'::text,
  source text NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own opportunities" 
  ON public.opportunities FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own opportunities" 
  ON public.opportunities FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own opportunities" 
  ON public.opportunities FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own opportunities" 
  ON public.opportunities FOR DELETE 
  USING (auth.uid() = user_id);
```

**Columns:**
- `id`: Unique identifier (UUID)
- `user_id`: References authenticated user
- `product_name`: Name of the product opportunity
- `criteria`: JSON array of scoring criteria with weights and values
- `final_score`: Calculated overall score (0-100)
- `status`: Current status ('draft', 'scored', 'analyzing', 'sourcing', 'archived')
- `source`: Where data originated ('manual', 'jungle_scout', 'helium_10', 'amazon_poe')
- `notes`: Optional user notes
- `created_at`: Timestamp when record was created
- `updated_at`: Timestamp when record was last modified

### 2. raw_imports

Stores raw data imported from external tools before processing.

```sql
CREATE TABLE public.raw_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
  source text NOT NULL,
  raw_data jsonb NOT NULL,
  field_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  import_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.raw_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own raw imports" 
  ON public.raw_imports FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own raw imports" 
  ON public.raw_imports FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

**Columns:**
- `id`: Unique identifier (UUID)
- `user_id`: References authenticated user
- `opportunity_id`: Optional link to processed opportunity
- `source`: Import source ('jungle_scout', 'helium_10', 'amazon_poe', 'csv')
- `raw_data`: Original imported data as JSON
- `field_mappings`: How raw fields map to our schema
- `import_metadata`: Additional metadata about the import
- `created_at`: Timestamp when import occurred

## Data Types

### Criteria JSON Structure

The `criteria` field in opportunities stores an array of objects with this structure:

```typescript
interface ScoringCriteria {
  id: string;           // Unique identifier ('revenue', 'demand', etc.)
  name: string;         // Display name
  weight: number;       // Importance weight (0-100)
  value: number;        // Current score value
  maxValue: number;     // Maximum possible value
  description: string;  // Description of the criteria
  threshold: number;    // Minimum passing threshold
  source?: string;      // Data source ('jungle_scout', 'helium_10', etc.)
}
```

### Status Enum Values

```typescript
type OpportunityStatus = 
  | 'draft'      // Initial state, not yet scored
  | 'scored'     // Scoring completed
  | 'analyzing'  // Under analysis
  | 'sourcing'   // Sourcing suppliers
  | 'archived';  // No longer active
```

## Environment Variables

When using Supabase, these environment variables are required:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_supabase_project_id
```

## Migration Strategy

The application automatically handles migration from localStorage to Supabase when users toggle cloud storage:

1. User enables Supabase storage in Settings
2. System reads existing localStorage data
3. For each opportunity, creates corresponding Supabase record
4. Future operations use Supabase storage
5. localStorage data remains as backup

## Security Considerations

- **Row Level Security (RLS)**: All tables use RLS to ensure users only access their own data
- **Authentication Required**: Supabase operations require authenticated users
- **Data Validation**: Client-side validation before database operations
- **No Direct Database Access**: All operations go through Supabase client with proper auth

## Performance Optimizations

- **Indexes**: Consider adding indexes on frequently queried fields
- **JSON Queries**: Use Supabase's JSONB operators for efficient criteria filtering
- **Pagination**: Implement pagination for large opportunity lists
- **Caching**: Use React Query for client-side caching of opportunity data