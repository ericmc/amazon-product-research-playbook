import { supabase } from "@/integrations/supabase/client";

export interface SavedOpportunity {
  id: string;
  productName: string;
  criteria: any[];
  finalScore: number;
  createdAt: string;
  status: 'draft' | 'scored' | 'analyzing' | 'sourcing' | 'archived';
  source?: string;
  notes?: string;
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
    const stored = localStorage.getItem('app_settings');
    return stored ? JSON.parse(stored) : { useSupabase: false };
  }

  private saveSettings(settings: StorageSettings) {
    this.settings = settings;
    localStorage.setItem('app_settings', JSON.stringify(settings));
  }

  async toggleStorage(useSupabase: boolean) {
    this.saveSettings({ useSupabase });
    
    if (useSupabase) {
      // Migrate existing localStorage data to Supabase
      await this.migrateToSupabase();
    }
  }

  async saveOpportunity(opportunity: SavedOpportunity): Promise<void> {
    if (this.settings.useSupabase) {
      await this.saveToSupabase(opportunity);
    } else {
      this.saveToLocalStorage(opportunity);
    }
  }

  async getOpportunities(): Promise<SavedOpportunity[]> {
    if (this.settings.useSupabase) {
      return await this.getFromSupabase();
    } else {
      return this.getFromLocalStorage();
    }
  }

  async deleteOpportunity(id: string): Promise<void> {
    if (this.settings.useSupabase) {
      await this.deleteFromSupabase(id);
    } else {
      this.deleteFromLocalStorage(id);
    }
  }

  // localStorage methods
  private saveToLocalStorage(opportunity: SavedOpportunity) {
    const stored = localStorage.getItem('saved_opportunities');
    const opportunities: SavedOpportunity[] = stored ? JSON.parse(stored) : [];
    
    const existingIndex = opportunities.findIndex(op => op.id === opportunity.id);
    if (existingIndex >= 0) {
      opportunities[existingIndex] = opportunity;
    } else {
      opportunities.push(opportunity);
    }
    
    localStorage.setItem('saved_opportunities', JSON.stringify(opportunities));
  }

  private getFromLocalStorage(): SavedOpportunity[] {
    const stored = localStorage.getItem('saved_opportunities');
    return stored ? JSON.parse(stored) : [];
  }

  private deleteFromLocalStorage(id: string) {
    const stored = localStorage.getItem('saved_opportunities');
    if (stored) {
      const opportunities: SavedOpportunity[] = JSON.parse(stored);
      const filtered = opportunities.filter(op => op.id !== id);
      localStorage.setItem('saved_opportunities', JSON.stringify(filtered));
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
        user_id: user.id
      });

    if (error) throw error;
  }

  private async getFromSupabase(): Promise<SavedOpportunity[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

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
      notes: op.notes
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