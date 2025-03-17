
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const IntroductionAlert = () => {
  return (
    <Alert>
      <AlertTitle>Google Sheets Apps Script Integration</AlertTitle>
      <AlertDescription>
        This app connects to your Google Sheet using Google Apps Script.
        Enter your Apps Script Web App URL below to connect your sheet.
      </AlertDescription>
    </Alert>
  );
};
