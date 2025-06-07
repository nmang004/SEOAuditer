import React from "react";
import { m } from 'framer-motion';
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/animations";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

export function UrlInput({ onSubmit, isLoading = false, placeholder = "Enter website URL..." }: UrlInputProps) {
  const [url, setUrl] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }
    
    // Check if URL has a valid format
    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    try {
      new URL(formattedUrl);
      setError("");
      onSubmit(formattedUrl);
    } catch (err) {
      setError("Please enter a valid URL");
    }
  };

  return (
    <m.div 
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full"
    >
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError("");
              }}
              placeholder={placeholder}
              className="pl-9"
              error={error}
            />
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </Button>
        </div>
      </form>
    </m.div>
  );
}
