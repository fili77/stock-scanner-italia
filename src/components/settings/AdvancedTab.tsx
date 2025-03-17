
import React from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Shield, CloudOff, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const AdvancedTab = ({ showToast, resetApp }) => {
  return (
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
  );
};
