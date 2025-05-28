import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
}

function ActionCard({ title, description, icon, href, variant = "default" }: ActionCardProps) {
  return (
    <motion.div variants={fadeInUp}>
      <Link href={href} className="block h-full">
        <Card className="h-full transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">
              {icon}
            </div>
            <CardTitle className="mb-2 text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export function QuickActions() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <CardDescription>Common tasks to improve your SEO</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div 
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <ActionCard
            title="New Project"
            description="Add a website to track"
            icon={<Plus className="h-6 w-6" />}
            href="/dashboard/projects/new"
          />
          <ActionCard
            title="Analyze URL"
            description="Quick SEO analysis"
            icon={<Search className="h-6 w-6" />}
            href="/dashboard/analyses/new"
          />
          <ActionCard
            title="View Reports"
            description="SEO performance data"
            icon={<BarChart className="h-6 w-6" />}
            href="/dashboard/reports"
          />
          <ActionCard
            title="Export Data"
            description="Download as PDF/CSV"
            icon={<Download className="h-6 w-6" />}
            href="/dashboard/export"
          />
        </motion.div>
      </CardContent>
    </Card>
  );
}
