
import React from 'react';

export const DeploymentInstructions = () => {
  return (
    <div className="rounded-md bg-blue-50 p-4 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
      <p className="text-sm">
        Dopo aver creato lo script, pubblica come app web:
      </p>
      <ol className="list-decimal list-inside text-xs mt-2 ml-2 space-y-1">
        <li>Clicca "Deploy" &gt; "New deployment"</li>
        <li>Seleziona "Web app"</li>
        <li>Configura "Execute as: Me" e "Who has access: Anyone"</li>
        <li>Clicca "Deploy" e autorizza le richieste</li>
        <li>Copia l'URL generato e incollalo sopra</li>
      </ol>
    </div>
  );
};
