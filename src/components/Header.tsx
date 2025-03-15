
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

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
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-sm bg-background/80 border-b border-border animate-fade-in">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-1">
          <h1 className="text-lg font-semibold">
            ScanAttendance
          </h1>
        </div>
        <nav className="flex items-center space-x-1">
          <NavItem to="/" label="Home" exact />
          <NavItem to="/scan" label="Scan" />
          <NavItem to="/courses" label="Courses" />
          <NavItem to="/settings" label="Settings" />
        </nav>
      </div>
    </header>
  );
};

export default Header;
