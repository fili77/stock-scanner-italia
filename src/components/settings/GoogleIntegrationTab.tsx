
import React from 'react';
import { motion } from 'framer-motion';
import { SheetSettings } from './SheetSettings';
import { IntroductionAlert } from './google-integration/IntroductionAlert';
import { ConnectionCard } from './google-integration/ConnectionCard';
import { AppScriptCode } from './google-integration/AppScriptCode';
import { DeploymentCard } from './google-integration/DeploymentCard';

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
  const saveSheetSettings = () => {
    localStorage.setItem('presenceValue', presenceValue);
    localStorage.setItem('dateFormat', dateFormat);
    localStorage.setItem('autoCreate', autoCreate.toString());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <IntroductionAlert />
      
      <ConnectionCard 
        appsScriptUrl={appsScriptUrl}
        setAppsScriptUrl={setAppsScriptUrl}
        isConnected={isConnected}
        setIsConnected={setIsConnected}
      />
      
      <AppScriptCode />
      
      <SheetSettings
        presenceValue={presenceValue}
        setPresenceValue={setPresenceValue}
        dateFormat={dateFormat}
        setDateFormat={setDateFormat}
        autoCreate={autoCreate}
        setAutoCreate={setAutoCreate}
        onSave={saveSheetSettings}
      />

      <DeploymentCard />
    </motion.div>
  );
};
