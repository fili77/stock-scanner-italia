
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, RotateCcw, Shield, CloudOff, Database, Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const SettingsPage = () => {
  const { toast } = useToast();
  const [sheetId, setSheetId] = useState('');
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
      toast({
        title: "App Reset",
        description: "All app data has been reset.",
      });
    }
  };

  const connectToGoogleSheets = () => {
    if (!sheetId) {
      toast({
        title: "Error",
        description: "Please enter a valid Google Sheet ID",
        variant: "destructive"
      });
      return;
    }

    // In a real implementation, this is where you would initiate the OAuth flow
    // For now, we'll simulate a successful connection
    setIsConnected(true);
    localStorage.setItem('googleSheetId', sheetId);
    localStorage.setItem('googleSheetConnected', 'true');

    toast({
      title: "Connected",
      description: "Successfully connected to Google Sheets. You can now use the app to record attendance."
    });
  };

  const disconnectFromGoogleSheets = () => {
    setIsConnected(false);
    localStorage.removeItem('googleSheetId');
    localStorage.removeItem('googleSheetConnected');

    toast({
      title: "Disconnected",
      description: "Disconnected from Google Sheets."
    });
  };

  const saveSheetSettings = () => {
    localStorage.setItem('presenceValue', presenceValue);
    localStorage.setItem('dateFormat', dateFormat);
    localStorage.setItem('autoCreate', autoCreate.toString());

    showToast("Sheet settings updated");
  };

  // Load settings from localStorage on component mount
  React.useEffect(() => {
    const savedSheetId = localStorage.getItem('googleSheetId');
    const isConnected = localStorage.getItem('googleSheetConnected') === 'true';
    const savedPresenceValue = localStorage.getItem('presenceValue');
    const savedDateFormat = localStorage.getItem('dateFormat');
    const savedAutoCreate = localStorage.getItem('autoCreate');

    if (savedSheetId) setSheetId(savedSheetId);
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Alert>
                <AlertTitle>Google Sheets Direct Connection</AlertTitle>
                <AlertDescription>
                  This app uses a direct connection to your Google Sheet without the need for a custom API.
                  Simply enter your Google Sheet ID below and authorize access.
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
                    <Label htmlFor="sheet-id">Sheet ID</Label>
                    <div className="flex gap-2">
                      <Input 
                        id="sheet-id" 
                        placeholder="Enter your Google Sheet ID" 
                        value={sheetId}
                        onChange={(e) => setSheetId(e.target.value)}
                      />
                      <Button variant="outline" size="icon" onClick={() => navigator.clipboard.writeText(sheetId)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Find your Sheet ID in the URL: https://docs.google.com/spreadsheets/d/<span className="font-mono">YOUR_SHEET_ID</span>/edit
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
                            Your app is currently connected to a Google Sheet
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
                            Enter your Sheet ID and click Connect to authorize access
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
                  <CardTitle>Sheet Settings</CardTitle>
                  <CardDescription>
                    Configure how attendance is recorded in your Google Sheet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="presence-value">Presence Value</Label>
                    <Input 
                      id="presence-value" 
                      value={presenceValue}
                      onChange={(e) => setPresenceValue(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Text to insert when marking a student as present
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date-format">Date Format</Label>
                    <Input 
                      id="date-format" 
                      value={dateFormat}
                      onChange={(e) => setDateFormat(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Format for dates in column headers
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-create">Auto-Create Columns</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically create new date columns as needed
                      </p>
                    </div>
                    <Switch 
                      id="auto-create" 
                      checked={autoCreate}
                      onCheckedChange={setAutoCreate}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={saveSheetSettings} className="ml-auto">Save Changes</Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Foglio Google Sheets Structure</CardTitle>
                  <CardDescription>
                    Recommended structure for your Google Sheet
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Foglio "Corsi"</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-xs">
                        ID Corso | Nome Corso | Docente | Totale Studenti
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Foglio "Studenti"</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-xs">
                        ID Studente | Nome | Cognome | Corsi (separati da virgola)
                      </code>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium">Foglio "Presenze"</h3>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-xs">
                        ID Studente | ID Corso | Data | Presente
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="scanner">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Scanner Settings</CardTitle>
                  <CardDescription>
                    Configure barcode scanning behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="continuous-scan">Continuous Scanning</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically prepare for the next scan after each successful scan
                      </p>
                    </div>
                    <Switch id="continuous-scan" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="play-sound">Play Sound</Label>
                      <p className="text-xs text-muted-foreground">
                        Play a sound when a barcode is successfully scanned
                      </p>
                    </div>
                    <Switch id="play-sound" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="front-camera">Use Front Camera</Label>
                      <p className="text-xs text-muted-foreground">
                        Use the front-facing camera instead of the rear camera
                      </p>
                    </div>
                    <Switch id="front-camera" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => showToast("Scanner settings updated")} className="ml-auto">Save Changes</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="appearance">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel of the application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Use dark theme for the interface
                      </p>
                    </div>
                    <Switch id="dark-mode" />
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="block mb-2">Color Accent</Label>
                    <div className="flex gap-2">
                      {["#3498db", "#2ecc71", "#e74c3c", "#f39c12", "#9b59b6"].map((color) => (
                        <button
                          key={color}
                          className="w-8 h-8 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                          style={{ backgroundColor: color }}
                          aria-label={`Select ${color} as accent color`}
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => showToast("Appearance settings updated")} className="ml-auto">Save Changes</Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="advanced">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Offline Mode</CardTitle>
                  <CardDescription>
                    Configure how the app behaves when offline
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="offline-mode">Enable Offline Mode</Label>
                      <p className="text-xs text-muted-foreground">
                        Allow attendance to be recorded when offline
                      </p>
                    </div>
                    <Switch id="offline-mode" defaultChecked />
                  </div>
                  
                  <div className="rounded-md bg-muted p-4 flex gap-3">
                    <CloudOff className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      When offline, attendance records will be stored locally and synced when connection is restored
                    </p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Manage application data and storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-md bg-muted p-4 flex gap-3">
                    <Database className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Local Storage</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Currently using approximately 1.2 MB of local storage
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="save-history">Save Scan History</Label>
                      <p className="text-xs text-muted-foreground">
                        Save a history of all scanned barcodes
                      </p>
                    </div>
                    <Switch id="save-history" defaultChecked />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" className="border-destructive text-destructive" onClick={resetApp}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset App
                  </Button>
                  <Button variant="outline">
                    <Shield className="mr-2 h-4 w-4" />
                    Export Data
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default SettingsPage;
