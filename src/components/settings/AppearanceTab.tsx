
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

export const AppearanceTab = ({ showToast }) => {
  return (
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
  );
};
