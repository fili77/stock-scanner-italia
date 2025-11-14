
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { AppearanceTab } from '@/components/settings/AppearanceTab';
import { AdvancedTab } from '@/components/settings/AdvancedTab';

const SettingsPage = () => {
  const { toast } = useToast();

  const showToast = (message: string) => {
    toast({
      title: "Impostazioni Aggiornate",
      description: message,
    });
  };

  const resetApp = () => {
    if (confirm('Sei sicuro di voler resettare tutti i dati dell\'app? Questa azione non può essere annullata.')) {
      localStorage.clear();
      toast({
        title: "App Resettata",
        description: "Tutti i dati dell'app sono stati resettati.",
      });
      // Reload page to reflect changes
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 container max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Impostazioni</h1>
          <p className="text-muted-foreground">
            Configura l'applicazione di trading
          </p>
        </div>

        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="appearance">Aspetto</TabsTrigger>
            <TabsTrigger value="advanced">Avanzate</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance">
            <AppearanceTab showToast={showToast} />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedTab showToast={showToast} resetApp={resetApp} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SettingsPage;
