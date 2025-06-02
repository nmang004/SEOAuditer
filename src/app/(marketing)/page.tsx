'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  BarChart3, 
  Code, 
  FileText, 
  Link2, 
  Search, 
  Shield, 
  Zap, 
  Play,
  BarChart4,
  CheckCircle,
  Target,
  Users,
  TrendingUp,
  Star,
  ChevronRight,
  Globe,
  Sparkles,
  Clock,
  Award
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

// Features data
const features = [
  {
    icon: <Search className="h-6 w-6 text-indigo-400" />,
    title: 'Comprehensive SEO Analysis',
    description: 'Get detailed insights into your website\'s performance with our advanced SEO analysis tools.',
    color: 'from-indigo-500/20 to-indigo-600/20',
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-purple-400" />,
    title: 'Competitor Benchmarking',
    description: 'Compare your performance against competitors and identify growth opportunities.',
    color: 'from-purple-500/20 to-purple-600/20',
  },
  {
    icon: <Code className="h-6 w-6 text-blue-400" />,
    title: 'Technical SEO Audit',
    description: 'Find and fix technical issues that might be affecting your search rankings.',
    color: 'from-blue-500/20 to-blue-600/20',
  },
  {
    icon: <Link2 className="h-6 w-6 text-green-400" />,
    title: 'Backlink Analysis',
    description: 'Analyze your backlink profile and discover new link-building opportunities.',
    color: 'from-green-500/20 to-green-600/20',
  },
  {
    icon: <FileText className="h-6 w-6 text-amber-400" />,
    title: 'Content Optimization',
    description: 'Improve your content strategy with data-driven recommendations.',
    color: 'from-amber-500/20 to-amber-600/20',
  },
  {
    icon: <Shield className="h-6 w-6 text-rose-400" />,
    title: 'Security & Performance',
    description: 'Ensure your site is secure, fast, and optimized for search engines.',
    color: 'from-rose-500/20 to-rose-600/20',
  },
];

// Stats data
const stats = [
  { value: '10K+', label: 'Active Users', icon: <Users className="h-5 w-5 text-indigo-400" /> },
  { value: '95%', label: 'Success Rate', icon: <TrendingUp className="h-5 w-5 text-green-400" /> },
  { value: '24/7', label: 'Support', icon: <Clock className="h-5 w-5 text-purple-400" /> },
  { value: '50+', label: 'Features', icon: <Sparkles className="h-5 w-5 text-amber-400" /> },
];

// Testimonials data
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    content: 'SEO Director has transformed our SEO strategy. Our organic traffic has increased by 150% in just 3 months!',
    rating: 5,
    avatar: 'SJ'
  },
  {
    name: 'Michael Chen',
    role: 'E-commerce Manager',
    content: 'The competitor analysis tools are incredible. We\'ve been able to outrank our biggest competitors consistently.',
    rating: 5,
    avatar: 'MC'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Content Strategist',
    content: 'The content optimization suggestions have been game-changing for our blog. Our engagement rates are through the roof!',
    rating: 5,
    avatar: 'ER'
  }
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1A202C] to-[#0F172A]">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -right-[20%] -top-[20%] h-[60%] w-[60%] rounded-full bg-gradient-to-r from-indigo-500/30 to-purple-500/30 blur-3xl" />
          <div className="absolute -left-[20%] -bottom-[20%] h-[60%] w-[60%] rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30 blur-3xl" />
        </div>
        
        <div className="container relative z-10 py-24 md:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-400 mb-6"
            >
              <Zap className="mr-2 h-4 w-4" />
              The most advanced SEO platform
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white"
            >
              Dominate Search Rankings with{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI-Powered SEO
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-300"
            >
              Get actionable insights to improve your search rankings, analyze competitors, and grow your organic traffic with our powerful SEO platform.
            </motion.p>
            
            <motion.div 
              variants={fadeInUp}
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Button 
                size="lg" 
                className="group h-14 text-base px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-0" 
                asChild
              >
                <Link href="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 text-base px-8 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white bg-transparent" 
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div 
              variants={fadeInUp}
              className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4"
            >
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-24"
          >
            <div className="relative mx-auto max-w-6xl">
              <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-gray-700 bg-gray-900/90 backdrop-blur-sm p-1 shadow-2xl">
                <div className="flex h-8 items-center border-b border-gray-700 px-4">
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="ml-4 text-xs text-gray-500">rival-outranker.com/dashboard</div>
                </div>
                <div className="flex h-96 items-center justify-center p-8 bg-gray-900 rounded-b-xl">
                  <div className="text-center">
                    <BarChart4 className="mx-auto h-16 w-16 text-indigo-400/50" />
                    <p className="mt-4 text-sm text-gray-400">Your SEO dashboard preview</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-[#1A202C]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-sm font-medium text-indigo-400 mb-4">
                Features
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  dominate SEO
                </span>
              </h2>
              <p className="text-lg text-gray-300">
                Powerful tools and insights to help you improve your search rankings and grow your online presence.
              </p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  custom={index}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="group relative overflow-hidden rounded-2xl bg-gray-800/50 backdrop-blur-sm p-6 transition-all hover:bg-gray-800/70 border border-gray-700 hover:border-gray-600"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="relative z-10">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700/50 backdrop-blur-sm">
                      {feature.icon}
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-[#0F172A]">
        <div className="container">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mx-auto max-w-3xl text-center mb-16">
              <span className="inline-block rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 text-sm font-medium text-purple-400 mb-4">
                Testimonials
              </span>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
                Trusted by{' '}
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  marketing teams
                </span>{' '}
                worldwide
              </h2>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  custom={index}
                  className="bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700"
                >
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} 
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-6">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium">
                      {testimonial.avatar}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-white">{testimonial.name}</p>
                      <p className="text-sm text-gray-400">{testimonial.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-700">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-4xl text-center"
          >
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6">
              Ready to transform your SEO strategy?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands of businesses that trust Rival Outranker for their SEO success.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="bg-white text-indigo-700 hover:bg-gray-100 h-14 text-base px-8"
                asChild
              >
                <Link href="/auth/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-white text-white hover:bg-white/10 h-14 text-base px-8 bg-transparent"
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}