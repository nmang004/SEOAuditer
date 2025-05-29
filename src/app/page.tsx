"use client";

import Link from "next/link";
import { m, motion } from "framer-motion";
import { ArrowRight, BarChart, Search, Shield, Zap, Cpu, BarChart3, ClipboardList, CheckCircle, LayoutDashboard, Target, Star, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeInUp, staggerContainer } from "@/lib/animations";
import React from "react";

// How It Works Steps
const steps = [
  {
    icon: <Search className="w-6 h-6 text-indigo-400" />, title: "1. Enter Your Website", description: "Start by entering your website URL and the keywords you want to rank for. Our system will begin analyzing your site's current performance.", features: ["Website crawling", "Initial SEO health check", "Competitor identification"]
  },
  {
    icon: <Cpu className="w-6 h-6 text-purple-400" />, title: "2. Deep Analysis", description: "Our advanced algorithms perform a comprehensive analysis of your website's technical SEO, content, and backlink profile.", features: ["Technical SEO audit", "Content quality assessment", "Backlink profile analysis"]
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-blue-400" />, title: "3. Competitor Benchmarking", description: "We analyze your top competitors to identify opportunities where you can outperform them in search results.", features: ["Keyword gap analysis", "Content opportunities", "Backlink comparison"]
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-green-400" />, title: "4. Get Actionable Insights", description: "Receive a detailed report with prioritized recommendations to improve your website's search performance.", features: ["Prioritized action items", "Step-by-step guides", "Performance metrics"]
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />, title: "5. Implement & Track", description: "Implement our recommendations and track your progress with our real-time analytics dashboard.", features: ["Progress tracking", "Ranking improvements", "ROI measurement"]
  }
];

// Features
const features = [
  { icon: <Search className="h-6 w-6 text-indigo-500" />, title: 'Keyword Research', description: 'Discover high-value keywords with our advanced research tools and competitor analysis.' },
  { icon: <BarChart3 className="h-6 w-6 text-purple-500" />, title: 'Rank Tracking', description: 'Monitor your search engine rankings and track your progress over time.' },
  { icon: <Cpu className="h-6 w-6 text-blue-500" />, title: 'Technical SEO', description: 'Identify and fix technical issues that could be affecting your search rankings.' },
  { icon: <Shield className="h-6 w-6 text-blue-400" />, title: 'Secure & Private', description: 'Your data is encrypted and protected with enterprise-grade security.' },
  { icon: <Zap className="h-6 w-6 text-green-400" />, title: 'Lightning Fast', description: 'Get comprehensive SEO reports in seconds, not hours.' },
  { icon: <LayoutDashboard className="h-6 w-6 text-indigo-400" />, title: 'Comprehensive Dashboard', description: 'Track all your SEO metrics in one place with our intuitive dashboard.' },
  { icon: <Target className="h-6 w-6 text-blue-400" />, title: 'Goal Tracking', description: 'Set and track your SEO goals with our advanced analytics.' },
  { icon: <BarChart className="h-6 w-6 text-purple-500" />, title: 'Competitor Analysis', description: 'Analyze your competitors and identify opportunities to outperform them.' },
];

// Pricing
const pricingPlans = [
  {
    name: 'Starter', price: 'Free', description: 'Perfect for individuals getting started with SEO', buttonText: 'Get Started', featured: false,
    features: [
      '10 website analyses per month', 'Basic SEO audit', 'Keyword tracking (10 keywords)', 'Competitor analysis (1 competitor)'
    ]
  },
  {
    name: 'Professional', price: '$49', description: 'For growing businesses and agencies', buttonText: 'Start 14-day Free Trial', featured: true,
    features: [
      '100 website analyses per month', 'Advanced SEO audit', 'Keyword tracking (100 keywords)', 'Competitor analysis (5 competitors)', 'Daily reports', 'Priority support', 'Team members (up to 3)'
    ]
  },
  {
    name: 'Enterprise', price: 'Custom', description: 'For large organizations with advanced needs', buttonText: 'Contact Sales', featured: false,
    features: [
      'Unlimited website analyses', 'Enterprise SEO audit', 'Keyword tracking (unlimited)', 'Competitor analysis (unlimited)', 'Real-time reports', '24/7 Priority support', 'API access', 'Unlimited team members'
    ]
  }
];

