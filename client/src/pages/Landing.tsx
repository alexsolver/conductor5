import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, BarChart3, Shield, Globe, Headphones } from "lucide-react";
import { useLocalization } from '@/hooks/useLocalization';

const features = [
  {
  const { t } = useLocalization();

    icon: Headphones,
    title: "Omnichannel Support",
    description: "Manage tickets from email, chat, phone, and social media in one unified platform.",
  },
  {
    icon: BarChart3,
    title: {t('Landing.advancedAnalytics')},
    description: "Get insights with real-time dashboards, performance metrics, and detailed reporting.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Streamline agent workflows with smart routing, escalation, and team management tools.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Multi-tenant architecture with role-based access control and GDPR compliance.",
  },
  {
    icon: Globe,
    title: "Global Scale",
    description: "Support customers worldwide with multi-language capabilities and 24/7 availability.",
  },
  {
    icon: Zap,
    title: "AI-Powered Automation",
    description: "Automate responses, routing, and workflows to improve efficiency and reduce response times.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mr-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold gradient-text">Conductor</h1>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Customer Support
              <span className="gradient-text block">Reimagined</span>
            </h2>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              The comprehensive SaaS platform that transforms how you handle customer support. 
              Multi-tenant architecture, enterprise-grade security, and beautiful gradient design.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-primary text-white hover:opacity-90 px-8 py-3"
                onClick={() => window.location.href = "/api/login"}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="gradient-border hover-gradient px-8 py-3"
              >
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need for world-class support
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            From ticket management to advanced analytics, Conductor provides all the tools 
            your team needs to deliver exceptional customer experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="gradient-card hover:shadow-lg transition-shadow border-0">
              <CardHeader>
                <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to transform your customer support?
            </h3>
            <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
              Join thousands of teams already using Conductor to deliver 
              exceptional customer experiences at scale.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-gray-50 px-8 py-3"
              onClick={() => window.location.href = "/api/login"}
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center mr-3">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Conductor</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Conductor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
