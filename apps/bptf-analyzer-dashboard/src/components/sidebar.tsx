"use client";

import { useState, useEffect } from "react";
import { Menu, X, Home, TrendingUp, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

// Sidebar menu items
const menuItems = [
  { name: "Home", icon: Home, href: "/" },
  { name: "Trending", icon: TrendingUp, href: "/trending" },
  { name: "Stats", icon: BarChart3, href: "/stats" },
  { name: "Settings", icon: Settings, href: "/settings" },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close sidebar when window is resized to larger size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const toggleButton = document.getElementById('sidebar-toggle');
      
      if (isOpen && 
          sidebar && 
          !sidebar.contains(event.target as Node) && 
          toggleButton && 
          !toggleButton.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <>
      {/* Mobile toggle button */}
      <Button
        id="sidebar-toggle"
        variant="ghost"
        size="icon"
        className="md:hidden fixed top-4 left-4 z-30"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </Button>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar for mobile (slide in) */}
      <div
        id="mobile-sidebar"
        className={cn(
          "fixed top-0 left-0 h-full z-30 bg-background border-r transition-transform w-64 shadow-lg md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">BPTF Analyzer</h1>
            <ThemeToggle />
          </div>
          <nav className="mt-8">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href} 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-foreground"
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Desktop sidebar (always visible) */}
      <div className="hidden md:block w-full h-full bg-background border-r">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">BPTF Analyzer</h1>
            <ThemeToggle />
          </div>
          <nav className="mt-8">
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <a 
                    href={item.href} 
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent text-foreground"
                  >
                    <item.icon size={18} />
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
}
