
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';

export const SheetSettings = ({
  presenceValue,
  setPresenceValue,
  dateFormat,
  setDateFormat,
  autoCreate,
  setAutoCreate,
  onSave
}) => {
  return (
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
        <Button onClick={onSave} className="ml-auto">Save Changes</Button>
      </CardFooter>
    </Card>
  );
};
