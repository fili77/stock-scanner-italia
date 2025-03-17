
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type NavItemProps = {
  to: string;
  label: string;
  exact?: boolean;
};

const NavItem = ({ to, label, exact = false }: NavItemProps) => {
  const location = useLocation();
  const isActive = exact ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <NavLink 
      to={to} 
      className={cn(
        "nav-link",
        isActive && "active"
      )}
    >
      {label}
    </NavLink>
  );
};

const Header = () => {
  const { toast } = useToast();

  const handleDownload = () => {
    // Create a simple text file with instructions
    const fileContent = `
PresenzaScan - Istruzioni di download

Per scaricare il codice completo di questo progetto:

1. Clicca sul nome del progetto (in alto a sinistra dell'interfaccia Lovable)
2. Nel menu che appare, clicca su "Share" o "Condividi"
3. Seleziona "Download as ZIP" o "Scarica come ZIP"

In alternativa:
- Se il progetto è collegato a GitHub, puoi clonare il repository
- Puoi anche utilizzare l'opzione "Dev Mode" per vedere ed esportare il codice

Grazie per aver utilizzato PresenzaScan!
    `;

    // Create a blob from the content
    const blob = new Blob([fileContent], { type: 'text/plain' });
    
    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presenzascan-download-guide.txt';
    
    // Trigger the download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Guida al download creata",
      description: "Ti abbiamo creato un file con le istruzioni per scaricare il progetto completo."
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80 border-b border-border animate-fade-in">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-1">
          <h1 className="text-lg font-semibold">
            PresenzaScan
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center space-x-1">
            <NavItem to="/" label="Home" exact />
            <NavItem to="/scan" label="Scansiona" />
            <NavItem to="/courses" label="Corsi" />
            <NavItem to="/settings" label="Impostazioni" />
          </nav>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center gap-1" 
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
