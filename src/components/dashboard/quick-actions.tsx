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
        <h2 className="text-lg font-semibold mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {actions.map((action, index) => (
            <m.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link href={action.href}>
                <Card className="p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={`text-${action.color}-500`}>{action.icon}</div>
                    <h3 className="font-medium">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {action.description}
                    </p>
                    <Button
                      variant={getButtonVariant(action.color)}
                      size="sm"
                      className="mt-2"
                    >
                      Get Started
                    </Button>
                  </div>
                </Card>
              </Link>
            </m.div>
          ))}
        </div>
      </Card>
    </m.div>
  );
}
