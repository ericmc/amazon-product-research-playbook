import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Database, HardDrive } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { opportunityStorage, StorageSettings } from "@/utils/OpportunityStorage";
import { useToast } from "@/hooks/use-toast";

const Settings = () => {
  const [settings, setSettings] = useState<StorageSettings>({ useSupabase: false });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(opportunityStorage.getStorageSettings());
  }, []);

  const handleStorageToggle = async (useSupabase: boolean) => {
    setIsLoading(true);
    try {
      await opportunityStorage.toggleStorage(useSupabase);
      setSettings({ useSupabase });
      
      toast({
        title: `Switched to ${useSupabase ? 'Supabase' : 'Local Storage'}`,
        description: useSupabase 
          ? "Your data will now be stored in the cloud and synced across devices."
          : "Your data will be stored locally in your browser.",
      });
    } catch (error) {
      console.error('Failed to toggle storage:', error);
      toast({
        title: "Storage Switch Failed",
        description: "Could not change storage method. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-2">Configure your application preferences</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Storage
              </CardTitle>
              <CardDescription>
                Choose how your opportunity data is stored and synchronized
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Use Supabase Cloud Storage</Label>
                  <p className="text-sm text-muted-foreground">
                    Store data in the cloud for sync across devices and backup
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {settings.useSupabase && <Badge variant="secondary">Cloud</Badge>}
                  {!settings.useSupabase && <Badge variant="outline">Local</Badge>}
                  <Switch
                    checked={settings.useSupabase}
                    onCheckedChange={handleStorageToggle}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  <HardDrive className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Local Storage</h4>
                    <p className="text-sm text-muted-foreground">
                      Fast, works offline, stored in browser
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-4 rounded-lg border bg-card">
                  <Database className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="font-medium">Supabase Cloud</h4>
                    <p className="text-sm text-muted-foreground">
                      Synced, backed up, accessible anywhere
                    </p>
                  </div>
                </div>
              </div>

              {!settings.useSupabase && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Local storage is limited to this browser. Your data won't sync across devices and may be lost if you clear browser data.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Database Schema (Future Supabase Tables)</CardTitle>
              <CardDescription>
                When you switch to Supabase, these tables will be created automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-muted font-mono text-sm">
                  <div className="font-bold mb-2">opportunities</div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>• id (uuid, primary key)</div>
                    <div>• user_id (uuid, foreign key)</div>
                    <div>• product_name (text)</div>
                    <div>• criteria (jsonb)</div>
                    <div>• final_score (integer)</div>
                    <div>• status (enum)</div>
                    <div>• source (text)</div>
                    <div>• notes (text, optional)</div>
                    <div>• created_at, updated_at (timestamps)</div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted font-mono text-sm">
                  <div className="font-bold mb-2">raw_imports</div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>• id (uuid, primary key)</div>
                    <div>• user_id (uuid, foreign key)</div>
                    <div>• opportunity_id (uuid, optional)</div>
                    <div>• source (text)</div>
                    <div>• raw_data (jsonb)</div>
                    <div>• field_mappings (jsonb)</div>
                    <div>• import_metadata (jsonb)</div>
                    <div>• created_at (timestamp)</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;