'use client';

import React from 'react';
import { ArrowRight, Check, CheckCircle, Clock, Code, Cpu, Database, FileText, Globe, HelpCircle, Link2, Mail, Server, Shield, Star, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const pricingPlans = [
  {
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for individuals getting started with SEO',
    buttonText: 'Get Started',
    featured: false,
    features: [
      { text: '10 website analyses per month', included: true },
      { text: 'Basic SEO audit', included: true },
      { text: 'Keyword tracking (10 keywords)', included: true },
      { text: 'Competitor analysis (1 competitor)', included: true },
      { text: 'Weekly reports', included: false },
      { text: 'Priority support', included: false },
      { text: 'API access', included: false },
      { text: 'Team members', included: false },
    ]
  },
  {
    name: 'Professional',
    price: '$49',
    description: 'For growing businesses and agencies',
    buttonText: 'Start 14-day Free Trial',
    featured: true,
    features: [
      { text: '100 website analyses per month', included: true },
      { text: 'Advanced SEO audit', included: true },
      { text: 'Keyword tracking (100 keywords)', included: true },
      { text: 'Competitor analysis (5 competitors)', included: true },
      { text: 'Daily reports', included: true },
      { text: 'Priority support', included: true },
      { text: 'API access', included: false },
      { text: 'Team members (up to 3)', included: true },
    ]
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large organizations with advanced needs',
    buttonText: 'Contact Sales',
    featured: false,
    features: [
      { text: 'Unlimited website analyses', included: true },
      { text: 'Enterprise SEO audit', included: true },
      { text: 'Keyword tracking (unlimited)', included: true },
      { text: 'Competitor analysis (unlimited)', included: true },
      { text: 'Real-time reports', included: true },
      { text: '24/7 Priority support', included: true },
      { text: 'API access', included: true },
      { text: 'Unlimited team members', included: true },
    ]
  }
];

const features = [
  {
    icon: <Cpu className="w-6 h-6 text-indigo-400" />,
    title: "Powerful Analysis",
    description: "Advanced algorithms analyze every aspect of your website's SEO performance."
  },
  {
    icon: <TrendingUp className="w-6 h-6 text-purple-400" />,
    title: "Competitive Edge",
    description: "Get insights that help you outrank your competitors in search results."
  },
  {
    icon: <Shield className="w-6 h-6 text-blue-400" />,
    title: "Secure & Private",
    description: "Your data is encrypted and protected with enterprise-grade security."
  },
  {
    icon: <Zap className="w-6 h-6 text-green-400" />,
    title: "Lightning Fast",
    description: "Get comprehensive SEO reports in seconds, not hours."
  }
];

const faqs = [
  {
    question: "Is there a free trial available?",
    answer: "Yes, our Professional plan comes with a 14-day free trial. No credit card required."
  },
  {
    question: "Can I change plans later?",
    answer: "Absolutely! You can upgrade or downgrade your plan at any time."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards, PayPal, and bank transfers for annual plans."
  },
  {
    question: "Do you offer discounts for non-profits?",
    answer: "Yes, we offer special pricing for non-profit organizations. Please contact our sales team."
  }
];

const PricingCard = ({ plan, index }: { plan: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className={`relative ${plan.featured ? 'border-2 border-indigo-500' : 'border border-gray-700'} bg-[#2D3748] rounded-2xl p-8`}
  >
    {plan.featured && (
      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
          MOST POPULAR
        </div>
      </div>
    )}
    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
    <div className="flex items-baseline mb-6">
      <span className="text-4xl font-extrabold text-white">{plan.price}</span>
      {plan.price !== 'Free' && plan.price !== 'Custom' && (
        <span className="ml-2 text-gray-400">/month</span>
      )}
    </div>
    <p className="text-gray-300 mb-6">{plan.description}</p>
    <Link
      href={plan.price === 'Free' ? '/signup' : plan.price === 'Custom' ? '/contact' : '/signup?plan=pro'}
      className={`block w-full text-center py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
        plan.featured
          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105'
          : 'bg-gray-700 text-white hover:bg-gray-600'
      }`}
    >
      {plan.buttonText}
    </Link>
    <div className="mt-8 space-y-4">
      <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">What's included</h4>
      <ul className="space-y-3">
        {plan.features.map((feature: any, i: number) => (
          <li key={i} className="flex items-start">
            {feature.included ? (
              <CheckCircle className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
            ) : (
              <HelpCircle className="w-5 h-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
            )}
            <span className={`${feature.included ? 'text-gray-200' : 'text-gray-500'}`}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#1A202C] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl mb-6">
            Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Pricing</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose the perfect plan for your needs. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        {/* Pricing Tiers */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24"
        >
          {pricingPlans.map((plan, index) => (
            <PricingCard key={plan.name} plan={plan} index={index} />
          ))}
        </motion.div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-24"
        >
          <h2 className="text-3xl font-bold text-center text-white mb-12">Everything You Need to Succeed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#2D3748] p-6 rounded-xl hover:bg-[#3A4556] transition-colors duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-indigo-900/50 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* FAQ */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-24"
        >
          <h2 className="text-3xl font-bold text-center text-white mb-12">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <motion.div 
                key={faq.question}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#2D3748] p-6 rounded-xl"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                <p className="text-gray-300">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-12 text-center"
        >
          <h2 className="text-3xl font-bold text-white mb-4">Ready to improve your SEO?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses that trust Rival Outranker for their SEO success.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              href="/signup" 
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
            >
              Get Started for Free
              <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
            </Link>
            <Link 
              href="/demo" 
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-700 hover:bg-indigo-800 md:py-4 md:text-lg md:px-10 transition-all duration-300"
            >
              Request a Demo
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}