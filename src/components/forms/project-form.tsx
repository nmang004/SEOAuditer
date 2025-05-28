import React from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { fadeInUp } from "@/lib/animations";

interface ProjectFormProps {
  onSubmit: (data: { name: string; url: string }) => void;
  isLoading?: boolean;
  defaultValues?: {
    name?: string;
    url?: string;
  };
}

export function ProjectForm({ onSubmit, isLoading = false, defaultValues = {} }: ProjectFormProps) {
  const [formData, setFormData] = React.useState({
    name: defaultValues.name || "",
    url: defaultValues.url || "",
  });
  
  const [errors, setErrors] = React.useState({
    name: "",
    url: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      url: "",
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
      isValid = false;
    }

    if (!formData.url.trim()) {
      newErrors.url = "Website URL is required";
      isValid = false;
    } else {
      // Basic URL validation
      let formattedUrl = formData.url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      try {
        new URL(formattedUrl);
      } catch (err) {
        newErrors.url = "Please enter a valid URL";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      // Format URL if needed
      let formattedUrl = formData.url.trim();
      if (!/^https?:\/\//i.test(formattedUrl)) {
        formattedUrl = `https://${formattedUrl}`;
      }
      
      onSubmit({
        name: formData.name.trim(),
        url: formattedUrl,
      });
    }
  };

  return (
    <motion.div 
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="w-full max-w-md mx-auto"
    >
      <Card>
        <CardHeader>
          <CardTitle>
            {defaultValues.name ? "Edit Project" : "Create New Project"}
          </CardTitle>
          <CardDescription>
            {defaultValues.name 
              ? "Update your project details" 
              : "Add a new website to track and analyze"
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Input
                name="name"
                label="Project Name"
                placeholder="My Website"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
            </div>
            <div className="space-y-1">
              <Input
                name="url"
                label="Website URL"
                placeholder="https://example.com"
                value={formData.url}
                onChange={handleChange}
                error={errors.url}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {defaultValues.name ? "Updating..." : "Creating..."}
                </>
              ) : (
                defaultValues.name ? "Update Project" : "Create Project"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
