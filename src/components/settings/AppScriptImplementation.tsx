
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScriptCodeBlock } from './app-script/ScriptCodeBlock';
import { SheetStructure } from './app-script/SheetStructure';
import { DeploymentInstructions } from './app-script/DeploymentInstructions';
import { ImportantNotes } from './app-script/ImportantNotes';

export const AppScriptImplementation = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Apps Script Implementation</CardTitle>
        <CardDescription>
          Guide for implementing the API in Google Apps Script
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Paste this code in your Google Apps Script editor (Extensions &gt; Apps Script in your Google Sheet):
        </p>
        
        <ScriptCodeBlock />
        <SheetStructure />
        <DeploymentInstructions />
        <ImportantNotes />
      </CardContent>
    </Card>
  );
};
