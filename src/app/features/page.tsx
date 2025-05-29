import { ArrowRight, BarChart3, Bot, CheckCircle, Code, Cpu, FileText, Globe, LayoutDashboard, Lightbulb, Link2, ListChecks, Lock, Monitor, Search, Shield, TrendingUp, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const features = [
  {
    icon: <Search className="w-8 h-8 text-indigo-400" />,
    title: "Comprehensive SEO Analysis",
    description: "Get in-depth analysis of your website's SEO performance with actionable insights to improve your search rankings.",
    highlights: [
      "On-page SEO analysis",
      "Technical SEO audit",
      "Content optimization",
      "Mobile-friendliness check"
    ]
  },
  {
    icon: <BarChart3 className="w-8 h-8 text-purple-400" />,
    title: "Competitor Intelligence",
    description: "Uncover your competitors' strategies and outrank them with data-driven insights.",
    highlights: [
      "Backlink analysis",
      "Keyword gap analysis",
      "Content gap identification",
      "Ranking comparison"
    ]
  },
  {
    icon: <Code className="w-8 h-8 text-blue-400" />,
    title: "Technical SEO Tools",
    description: "Identify and fix technical issues that might be holding your website back.",
    highlights: [
      "Site speed analysis",
      "Crawlability reports",
      "Structured data validation",
      "XML sitemap generator"
    ]
  },
  {
    icon: <FileText className="w-8 h-8 text-green-400" />,
    title: "Content Optimization",
    description: "Create content that ranks with our AI-powered content analysis tools.",
    highlights: [
      "Readability scoring",
      "Keyword optimization",
      "Content structure analysis",
      "Meta tag optimization"
    ]
  },
  {
    icon: <Link2 className="w-8 h-8 text-yellow-400" />,
    title: "Link Building Tools",
    description: "Build high-quality backlinks with our comprehensive link analysis tools.",
    highlights: [
      "Backlink monitoring",
      "Broken link finder",
      "Link intersect analysis",
      "Link building opportunities"
    ]
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-red-400" />,
    title: "Rank Tracking",
    description: "Monitor your keyword rankings and track your progress over time.",
    highlights: [
      "Daily rank tracking",
      "Ranking history",
      "Local & mobile rankings",
      "Competitor comparison"
    ]
  }
];

const FeatureCard = ({ feature, index }: { feature: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay: index * 0.1 }}
    className="bg-[#2D3748] p-6 rounded-xl hover:bg-[#3A4556] transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/20"
  >
    <div className="flex items-start space-x-4">
      <div className="p-2 bg-[#2D3748] rounded-lg">
        {feature.icon}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
        <p className="text-gray-300 mb-3">{feature.description}</p>
        <ul className="space-y-2">
          {feature.highlights.map((item: string, i: number) => (
            <li key={i} className="flex items-center text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </motion.div>
);

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#1A202C] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
            Powerful Features to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Supercharge</span> Your SEO
          </h1>
          <p className="mt-5 max-w-3xl mx-auto text-xl text-gray-300">
            Everything you need to analyze, optimize, and dominate search rankings in one powerful platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Ready to transform your SEO strategy?</h2>
          <Link 
            href="/pricing" 
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
          >
            Get Started Now
            <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}