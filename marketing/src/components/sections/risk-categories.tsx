"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Database, 
  Wifi, 
  Lock, 
  AlertTriangle, 
  Activity,
  Users,
  Building2
} from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const riskCategories = [
  {
    icon: Shield,
    title: "Device Security",
    description: "Assessment of medical device vulnerabilities, patch management, and security configurations.",
    risks: [
      "Unpatched operating systems",
      "Default credentials",
      "Weak authentication",
      "Insecure protocols"
    ],
    color: "from-blue-500 to-blue-600",
    riskLevel: "High"
  },
  {
    icon: Database,
    title: "Data Protection",
    description: "Evaluation of patient data handling, encryption, and HIPAA compliance measures.",
    risks: [
      "Unencrypted data transmission",
      "Inadequate access controls",
      "Data retention violations",
      "Backup security gaps"
    ],
    color: "from-purple-500 to-purple-600",
    riskLevel: "Critical"
  },
  {
    icon: Wifi,
    title: "Network Security",
    description: "Analysis of network segmentation, monitoring, and IoMT device connectivity.",
    risks: [
      "Unsegmented networks",
      "Weak wireless security",
      "Insufficient monitoring",
      "Lateral movement risks"
    ],
    color: "from-green-500 to-green-600",
    riskLevel: "High"
  },
  {
    icon: Users,
    title: "Access Management",
    description: "Review of user privileges, authentication systems, and identity management.",
    risks: [
      "Excessive privileges",
      "Shared accounts",
      "Weak password policies",
      "Missing MFA"
    ],
    color: "from-orange-500 to-orange-600",
    riskLevel: "Medium"
  },
  {
    icon: Activity,
    title: "Operational Security",
    description: "Assessment of incident response, business continuity, and operational procedures.",
    risks: [
      "No incident response plan",
      "Inadequate backups",
      "Poor change management",
      "Limited staff training"
    ],
    color: "from-red-500 to-red-600",
    riskLevel: "High"
  },
  {
    icon: Building2,
    title: "Compliance & Governance",
    description: "Evaluation of regulatory compliance, policies, and governance frameworks.",
    risks: [
      "HIPAA violations",
      "Missing policies",
      "Inadequate documentation",
      "Audit trail gaps"
    ],
    color: "from-indigo-500 to-indigo-600",
    riskLevel: "Medium"
  }
];

function getRiskBadgeColor(level: string): string {
  switch (level) {
    case "Critical": return "bg-red-100 text-red-800 border-red-200";
    case "High": return "bg-orange-100 text-orange-800 border-orange-200";
    case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
    default: return "bg-green-100 text-green-800 border-green-200";
  }
}

export function RiskCategories() {
  const { ref: categoriesRef, isVisible: categoriesVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div 
          ref={categoriesRef}
          className={`transition-all duration-1000 ${
            categoriesVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Section Header */}
          <div className="text-center space-y-6 mb-16">
            <Badge 
              variant="outline" 
              className="border-green-200 text-green-700 bg-green-50 px-4 py-2 text-sm font-medium mx-auto"
            >
              Comprehensive Risk Analysis
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Risk Assessment Categories
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our systematic approach evaluates six critical areas of healthcare cybersecurity 
              to provide comprehensive risk visibility and actionable insights.
            </p>
          </div>

          {/* Risk Categories Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {riskCategories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card 
                  key={category.title}
                  className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border border-gray-200 rounded-2xl overflow-hidden ${
                    categoriesVisible 
                      ? `animate-fade-in-up` 
                      : 'opacity-0'
                  }`}
                  style={{
                    animationDelay: categoriesVisible ? `${index * 100}ms` : '0ms'
                  }}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Icon and Risk Level */}
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} shadow-lg`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-xs font-medium ${getRiskBadgeColor(category.riskLevel)}`}
                        >
                          {category.riskLevel} Risk
                        </Badge>
                      </div>
                      
                      {/* Title and Description */}
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {category.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {category.description}
                        </p>
                      </div>
                      
                      {/* Risk Items */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-gray-900">Common Risks:</h4>
                        <ul className="space-y-1">
                          {category.risks.map((risk, riskIndex) => (
                            <li key={riskIndex} className="flex items-center space-x-2 text-xs text-gray-600">
                              <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                              <span>{risk}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}