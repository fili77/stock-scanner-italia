
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import googleSheetsAPI from '@/utils/googleSheetsAPI';
import { GoogleIntegrationTab } from '@/components/settings/GoogleIntegrationTab';
import { ScannerTab } from '@/components/settings/ScannerTab';
import { AppearanceTab } from '@/components/settings/AppearanceTab';
import { AdvancedTab } from '@/components/settings/AdvancedTab';

const SettingsPage = () => {
  const { toast } = useToast();
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [presenceValue, setPresenceValue] = useState('presente');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');
  const [autoCreate, setAutoCreate] = useState(true);
  
  const showToast = (message: string) => {
    toast({
      title: "Settings Updated",
      description: message,
    });
  };

  const resetApp = () => {
    if (confirm('Are you sure you want to reset all app data? This action cannot be undone.')) {
      // In a real app, you would clear local storage, reset app state, etc.
      localStorage.clear();
      toast({
        title: "App Reset",
        description: "All app data has been reset.",
      });
      setIsConnected(false);
      setAppsScriptUrl('');
    }
  };

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedAppsScriptUrl = localStorage.getItem('googleAppsScriptUrl');
    const isConnected = !!savedAppsScriptUrl;
    const savedPresenceValue = localStorage.getItem('presenceValue');
    const savedDateFormat = localStorage.getItem('dateFormat');
    const savedAutoCreate = localStorage.getItem('autoCreate');

    if (savedAppsScriptUrl) setAppsScriptUrl(savedAppsScriptUrl);
    if (savedPresenceValue) setPresenceValue(savedPresenceValue);
    if (savedDateFormat) setDateFormat(savedDateFormat);
    if (savedAutoCreate !== null) setAutoCreate(savedAutoCreate === 'true');
    setIsConnected(isConnected);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container max-w-3xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure app settings and integrations
          </p>
        </div>
        
        <Tabs defaultValue="google" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="google">Google Sheets</TabsTrigger>
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="google">
            <GoogleIntegrationTab 
              appsScriptUrl={appsScriptUrl}
              setAppsScriptUrl={setAppsScriptUrl}
              isConnected={isConnected}
              setIsConnected={setIsConnected}
              presenceValue={presenceValue}
              setPresenceValue={setPresenceValue}
              dateFormat={dateFormat}
              setDateFormat={setDateFormat}
              autoCreate={autoCreate}
              setAutoCreate={setAutoCreate}
            />
          </TabsContent>
          
          <TabsContent value="scanner">
            <ScannerTab showToast={showToast} />
          </TabsContent>
          
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
