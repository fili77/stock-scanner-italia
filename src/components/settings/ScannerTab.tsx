
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export const ScannerTab = ({ showToast }) => {
  return (
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
  );
};
