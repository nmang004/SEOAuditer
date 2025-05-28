import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Sun, Moon, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, MobileNavigation, Breadcrumb } from "@/components/navigation";

interface HeaderProps {
  onToggleSidebar: () => void;
  showBreadcrumb?: boolean;
}

export function Header({ onToggleSidebar, showBreadcrumb = true }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Hydration fix
  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, we'd toggle the dark mode class on the document
    document.documentElement.classList.toggle('dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col">
        {/* Top Bar */}
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center md:hidden">
            <MobileNavigation />
          </div>

          <div className="hidden md:flex items-center">
            <Link href="/" className="flex items-center">
              <motion.div
                className="mr-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary"
                >
                  <path d="m3 11 18-5v12L3 14v-3z"></path>
                  <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
                </svg>
              </motion.div>
              <span className="font-bold text-xl">Rival Outranker</span>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-center px-2 md:px-4">
            <div className="w-full max-w-2xl">
              <Search />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-danger-500"></span>
              <span className="sr-only">Notifications</span>
            </Button>

            {mounted && (
              <Button variant="ghost" size="icon" onClick={toggleTheme}>
                {isDarkMode ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-border"
            >
              <span className="sr-only">User profile</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-medium">
                JD
              </span>
            </Button>
          </div>
        </div>

        {/* Breadcrumb */}
        {showBreadcrumb && (
          <div className="border-t px-4 py-2 bg-muted/10">
            <div className="max-w-7xl mx-auto">
              <Breadcrumb />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
