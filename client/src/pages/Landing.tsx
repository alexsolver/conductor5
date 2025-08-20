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
    <div className=""
      {/* Hero Section */}
      <div className=""
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className=""
          <div className=""
            <div className=""
              <div className=""
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-5xl font-bold gradient-text">Conductor</h1>
            </div>
            
            <h2 className=""
              Customer Support
              <span className="gradient-text block">Reimagined</span>
            </h2>
            
            <p className=""
              The comprehensive SaaS platform that transforms how you handle customer support. 
              Multi-tenant architecture, enterprise-grade security, and beautiful gradient design.
            </p>
            
            <div className=""
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
      <div className=""
        <div className=""
          <h3 className=""
            Everything you need for world-class support
          </h3>
          <p className=""
            From ticket management to advanced analytics, Conductor provides all the tools 
            your team needs to deliver exceptional customer experiences.
          </p>
        </div>

        <div className=""
          {features.map((feature, index) => (
            <Card key={index} className=""
              <CardHeader>
                <div className=""
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className=""
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className=""
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className=""
        <div className=""
          <div className=""
            <h3 className=""
              Ready to transform your customer support?
            </h3>
            <p className=""
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
      <footer className=""
        <div className=""
          <div className=""
            <div className=""
              <div className=""
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-semibold">Conductor</span>
            </div>
            <p className=""
              © 2025 Conductor. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
