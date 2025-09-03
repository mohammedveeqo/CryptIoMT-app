"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  BarChart3, 
  Settings, 
  Shield,
  ArrowRight,
  CheckCircle
} from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const coreServices = [
  {
    icon: Search,
    title: "Medical Device Inventory",
    shortDescription: "Complete discovery and classification of all IoMT devices in your network",
    keyBenefits: ["Asset Discovery", "Risk Classification", "HIPAA Compliance"]
  },
  {
    icon: BarChart3,
    title: "Risk Analysis & Assessment", 
    shortDescription: "NIST-aligned risk evaluation prioritizing life-critical medical devices",
    keyBenefits: ["Threat Assessment", "Business Impact Analysis", "FDA Alignment"]
  },
  {
    icon: Settings,
    title: "Cybersecurity Planning",
    shortDescription: "Tailored security strategies that protect patients without disrupting care",
    keyBenefits: ["Custom Roadmaps", "Security Controls", "Continuous Monitoring"]
  }
];

export function ServicesOverview() {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div 
          ref={sectionRef}
          className={`transition-all duration-1000 ${
            sectionVisible 
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
              Our Core Services
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Healthcare Cybersecurity Solutions
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive IoMT security services designed specifically for healthcare organizations. 
              We protect your medical devices, patient data, and operational continuity.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {coreServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200">
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Icon */}
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Icon className="h-8 w-8 text-white" />
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {service.title}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-600 leading-relaxed">
                        {service.shortDescription}
                      </p>
                      
                      {/* Key Benefits */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-900">Key Benefits:</h4>
                        <ul className="space-y-2">
                          {service.keyBenefits.map((benefit, idx) => (
                            <li key={idx} className="flex items-center space-x-2 text-gray-600">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-sm">{benefit}</span>
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

          {/* Call to Action */}
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <span className="text-lg font-semibold text-gray-900">Complete Healthcare Cybersecurity</span>
                </div>
                <p className="text-gray-600 text-lg">
                  From device discovery to ongoing monitoring, we provide end-to-end cybersecurity 
                  solutions that keep your healthcare organization secure and compliant.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                    const element = document.getElementById('contact');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}>
                    Get Risk Assessment
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => {
                    const element = document.getElementById('services');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}>
                    View All Services
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}