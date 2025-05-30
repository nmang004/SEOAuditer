"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProjectEmptyState, AnalysisEmptyState, NoIssuesState, SearchEmptyState } from "@/components/empty-states";

export default function EmptyStatesDemo() {
  const [activeTab, setActiveTab] = useState("projects");
  const [searchQuery, setSearchQuery] = useState("example search");

  // Mock handlers
  const handleCreateProject = () => {
    console.log("Create project clicked");
  };

  const handleRunAnalysis = () => {
    console.log("Run analysis clicked");
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    console.log("Search cleared");
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Empty States</h1>
        <p className="text-muted-foreground mt-2">
          These empty states are shown when there's no content to display.
        </p>
      </div>

      <Tabs 
        defaultValue="projects" 
        className="space-y-4"
        onValueChange={setActiveTab}
        value={activeTab}
      >
        <TabsList>
          <TabsTrigger value="projects">No Projects</TabsTrigger>
          <TabsTrigger value="analyses">No Analyses</TabsTrigger>
          <TabsTrigger value="issues">No Issues</TabsTrigger>
          <TabsTrigger value="search">No Results</TabsTrigger>
        </TabsList>

        <Card className="min-h-[400px] flex items-center justify-center">
          <CardContent className="w-full max-w-md p-8">
            {activeTab === "projects" && (
              <ProjectEmptyState 
                onCreateProject={handleCreateProject} 
                className="w-full"
              />
            )}
            
            {activeTab === "analyses" && (
              <AnalysisEmptyState 
                onRunAnalysis={handleRunAnalysis} 
                className="w-full"
              />
            )}
            
            {activeTab === "issues" && (
              <NoIssuesState className="w-full" />
            )}
            
            {activeTab === "search" && (
              <SearchEmptyState 
                searchQuery={searchQuery}
                onClearSearch={handleClearSearch}
                className="w-full"
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => {
              // Cycle through tabs
              const tabs = ["projects", "analyses", "issues", "search"];
              const currentIndex = tabs.indexOf(activeTab);
              const nextIndex = (currentIndex + 1) % tabs.length;
              setActiveTab(tabs[nextIndex]);
            }}
          >
            View Next State
          </Button>
        </div>
      </Tabs>
    </div>
  );
}
