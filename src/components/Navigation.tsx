import { useState } from "react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { QuickStartButton, useQuickTutorial, QuickTutorial } from "@/components/QuickTutorial";
import { lockApp } from "@/utils/appLock";
import { 
  Search, 
  BarChart3, 
  Menu,
  X,
  Upload,
  Database,
  Puzzle,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";

const navigationItems = [
  { name: "Score", href: "/", icon: BarChart3, tour: "nav-score" },
  { name: "Opportunities", href: "/opportunities", icon: Database, tour: "nav-opportunities" },
  { name: "Import", href: "/import", icon: Upload, tour: "nav-import" },
  { name: "Integrations", href: "/integrations", icon: Puzzle, tour: "nav-integrations" },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const Navigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isOpen, startTutorial, closeTutorial, completeTutorial } = useQuickTutorial();

  const handleLogout = () => {
    lockApp();
    window.location.href = '/lock';
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold leading-none">Amazon Research</span>
              <span className="text-sm text-muted-foreground leading-none">Playbook <span className="text-xs opacity-75">by IPS</span></span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="flex items-center space-x-1 rounded-lg bg-muted p-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    data-tour={item.tour}
                    className={cn(
                      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                      isActive
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
            
            {/* Quick Start Button */}
            <QuickStartButton onStart={startTutorial} />
            
            {/* Help Button */}
            <Link
              to="/help"
              className={cn(
                "inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                location.pathname === "/help" && "bg-accent text-accent-foreground"
              )}
              aria-label="Help"
              title="Help & Documentation"
            >
              <HelpCircle className="h-4 w-4" />
            </Link>

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              aria-label="Lock app"
              title="Lock App"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Navigation & Help */}
          <div className="flex items-center gap-2 lg:hidden">
            <QuickStartButton onStart={startTutorial} />
            
            <Link
              to="/help"
              className={cn(
                "inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-offset-2",
                location.pathname === "/help" && "bg-accent text-accent-foreground"
              )}
              aria-label="Help"
            >
              <HelpCircle className="h-4 w-4" />
            </Link>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="border-t py-4">
              <div className="grid gap-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      data-tour={item.tour}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
                
                {/* Mobile Help Link */}
                <Link
                  to="/help"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    location.pathname === "/help"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </Link>
                
                {/* Mobile Logout Button */}
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground w-full text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Lock App</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Tutorial */}
      <QuickTutorial 
        isOpen={isOpen}
        onClose={closeTutorial}
        onComplete={completeTutorial}
      />
    </nav>
  );
};