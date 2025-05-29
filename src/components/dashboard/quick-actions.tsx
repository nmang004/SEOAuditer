"use client";

import React from "react";
import Link from "next/link";
import { m } from 'framer-motion';
import { 
  Plus, 
  Search, 
  BarChart, 
  FileText, 
  Download 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";

interface QuickAction {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "destructive";
}

interface QuickActionsProps {
  actions: QuickAction[];
}

export function QuickActions({ actions }: QuickActionsProps) {
  const getButtonVariant = (color: QuickAction["color"]) => {
    switch (color) {
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "destructive":
        return "destructive";
      default:
        return "default";
    }
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, index) => (
            <m.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={action.href} className="block h-full">
                <Card className="h-full p-6 flex flex-col items-center justify-between border-2 border-muted/30 hover:border-primary-500 transition-all">
                  <div className="flex flex-col items-center text-center gap-3 flex-1">
                    <div className={`text-${action.color}-500 mb-2`}>{React.cloneElement(action.icon as React.ReactElement, { className: 'h-8 w-8' })}</div>
                    <h3 className="text-2xl font-bold leading-tight">{action.title}</h3>
                    <p className="text-base text-muted-foreground mb-2">
                      {action.description}
                    </p>
                  </div>
                  <Button
                    variant={getButtonVariant(action.color)}
                    size="default"
                    className="w-full mt-4 text-base font-semibold py-2"
                  >
                    Get Started
                  </Button>
                </Card>
              </Link>
            </m.div>
          ))}
        </div>
      </Card>
    </m.div>
  );
}
