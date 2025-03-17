
import React from 'react';

export const ImportantNotes = () => {
  return (
    <div className="rounded-md bg-yellow-50 p-4 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300">
      <p className="text-sm font-medium">Importante:</p>
      <p className="text-xs mt-1">
        Lo script mostrato sopra deve essere copiato e incollato nell'editor di Apps Script del tuo foglio Google.
      </p>
      <p className="text-xs mt-2">
        Per aprire l'editor: nel tuo foglio Google vai su "Extensions" &gt; "Apps Script" e incolla il codice completo.
      </p>
      <p className="text-xs mt-2">
        Questo script aggiunge automaticamente gli header CORS necessari per la comunicazione con l'app.
      </p>
      <p className="text-xs mt-2">
        Se l'app non riesce a comunicare con il foglio, verifica i log dello script in Apps Script
        (View &gt; Logs) per capire cosa non funziona.
      </p>
    </div>
  );
};
