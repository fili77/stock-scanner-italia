
import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Shield, Database, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const AdvancedTab = ({ showToast, resetApp }) => {
  const handleExportData = () => {
    const data = {
      preferences: localStorage.getItem('theme'),
      timestamp: new Date().toISOString(),
      app: 'Stock Scanner Italia'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stock-scanner-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Impostazioni esportate con successo');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Caching Dati</CardTitle>
          <CardDescription>
            Configura la memorizzazione dei dati di mercato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="cache-mode">Abilita Cache Dati</Label>
              <p className="text-xs text-muted-foreground">
                Memorizza localmente i dati storici per velocizzare le analisi
              </p>
            </div>
            <Switch id="cache-mode" defaultChecked />
          </div>

          <div className="rounded-md bg-muted p-4 flex gap-3">
            <Database className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              I dati di mercato vengono memorizzati localmente per ridurre il caricamento e le chiamate API
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Gestione Dati</CardTitle>
          <CardDescription>
            Gestisci i dati e le impostazioni dell'applicazione
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-muted p-4 flex gap-3">
            <Database className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Storage Locale</p>
              <p className="text-xs text-muted-foreground mt-1">
                Utilizzo approssimativo dello storage locale
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="save-history">Salva Storico Analisi</Label>
              <p className="text-xs text-muted-foreground">
                Mantieni uno storico delle analisi e scansioni effettuate
              </p>
            </div>
            <Switch id="save-history" defaultChecked />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={resetApp}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset App
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Esporta Impostazioni
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
