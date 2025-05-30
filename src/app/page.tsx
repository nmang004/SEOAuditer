'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
  ChevronRight
} from 'lucide-react';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.6,
      ease: [0.25, 0.1, 0.25, 1.0]
    }
  })
};

// Features data
const features = [
  {
    icon: <Search className="h-6 w-6 text-primary-600" />,
    title: 'Comprehensive SEO Analysis',
    description: 'Get detailed insights into your website\'s performance with our advanced SEO analysis tools.',
  },
  {
    icon: <BarChart3 className="h-6 w-6 text-primary-600" />,
    title: 'Competitor Benchmarking',
    description: 'Compare your performance against competitors and identify growth opportunities.',
  },
  {
    icon: <Code className="h-6 w-6 text-primary-600" />,
    title: 'Technical SEO Audit',
    description: 'Find and fix technical issues that might be affecting your search rankings.',
  },
  {
    icon: <Link2 className="h-6 w-6 text-primary-600" />,
    title: 'Backlink Analysis',
    description: 'Analyze your backlink profile and discover new link-building opportunities.',
  },
  {
    icon: <FileText className="h-6 w-6 text-primary-600" />,
    title: 'Content Optimization',
    description: 'Improve your content strategy with data-driven recommendations.',
  },
  {
    icon: <Shield className="h-6 w-6 text-primary-600" />,
    title: 'Security & Performance',
    description: 'Ensure your site is secure, fast, and optimized for search engines.',
  },
];

// Testimonials data
const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Marketing Director',
    content: 'Rival Outranker has transformed our SEO strategy. Our organic traffic has increased by 150% in just 3 months!',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'E-commerce Manager',
    content: 'The competitor analysis tools are incredible. We\'ve been able to outrank our biggest competitors consistently.',
    rating: 5
  },
  {
    name: 'Emily Rodriguez',
    role: 'Content Strategist',
    content: 'The content optimization suggestions have been game-changing for our blog. Our engagement rates are through the roof!',
    rating: 5
  }
];

// Pricing plans
const pricingPlans = [
  {
    name: 'Starter',
    price: 49,
    description: 'Perfect for small businesses getting started with SEO',
    features: [
      'Keyword Research',
      'Site Audits',
      'Basic Reporting',
      'Email Support'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    name: 'Professional',
    price: 99,
    description: 'For growing businesses with more complex needs',
    features: [
      'Everything in Starter',
      'Competitor Analysis',
      'Content Optimization',
      'Priority Support',
      'API Access'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    name: 'Enterprise',
    price: 199,
    description: 'For large organizations with advanced requirements',
    features: [
      'Everything in Professional',
      'Dedicated Account Manager',
      'Custom Integrations',
      'White Label Reports',
      '24/7 Support'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function HomePage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <div className="absolute inset-0 -z-10">
          <div className="absolute -right-[20%] -top-[20%] h-[60%] w-[60%] rounded-full bg-gradient-to-r from-primary-50 to-primary-100 blur-3xl" />
        </div>
        <div className="container relative z-10 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 mb-4"
            >
              <Zap className="mr-2 h-4 w-4" />
              The most advanced SEO platform
            </motion.div>
            <motion.h1 
              className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Grow Your Business with
              <span className="text-primary-600"> Data-Driven SEO</span>
            </motion.h1>
            <motion.p 
              className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Get actionable insights to improve your search rankings, analyze competitors, and grow your organic traffic with our powerful SEO platform.
            </motion.p>
            <motion.div 
              className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Button 
                size="lg" 
                className="group h-14 text-base px-8 bg-primary-600 hover:bg-primary-700" 
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
                className="h-14 text-base px-8 border-gray-300 text-gray-700 hover:bg-gray-50" 
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 md:mt-24"
          >
            <div className="relative mx-auto max-w-6xl rounded-2xl border border-gray-200 bg-white p-1 shadow-lg">
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-50 via-white to-primary-50 rounded-3xl opacity-60 blur-2xl" />
              <div className="relative overflow-hidden rounded-xl bg-white">
                <div className="flex h-8 items-center border-b border-gray-200 px-4">
                  <div className="flex space-x-2">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                </div>
                <div className="flex h-96 items-center justify-center p-8">
                  <div className="text-center">
                    <BarChart4 className="mx-auto h-16 w-16 text-gray-200" />
                    <p className="mt-4 text-sm text-gray-500">Your SEO dashboard will appear here</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <motion.span 
              className="inline-block rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Features
            </motion.span>
            <motion.h2 
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Everything you need to <span className="text-primary-600">succeed in SEO</span>
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Powerful tools and insights to help you improve your search rankings and grow your online presence.
            </motion.p>
          </div>

          <motion.div 
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                custom={index * 0.1}
                className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm transition-all hover:shadow-md border border-gray-100"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
                <div className="absolute -right-8 -bottom-8 h-16 w-16 rounded-full bg-primary-100 opacity-0 transition-all duration-300 group-hover:opacity-100" />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gray-50">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center mb-16">
            <motion.span 
              className="inline-block rounded-full bg-primary-50 px-4 py-1.5 text-sm font-medium text-primary-700 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Testimonials
            </motion.span>
            <motion.h2 
              className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Trusted by <span className="text-primary-600">marketing teams</span> worldwide
            </motion.h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100"
              >
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} 
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-6">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary-600">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <motion.h2 
              className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Ready to transform your SEO strategy?
            </motion.h2>
            <motion.p 
              className="text-xl text-primary-100 mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              Join thousands of businesses that trust Rival Outranker for their SEO success.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Button 
                size="lg" 
                className="bg-white text-primary-700 hover:bg-gray-100 h-14 text-base px-8"
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
                className="border-white text-white hover:bg-primary-700 h-14 text-base px-8"
                asChild
              >
                <Link href="/demo">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
