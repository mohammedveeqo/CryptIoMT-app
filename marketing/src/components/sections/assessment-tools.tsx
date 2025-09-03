"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  CheckCircle, 
  BarChart3,
  Settings
} from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const assessmentTools = [
  {
    icon: FileText,
    title: "Risk Assessment Questionnaire",
    description: "Comprehensive 150-point assessment covering all critical security domains.",
    features: [
      "NIST SP 800-37 aligned questions",
      "HIPAA compliance checklist",
      "IoMT-specific risk factors",
      "Automated scoring system"
    ],
    downloadLink: "/downloads/risk-assessment-questionnaire.pdf",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: BarChart3,
    title: "Risk Analysis Template",
    description: "Excel-based risk calculation and prioritization matrix for systematic analysis.",
    features: [
      "Automated risk scoring",
      "Visual risk heat maps",
      "Mitigation tracking",
      "Executive reporting"
    ],
    downloadLink: "/downloads/risk-analysis-template.xlsx",
    color: "from-green-500 to-green-600"
  },
  {
    icon: Settings,
    title: "Security Control Framework",
    description: "Implementation guide for essential cybersecurity controls in healthcare.",
    features: [
      "Control implementation guides",
      "Testing procedures",
      "Compliance mapping",
      "Best practice recommendations"
    ],
    downloadLink: "/downloads/security-control-framework.pdf",
    color: "from-purple-500 to-purple-600"
  }
];

export function AssessmentTools() {
  const { ref: toolsRef, isVisible: toolsVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div 
          ref={toolsRef}
          className={`transition-all duration-1000 ${
            toolsVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Section Header */}
          <div className="text-center space-y-6 mb-16">
            <Badge 
              variant="outline" 
              className="border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium mx-auto"
            >
              Free Assessment Resources
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Risk Assessment Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Download our comprehensive toolkit to conduct thorough cybersecurity 
              risk assessments for your healthcare organization.
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {assessmentTools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <Card 
                  key={tool.title}
                  className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border border-gray-200 rounded-2xl overflow-hidden ${
                    toolsVisible 
                      ? `animate-fade-in-up` 
                      : 'opacity-0'
                  }`}
                  style={{
                    animationDelay: toolsVisible ? `${index * 100}ms` : '0ms'
                  }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-xl bg-gradient-to-r ${tool.color} shadow-lg`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className="text-xs font-medium bg-green-50 text-green-700 border-green-200">
                        Free Download
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {tool.description}
                    </p>
                    
                    {/* Features */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-900">Includes:</h4>
                      <ul className="space-y-1">
                        {tool.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center space-x-2 text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Download Button */}
                    <Button 
                      className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Tool
                    </Button>
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