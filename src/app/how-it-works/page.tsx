import { ArrowRight, BarChart3, CheckCircle, ChevronRight, ClipboardList, Cpu, FileText, LayoutDashboard, Search, Shield, Target, Zap } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const steps = [
  {
    icon: <Search className="w-6 h-6 text-indigo-400" />,
    title: "1. Enter Your Website",
    description: "Start by entering your website URL and the keywords you want to rank for. Our system will begin analyzing your site's current performance.",
    features: [
      "Website crawling",
      "Initial SEO health check",
      "Competitor identification"
    ]
  },
  {
    icon: <Cpu className="w-6 h-6 text-purple-400" />,
    title: "2. Deep Analysis",
    description: "Our advanced algorithms perform a comprehensive analysis of your website's technical SEO, content, and backlink profile.",
    features: [
      "Technical SEO audit",
      "Content quality assessment",
      "Backlink profile analysis"
    ]
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-blue-400" />,
    title: "3. Competitor Benchmarking",
    description: "We analyze your top competitors to identify opportunities where you can outperform them in search results.",
    features: [
      "Keyword gap analysis",
      "Content opportunities",
      "Backlink comparison"
    ]
  },
  {
    icon: <ClipboardList className="w-6 h-6 text-green-400" />,
    title: "4. Get Actionable Insights",
    description: "Receive a detailed report with prioritized recommendations to improve your website's search performance.",
    features: [
      "Prioritized action items",
      "Step-by-step guides",
      "Performance metrics"
    ]
  },
  {
    icon: <Zap className="w-6 h-6 text-yellow-400" />,
    title: "5. Implement & Track",
    description: "Implement our recommendations and track your progress with our real-time analytics dashboard.",
    features: [
      "Progress tracking",
      "Ranking improvements",
      "ROI measurement"
    ]
  }
];

const StepCard = ({ step, index }: { step: any, index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay: index * 0.15 }}
    className={`flex ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col items-center gap-8 mb-16`}
  >
    <div className="flex-shrink-0 w-16 h-16 rounded-full bg-indigo-900/50 flex items-center justify-center">
      {step.icon}
    </div>
    <div className="flex-1 bg-[#2D3748] p-6 rounded-xl">
      <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
      <p className="text-gray-300 mb-4">{step.description}</p>
      <ul className="space-y-2">
        {step.features.map((feature: string, i: number) => (
          <li key={i} className="flex items-center text-gray-300">
            <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  </motion.div>
);

const features = [
  {
    icon: <LayoutDashboard className="w-8 h-8 text-indigo-400" />,
    title: "Comprehensive Dashboard",
    description: "Track all your SEO metrics in one place with our intuitive dashboard."
  },
  {
    icon: <Shield className="w-8 h-8 text-purple-400" />,
    title: "Security First",
    description: "Your data is encrypted and protected with enterprise-grade security measures."
  },
  {
    icon: <Target className="w-8 h-8 text-blue-400" />,
    title: "Goal Tracking",
    description: "Set and track your SEO goals with our advanced analytics."
  }
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#1A202C] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl sm:tracking-tight lg:text-6xl mb-6">
            How Rival Outranker <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">Works</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A simple, step-by-step process to analyze, optimize, and dominate search rankings.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto mb-24">
          {steps.map((step, index) => (
            <StepCard key={step.title} step={step} index={index} />
          ))}
        </div>

        {/* Features */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 mb-16"
        >
          <h2 className="text-3xl font-bold text-center text-white mb-12">Why Choose Rival Outranker?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

        {/* CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-center"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Ready to boost your search rankings?</h2>
          <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
            Join thousands of businesses that trust Rival Outranker for their SEO success.
          </p>
          <Link 
            href="/pricing" 
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 md:py-4 md:text-lg md:px-10 transition-all duration-300 transform hover:scale-105"
          >
            Get Started for Free
            <ArrowRight className="ml-2 -mr-1 w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}