// Mock Testimonials
const testimonials = [
  {
    quote: "Rival Outranker helped us double our organic traffic in 3 months!",
    name: "Jane D.",
    title: "SaaS Founder"
  },
  {
    quote: "The competitor insights are a game changer.",
    name: "Mark T.",
    title: "Marketing Lead"
  },
  {
    quote: "Super easy to use and the reports are beautiful.",
    name: "Alex P.",
    title: "Agency Owner"
  }
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1A202C] text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-[#2D3748] bg-[#1A202C]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1A202C]/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-indigo-400">
              <path d="m3 11 18-5v12L3 14v-3z"></path>
              <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
            </svg>
            <span className="font-bold text-xl text-white">Rival Outranker</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-indigo-200 hover:text-white">Features</Link>
            <Link href="/how-it-works" className="text-sm font-medium text-indigo-200 hover:text-white">How It Works</Link>
            <Link href="/pricing" className="text-sm font-medium text-indigo-200 hover:text-white">Pricing</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/auth/login"><Button variant="ghost" className="text-indigo-200 hover:text-white">Log In</Button></Link>
            <Link href="/auth/register"><Button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">Sign Up</Button></Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-b from-[#1A202C] via-indigo-900/60 to-[#2D3748]">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container relative z-10"
          >
            <m.div className="mx-auto max-w-3xl text-center">
              <m.h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-white drop-shadow-lg" variants={fadeInUp}>
                Outrank Your Competitors with
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500 font-extrabold drop-shadow-md mt-2 md:mt-0 md:inline"> Advanced SEO Analytics</span>
              </m.h1>
              <m.p className="mb-10 text-lg text-indigo-200 md:text-xl" variants={fadeInUp}>
                Analyze your website's SEO performance, identify critical issues, and get actionable recommendations to improve your search rankings.
              </m.p>
              <m.div className="flex flex-col sm:flex-row items-center justify-center gap-4" variants={fadeInUp}>
                <Link href="/dashboard"><Button size="lg" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">Get Started<ArrowRight className="h-4 w-4" /></Button></Link>
                <Link href="#how-it-works"><Button variant="outline" size="lg" className="border-indigo-400 text-indigo-200 hover:text-white">Learn More</Button></Link>
              </m.div>
            </m.div>
          </motion.div>
          {/* Animated background shapes */}
          <motion.div
            className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/20 blur-3xl z-0"
            animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tr from-purple-600/30 to-indigo-400/20 blur-2xl z-0"
            animate={{ scale: [1, 1.05, 1], rotate: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
          />
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24 bg-[#2D3748]">
          <div className="container mx-auto max-w-6xl">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">How Rival Outranker Works</motion.h2>
            <div className="space-y-16">
              {steps.map((step, idx) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className={`flex flex-col md:flex-row ${idx % 2 === 0 ? '' : 'md:flex-row-reverse'} items-center gap-8`}
                >
                  <div className="flex-shrink-0 w-16 h-16 rounded-full bg-indigo-900/50 flex items-center justify-center">{step.icon}</div>
                  <div className="flex-1 bg-[#23293a] p-6 rounded-xl">
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-indigo-200 mb-4">{step.description}</p>
                    <ul className="space-y-2">
                      {step.features.map((feature, i) => (
                        <li key={i} className="flex items-center text-indigo-200"><CheckCircle className="w-4 h-4 mr-2 text-green-400" />{feature}</li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-gradient-to-b from-[#23293a] to-[#1A202C]">
          <div className="container">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">Powerful Features for SEO Success</motion.h2>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, idx) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -5, scale: 1.03 }}
                  className="group relative overflow-hidden rounded-xl border border-indigo-900 bg-[#23293a] p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-900/30">{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-indigo-200">{feature.description}</p>
                  <div className="absolute -right-8 -bottom-8 h-16 w-16 rounded-full bg-indigo-700/10 transition-all duration-300 group-hover:scale-150" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-[#1A202C]">
          <div className="container">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">Simple, Transparent Pricing</motion.h2>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {pricingPlans.map((plan, idx) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className={`relative rounded-2xl p-8 ${plan.featured ? 'border-2 border-indigo-500 bg-[#23293a]' : 'border border-indigo-900 bg-[#23293a]'}`}
                >
                  {plan.featured && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full">MOST POPULAR</div>
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    {plan.price !== 'Free' && plan.price !== 'Custom' && <span className="ml-2 text-indigo-200">/month</span>}
                  </div>
                  <p className="text-indigo-200 mb-6">{plan.description}</p>
                  <Link href={plan.price === 'Free' ? '/auth/register' : plan.price === 'Custom' ? '/contact' : '/auth/register?plan=pro'} className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-all duration-300 ${plan.featured ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105' : 'bg-indigo-900 text-white hover:bg-indigo-800'}`}>{plan.buttonText}</Link>
                  <div className="mt-8 space-y-4">
                    <h4 className="text-sm font-semibold text-indigo-300 uppercase tracking-wider">What's included</h4>
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start"><CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" /><span className="text-indigo-100">{feature}</span></li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-24 bg-gradient-to-b from-[#23293a] to-[#1A202C]">
          <div className="container">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">What Our Users Say</motion.h2>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((t, idx) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="rounded-2xl bg-[#23293a] p-8 border border-indigo-900 shadow-lg flex flex-col items-center text-center"
                >
                  <Star className="w-8 h-8 text-yellow-400 mb-4" />
                  <p className="text-lg text-indigo-100 mb-6">“{t.quote}”</p>
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className="text-indigo-300">/ {t.title}</span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="mb-6 text-3xl font-bold md:text-4xl">Ready to Outrank Your Competitors?</h2>
              <p className="mb-10 text-lg opacity-90">Join thousands of businesses that have improved their search rankings with Rival Outranker.</p>
              <Link href="/auth/register"><Button size="lg" variant="outline" className="bg-white text-indigo-700 hover:bg-gray-100 border-white">Start Your Free Trial</Button></Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#2D3748] py-12 bg-[#1A202C]">
        <div className="container">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-indigo-400">
                <path d="m3 11 18-5v12L3 14v-3z"></path>
                <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"></path>
              </svg>
              <span className="font-semibold text-white">Rival Outranker</span>
            </div>
            <div className="flex gap-6 text-sm text-indigo-200">
              <Link href="#" className="hover:text-white">Terms</Link>
              <Link href="#" className="hover:text-white">Privacy</Link>
              <Link href="#" className="hover:text-white">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
