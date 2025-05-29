'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart3, Code, FileText, Globe, Link2, ListChecks, Monitor, Search } from 'lucide-react';
import Link from 'next/link';
import { fadeInUp } from '@/lib/animations';
import { Button } from '@/components/ui/button';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  category: string;
}

const features: Feature[] = [
  {
    icon: <Search className="h-6 w-6 text-indigo-500" />,
    title: 'Keyword Research',
    description: 'Discover high-value keywords with our advanced research tools and competitor analysis.',
    category: 'Research',
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
    title: 'Rank Tracking',
    description: 'Monitor your search engine rankings and track your progress over time.',
    category: 'Analytics',
  },
  {
    icon: <Code className="h-6 w-6 text-blue-500" />,
    title: 'Technical SEO',
    description: 'Identify and fix technical issues that could be affecting your search rankings.',
    category: 'Technical',
  },
  {
    icon: <Link2 className="h-6 w-6 text-green-500" />,
    title: 'Backlink Analysis',
    description: 'Analyze your backlink profile and discover new link-building opportunities.',
    category: 'Link Building',
  },
  {
    icon: <FileText className="h-6 w-6 text-amber-500" />,
    title: 'Content Optimization',
    description: 'Get AI-powered suggestions to optimize your content for better search visibility.',
    category: 'Content',
  },
  {
    icon: <Globe className="h-6 w-6 text-rose-500" />,
    title: 'Local SEO',
    description: 'Improve your local search presence and get found by customers in your area.',
    category: 'Local',
  },
  {
    icon: <Monitor className="h-6 w-6 text-cyan-500" />,
    title: 'Competitor Analysis',
    description: 'Analyze your competitors\' strategies and identify opportunities to outperform them.',
    category: 'Competitive',
  },
  {
    icon: <ListChecks className="h-6 w-6 text-emerald-500" />,
    title: 'Site Audit',
    description: 'Get a comprehensive audit of your website with actionable recommendations.',
    category: 'Technical',
  },
];

const categories = ['All', 'Research', 'Analytics', 'Technical', 'Content', 'Local', 'Competitive', 'Link Building'] as const;

export default function FeaturesPage() {
  const [activeCategory, setActiveCategory] = React.useState<string>('All');
  
  const filteredFeatures = React.useMemo(() => {
    return activeCategory === 'All' 
      ? features 
      : features.filter(feature => feature.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#1A202C] to-[#23293a]">
        <div className="container relative z-10 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white">
              Powerful Features for{' '}
              <span className="bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                SEO Success
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-200">
              Everything you need to analyze, optimize, and improve your website's search engine performance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-12">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-2"
          >
            {categories.map((category, index) => (
              <motion.button
                key={category}
                variants={fadeInUp}
                custom={index * 0.1}
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredFeatures.map((feature, index) => (
              <motion.div
                key={`${feature.title}-${index}`}
                variants={fadeInUp}
                custom={index * 0.1}
                whileHover={{ y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="group relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold">{feature.title}</h3>
                <p className="mt-2 text-muted-foreground">{feature.description}</p>
                <div className="absolute -right-8 -bottom-8 h-16 w-16 rounded-full bg-primary/5 transition-all duration-300 group-hover:scale-150" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-primary to-primary/90 py-16 text-primary-foreground">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to boost your SEO rankings?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg">
              Join thousands of businesses that trust Rival Outranker to improve their search engine rankings.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" className="group" asChild>
                <Link href="/auth/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent text-white hover:bg-white/10" asChild>
                <Link href="/demo">
                  Request Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}