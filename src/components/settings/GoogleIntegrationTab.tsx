import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import googleSheetsAPI from '@/utils/googleSheetsAPI';
import { CleanScriptCodeBlock } from './app-script/CleanScriptCodeBlock';
import { DeploymentInstructions } from './app-script/DeploymentInstructions';
import { SheetSettings } from './SheetSettings';
import { SheetStructure } from './app-script/SheetStructure';

export const GoogleIntegrationTab = ({
  appsScriptUrl,
  setAppsScriptUrl,
  isConnected,
  setIsConnected,
  presenceValue,
  setPresenceValue,
  dateFormat,
  setDateFormat,
  autoCreate,
  setAutoCreate
}) => {
  const { toast } = useToast();
  const [showFullScript, setShowFullScript] = useState(false);

  const connectToGoogleSheets = () => {
    if (!appsScriptUrl) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Apps Script URL",
        variant: "destructive"
      });
      return;
    }

    // Set the Apps Script URL in the API
    googleSheetsAPI.setAppsScriptUrl(appsScriptUrl);
    setIsConnected(true);

    toast({
      title: "Connected",
      description: "Successfully connected to Google Sheets via Apps Script. You can now use the app to record attendance."
    });
  };

  const disconnectFromGoogleSheets = () => {
    googleSheetsAPI.setAppsScriptUrl('');
    setIsConnected(false);
    setAppsScriptUrl('');

    toast({
      title: "Disconnected",
      description: "Disconnected from Google Sheets."
    });
  };

  const saveSheetSettings = () => {
    localStorage.setItem('presenceValue', presenceValue);
    localStorage.setItem('dateFormat', dateFormat);
    localStorage.setItem('autoCreate', autoCreate.toString());

    toast({
      title: "Settings Updated",
      description: "Sheet settings updated",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Alert>
        <AlertTitle>Google Sheets Apps Script Integration</AlertTitle>
        <AlertDescription>
          This app connects to your Google Sheet using Google Apps Script.
          Enter your Apps Script Web App URL below to connect your sheet.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Google Sheets Integration</CardTitle>
          <CardDescription>
            Connect to your Google Sheets document to track attendance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apps-script-url">Apps Script Web App URL</Label>
            <div className="flex gap-2">
              <Input 
                id="apps-script-url" 
                placeholder="Enter your Google Apps Script URL" 
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
              />
              <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(appsScriptUrl)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Example: https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
            </p>
          </div>
          
          {isConnected ? (
            <div className="rounded-md bg-primary/10 p-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Connected</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your app is currently connected to a Google Sheet via Apps Script
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-md bg-muted p-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center flex-shrink-0">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-medium">Not Connected</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter your Apps Script URL and click Connect to authorize access
                  </p>
                </div>
              </div>
            </div>
          )}

          <a 
            href="https://docs.google.com/spreadsheets/create" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-primary flex items-center hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 mr-1" />
            Create a new Google Sheet
          </a>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isConnected ? (
            <Button variant="outline" onClick={disconnectFromGoogleSheets}>Disconnect</Button>
          ) : (
            <Button variant="outline" disabled>Disconnect</Button>
          )}
          {isConnected ? (
            <Button disabled>Already Connected</Button>
          ) : (
            <Button onClick={connectToGoogleSheets}>Connect</Button>
          )}
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Apps Script Code</CardTitle>
          <CardDescription>
            Copia questo script nell'editor di Google Apps Script
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-3 rounded-md">
            <p className="text-sm font-medium mb-2">Istruzioni:</p>
            <ol className="list-decimal list-inside text-xs mt-2 ml-2 space-y-1">
              <li>Nel tuo foglio Google, vai su "Extensions" &gt; "Apps Script"</li>
              <li>Nell'editor di Apps Script, seleziona tutto il codice esistente e cancellalo</li>
              <li>Usa il pulsante "Copia Script" sotto</li>
              <li>Incolla il codice nell'editor di Apps Script</li>
              <li>Salva il file (Ctrl+S o Cmd+S)</li>
              <li>Pubblica come app web seguendo le istruzioni sotto</li>
            </ol>
          </div>
          
          <CleanScriptCodeBlock />
          
          <SheetStructure />
        </CardContent>
      </Card>
      
      <SheetSettings
        presenceValue={presenceValue}
        setPresenceValue={setPresenceValue}
        dateFormat={dateFormat}
        setDateFormat={setDateFormat}
        autoCreate={autoCreate}
        setAutoCreate={setAutoCreate}
        onSave={saveSheetSettings}
      />

      <Card>
        <CardHeader>
          <CardTitle>Istruzioni per la Pubblicazione</CardTitle>
          <CardDescription>
            Dopo aver copiato lo script, pubblica come app web
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DeploymentInstructions />
        </CardContent>
      </Card>
    </motion.div>
  );
};
