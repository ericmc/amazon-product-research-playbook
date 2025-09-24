import { supabase } from "@/integrations/supabase/client";
import { safeParseLocalStorage, safeStringify } from './safeJson';

export interface SavedOpportunity {
  id: string;
  productName: string;
  criteria: any[];
  finalScore: number;
  createdAt: string;
  updatedAt?: string;
  lastRefreshedAt?: string;
  status: 'draft' | 'scored' | 'analyzing' | 'sourcing' | 'archived';
  source?: string;
  notes?: string;
  imageUrl?: string;
  asin?: string;
  importedAt?: string;
  importNotes?: string;
  recommendation?: string;
  validation?: {
    checklist: {
      demandProof: { completed: boolean; notes: string; links: string };
      marginCalculation: { completed: boolean; notes: string; cogs: number; fbaFee: number; freight: number; duty: number; computedMargin: number };
      competitiveLandscape: { completed: boolean; notes: string; competitors: Array<{ asin: string; price: number; reviews: number; revenue?: number }> };
      differentiationPlan: { completed: boolean; notes: string; levers: string[] };
      operationalRisks: { completed: boolean; notes: string; risks: { tooling: boolean; certifications: boolean; hazmat: boolean; oversize: boolean; fragile: boolean; moq: boolean } };
    };
    confidenceScore: number;
    lastUpdated: string;
  };
  decision?: {
    branch: 'proceed' | 'gather-data' | 'reject';
    reason?: string;
    decidedAt: string;
    gates: { [key: string]: boolean };
    weakestCriteria: string[];
  };
  history?: Array<{
    date: string;
    summary: string;
    type: 'import' | 'validation' | 'score_update' | 'decision' | 'refresh' | 'other';
    source?: string;
    notes?: string;
    scoreChange?: number;
    oldScore?: number;
    newScore?: number;
  }>;
  checklist?: {
    items: any[];
    completionRate: number;
    lastUpdated: string;
  };
  sourcingPacket?: {
    keywords: string[];
    competitorASINs: string[];
    differentiation: string;
    screenshots: string[];
    links: string[];
    status: "requested-quotes" | "samples" | "in-tooling" | "not-started";
    notes: string;
  };
  refreshData?: {
    lastRefreshed: string;
    nextRefreshDue: string;
    refreshFrequency: number;
    isOverdue: boolean;
    trendNotes: Array<{
      date: string;
      oldScore: number;
      newScore: number;
      note: string;
      keyChanges: string[];
    }>;
    checklist: {
      dataRetrieved: boolean;
      scoreRecalculated: boolean;
      trendsAnalyzed: boolean;
      notesLogged: boolean;
      competitorsChecked: boolean;
    };
  };
}

export interface StorageSettings {
  useSupabase: boolean;
}

class OpportunityStorage {
  private settings: StorageSettings;

  constructor() {
    this.settings = this.getSettings();
  }

  private getSettings(): StorageSettings {
    return safeParseLocalStorage('app_settings', { useSupabase: true });
  }

