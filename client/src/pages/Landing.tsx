import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Users, BarChart3, Shield, Globe, Headphones } from "lucide-react";
// import useLocalization from '@/hooks/useLocalization';
const features = [
  {
  // Localization temporarily disabled
    icon: Headphones,
    title: "Omnichannel Support",
    description: "Manage tickets from email, chat, phone, and social media in one unified platform.",
  },
  {
    icon: BarChart3,
    title: '[TRANSLATION_NEEDED]',
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
    <div className="p-4"
      {/* Hero Section */}
      <div className="p-4"
        <div className="text-lg">"</div>
        <div className="p-4"
          <div className="p-4"
            <div className="p-4"
              <div className="p-4"
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-lg">"Conductor</h1>
            </div>
            
            <h2 className="p-4"
              Customer Support
              <span className="text-lg">"Reimagined</span>
            </h2>
            
            <p className="p-4"
              The comprehensive SaaS platform that transforms how you handle customer support. 
              Multi-tenant architecture, enterprise-grade security, and beautiful gradient design.
            </p>
            
            <div className="p-4"
              <Button 
                size="lg" 
                className="gradient-primary text-white hover:opacity-90 px-8 py-3"
                onClick={() => window.location.href = "/api/login"
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
      <div className="p-4"
        <div className="p-4"
          <h3 className="p-4"
            Everything you need for world-class support
          </h3>
          <p className="p-4"
            From ticket management to advanced analytics, Conductor provides all the tools 
            your team needs to deliver exceptional customer experiences.
          </p>
        </div>
        <div className="p-4"
          {features.map((feature, index) => (
            <Card key={index} className="p-4"
              <CardHeader>
                <div className="p-4"
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="p-4"
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="p-4"
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      {/* CTA Section */}
      <div className="p-4"
        <div className="p-4"
          <div className="p-4"
            <h3 className="p-4"
              Ready to transform your customer support?
            </h3>
            <p className="p-4"
              Join thousands of teams already using Conductor to deliver 
              exceptional customer experiences at scale.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-purple-600 hover:bg-gray-50 px-8 py-3"
              onClick={() => window.location.href = "/api/login"
            >
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>
      {/* Footer */}
      <footer className="p-4"
        <div className="p-4"
          <div className="p-4"
            <div className="p-4"
              <div className="p-4"
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg">"Conductor</span>
            </div>
            <p className="p-4"
              © 2025 Conductor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
