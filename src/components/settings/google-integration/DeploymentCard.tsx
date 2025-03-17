
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeploymentInstructions } from '../app-script/DeploymentInstructions';

export const DeploymentCard = () => {
  return (
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
  );
};
