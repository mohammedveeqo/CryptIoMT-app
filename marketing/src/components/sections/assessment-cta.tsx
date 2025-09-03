"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  CheckCircle, 
  ArrowRight,
  Phone,
  Mail
} from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

export function AssessmentCTA() {
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
      <div className="max-w-7xl mx-auto px-4">
        <div 
          ref={ctaRef}
          className={`transition-all duration-1000 ${
            ctaVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <Card className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl overflow-hidden">
            <CardContent className="p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Left Column - Content */}
                <div className="space-y-8">
                  <div className="space-y-6">
                    <Badge 
                      variant="outline" 
                      className="border-white/30 text-white bg-white/10 px-4 py-2 text-sm font-medium"
                    >
                      Professional Assessment Services
                    </Badge>
                    
                    <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                      Ready for a 
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                        Professional Assessment?
                      </span>
                    </h2>
                    
                    <p className="text-xl text-white/90 leading-relaxed">
                      Get expert guidance with our comprehensive cybersecurity risk assessment 
                      service. Our certified professionals will conduct an on-site evaluation 
                      and provide actionable recommendations.
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      "On-site device assessment",
                      "NIST framework alignment",
                      "Detailed risk report",
                      "Implementation roadmap"
                    ].map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                        <span className="text-white/90 text-sm font-medium">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button 
                      size="lg" 
                      className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                    >
                      Schedule Assessment
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-2 border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Call Expert
                    </Button>
                  </div>
                </div>

                {/* Right Column - Contact Info */}
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-lg border border-white/20 p-6">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-6 w-6 text-yellow-300" />
                        <h3 className="text-xl font-bold text-white">Expert Assessment</h3>
                      </div>
                      
                      <div className="space-y-3 text-white/90">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-blue-300" />
                          <span className="text-sm">assessment@cryptiomt.com</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Phone className="h-4 w-4 text-green-300" />
                          <span className="text-sm">(555) 123-4567</span>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/20">
                        <p className="text-sm text-white/80">
                          <strong>Typical Assessment:</strong> 2-3 days on-site with 
                          comprehensive report delivered within 1 week.
                        </p>
                      </div>
                    </div>
                  </Card>
                  
                  {/* Pricing Info */}
                  <Card className="bg-white/10 backdrop-blur-lg border border-white/20 p-6">
                    <div className="text-center space-y-3">
                      <div className="text-3xl font-bold text-white">Starting at</div>
                      <div className="text-5xl font-bold text-yellow-300">$5,000</div>
                      <div className="text-sm text-white/80">Comprehensive risk assessment</div>
                      <Badge className="bg-green-500/20 text-green-300 border-green-400/30">
                        ROI: 300%+ in first year
                      </Badge>
                    </div>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}