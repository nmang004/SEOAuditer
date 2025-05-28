"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BarChart, Search, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
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
            <span className="font-bold text-xl">Rival Outranker</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Log In</Button>
            </Link>
            <Link href="/auth/register">
              <Button>Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32">
          <div className="container relative z-10">
            <motion.div 
              className="mx-auto max-w-3xl text-center"
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.h1 
                className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl"
                variants={fadeInUp}
              >
                Outrank Your Competitors with
                <span className="bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent"> Advanced SEO Analytics</span>
              </motion.h1>
              <motion.p 
                className="mb-10 text-lg text-muted-foreground md:text-xl"
                variants={fadeInUp}
              >
                Analyze your website's SEO performance, identify critical issues, and get actionable recommendations to improve your search rankings.
              </motion.p>
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                variants={fadeInUp}
              >
                <Link href="/dashboard">
                  <Button size="lg" className="gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="#how-it-works">
                  <Button variant="outline" size="lg">
                    Learn More
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Background gradient */}
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-50),transparent_50%)]"></div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center mb-12">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Powerful SEO Tools</h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to analyze, track, and improve your search engine rankings.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-lg border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
                <div className="mb-4 rounded-full bg-primary-50 p-3 w-fit text-primary dark:bg-primary-900/20">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Comprehensive Analysis</h3>
                <p className="text-muted-foreground">
                  In-depth SEO audits covering technical issues, content quality, and backlink profiles.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
                <div className="mb-4 rounded-full bg-primary-50 p-3 w-fit text-primary dark:bg-primary-900/20">
                  <BarChart className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Competitor Insights</h3>
                <p className="text-muted-foreground">
                  Compare your performance against competitors and identify opportunities to outrank them.
                </p>
              </div>
              
              <div className="rounded-lg border bg-card p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:translate-y-[-2px]">
                <div className="mb-4 rounded-full bg-primary-50 p-3 w-fit text-primary dark:bg-primary-900/20">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Actionable Recommendations</h3>
                <p className="text-muted-foreground">
                  Get prioritized, easy-to-implement suggestions to improve your search rankings.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary-900 text-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to Outrank Your Competitors?</h2>
              <p className="mb-10 text-lg opacity-90">
                Join thousands of businesses that have improved their search rankings with Rival Outranker.
              </p>
              <Link href="/auth/register">
                <Button size="lg" variant="outline" className="bg-white text-primary-900 hover:bg-gray-100 border-white">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 text-primary"
              >
                <path d="m3 11 18-5v12L3 14v-3z"></path>
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
              </svg>
              <span className="font-semibold">Rival Outranker</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                Terms
              </Link>
              <Link href="#" className="hover:text-foreground">
                Privacy
              </Link>
              <Link href="#" className="hover:text-foreground">
                Contact
              </Link>
            </div>
            <div className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Rival Outranker. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
