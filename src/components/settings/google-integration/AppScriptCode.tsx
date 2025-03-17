
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CleanScriptCodeBlock } from '../app-script/CleanScriptCodeBlock';
import { SheetStructure } from '../app-script/SheetStructure';

export const AppScriptCode = () => {
  return (
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
  );
};
