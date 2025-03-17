
import React from 'react';

export const SheetStructure = () => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Struttura del foglio consigliata:</h3>
      <div className="bg-muted p-3 rounded-md">
        <h4 className="text-xs font-medium mb-1">Foglio "Studenti":</h4>
        <code className="text-xs">
          ID Studente | Nome | Cognome | Corsi (separati da virgola)
        </code>
      </div>
      <div className="bg-muted p-3 rounded-md">
        <h4 className="text-xs font-medium mb-1">Foglio "Corsi":</h4>
        <code className="text-xs">
          ID Corso | Nome Corso | Docente | Totale Studenti
        </code>
      </div>
      <div className="bg-muted p-3 rounded-md">
        <h4 className="text-xs font-medium mb-1">Foglio "Presenze":</h4>
        <code className="text-xs">
          ID Studente | ID Corso | Data | Presente
        </code>
      </div>
    </div>
  );
};
