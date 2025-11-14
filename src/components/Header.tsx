
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { TrendingUp } from 'lucide-react';

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
        "px-3 py-2 text-sm font-medium rounded-md transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      {label}
    </NavLink>
  );
};

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80 border-b border-border animate-fade-in">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Stock Scanner Italia
          </h1>
        </div>
        <nav className="flex items-center space-x-1">
          <NavItem to="/" label="Home" exact />
          <NavItem to="/stock-prediction" label="Analisi" />
          <NavItem to="/opportunity-scanner" label="Scanner" />
          <NavItem to="/backtesting" label="Backtest" />
          <NavItem to="/settings" label="Settings" />
        </nav>
      </div>
    </header>
  );
};

export default Header;