  private saveSettings(settings: StorageSettings) {
    this.settings = settings;
    try {
      localStorage.setItem('app_settings', safeStringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  async toggleStorage(useSupabase: boolean) {
    this.saveSettings({ useSupabase });
    
    if (useSupabase) {
      // Migrate existing localStorage data to Supabase
      await this.migrateToSupabase();
    }
  }

  async saveOpportunity(opportunity: SavedOpportunity): Promise<void> {
    opportunity.updatedAt = new Date().toISOString();
    if (this.settings.useSupabase) {
      try {
        await this.saveToSupabase(opportunity);
      } catch (error) {
        // Fallback to localStorage if Supabase fails (e.g., no auth)
        console.warn('Supabase save failed, falling back to localStorage:', error);
        this.saveToLocalStorage(opportunity);
      }
    } else {
      this.saveToLocalStorage(opportunity);
    }
  }

  async getOpportunityById(id: string): Promise<SavedOpportunity | null> {
    const opportunities = await this.getOpportunities();
    return opportunities.find(op => op.id === id) || null;
  }

  async getOpportunities(): Promise<SavedOpportunity[]> {
    if (this.settings.useSupabase) {
      try {
        return await this.getFromSupabase();
      } catch (error) {
        // Fallback to localStorage if Supabase fails (e.g., no auth)
        console.warn('Supabase read failed, falling back to localStorage:', error);
        return this.getFromLocalStorage();
      }
    } else {
      return this.getFromLocalStorage();
    }
  }

  async deleteOpportunity(id: string): Promise<void> {
    if (this.settings.useSupabase) {
      try {
        await this.deleteFromSupabase(id);
      } catch (error) {
        // Fallback to localStorage if Supabase fails (e.g., no auth)
        console.warn('Supabase delete failed, falling back to localStorage:', error);
        this.deleteFromLocalStorage(id);
      }
    } else {
      this.deleteFromLocalStorage(id);
    }
  }

  // localStorage methods
  private saveToLocalStorage(opportunity: SavedOpportunity) {
    const opportunities: SavedOpportunity[] = safeParseLocalStorage('saved_opportunities', []);
    
    const existingIndex = opportunities.findIndex(op => op.id === opportunity.id);
    if (existingIndex >= 0) {
      opportunities[existingIndex] = opportunity;
    } else {
      opportunities.push(opportunity);
    }
    
    try {
      localStorage.setItem('saved_opportunities', safeStringify(opportunities));
    } catch (error) {
      console.error('Failed to save opportunity:', error);
      throw new Error('Unable to save opportunity. Storage may be full.');
    }
  }

  private getFromLocalStorage(): SavedOpportunity[] {
    return safeParseLocalStorage('saved_opportunities', []);
  }

  private deleteFromLocalStorage(id: string) {
    const opportunities: SavedOpportunity[] = safeParseLocalStorage('saved_opportunities', []);
    if (opportunities.length > 0) {
      const filtered = opportunities.filter(op => op.id !== id);
      try {
        localStorage.setItem('saved_opportunities', safeStringify(filtered));
      } catch (error) {
        console.error('Failed to delete opportunity:', error);
        throw new Error('Unable to delete opportunity. Storage may be full.');
      }
    }
  }

  // Supabase methods
  private async saveToSupabase(opportunity: SavedOpportunity): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User must be authenticated');

    const { error } = await supabase
      .from('opportunities')
      .upsert({
        id: opportunity.id,
        product_name: opportunity.productName,
        criteria: opportunity.criteria,
        final_score: opportunity.finalScore,
        created_at: opportunity.createdAt,
        status: opportunity.status,
        source: opportunity.source || 'manual',
        notes: opportunity.notes,
        image_url: opportunity.imageUrl,
        asin: opportunity.asin,
        user_id: user.id
      });

    if (error) throw error;
  }

  private async getFromSupabase(): Promise<SavedOpportunity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(op => ({
      id: op.id,
      productName: op.product_name,
      criteria: op.criteria as any[],
      finalScore: op.final_score,
      createdAt: op.created_at,
      status: op.status as SavedOpportunity['status'],
      source: op.source,
      notes: op.notes,
      imageUrl: op.image_url,
      asin: op.asin
    }));
  }

  private async deleteFromSupabase(id: string): Promise<void> {
    const { error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private async migrateToSupabase(): Promise<void> {
    const localOpportunities = this.getFromLocalStorage();
    
    for (const opportunity of localOpportunities) {
      try {
        await this.saveToSupabase(opportunity);
      } catch (error) {
        console.error('Failed to migrate opportunity:', opportunity.id, error);
      }
    }
  }

  getStorageSettings(): StorageSettings {
    return this.settings;
  }
}

export const opportunityStorage = new OpportunityStorage();