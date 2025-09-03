"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

export function RiskAssessmentHero() {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();

  return (
    <section className="relative py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <div 
          ref={heroRef}
          className={`grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
            heroVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <Badge 
                variant="outline" 
                className="border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium"
              >
                NIST SP 800-37 Aligned Framework
              </Badge>
              
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Healthcare 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Risk Assessment
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                Comprehensive cybersecurity risk analysis for medical devices and IoMT environments. 
                Identify vulnerabilities, assess threats, and implement security controls that protect 
                patient safety while maintaining operational efficiency.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300" onClick={() => {
                const element = document.getElementById('contact');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}>
                Start Assessment
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg transform hover:scale-105 transition-all duration-300">
                Download Framework
              </Button>
            </div>

            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4 pt-8">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">FDA Aligned</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">NIST Framework</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">IoMT Focused</span>
              </div>
            </div>
          </div>

          {/* Right Column - Risk Assessment Preview */}
          <div className="relative">
            <Card className="p-8 bg-white border border-gray-200 shadow-xl rounded-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">Risk Assessment Matrix</h3>
                  <Badge variant="outline" className="text-xs">Live Preview</Badge>
                </div>
                
                {/* Risk Matrix Preview */}
                <div className="grid grid-cols-5 gap-2">
                  {/* Headers */}
                  <div></div>
                  <div className="text-xs font-medium text-center p-2">Very Low</div>
                  <div className="text-xs font-medium text-center p-2">Low</div>
                  <div className="text-xs font-medium text-center p-2">Medium</div>
                  <div className="text-xs font-medium text-center p-2">High</div>
                  
                  {/* Critical Row */}
                  <div className="text-xs font-medium p-2 rotate-180" style={{writingMode: 'vertical-lr'}}>Critical</div>
                  <div className="bg-yellow-200 p-2 rounded text-xs text-center">5</div>
                  <div className="bg-orange-300 p-2 rounded text-xs text-center">10</div>
                  <div className="bg-red-400 p-2 rounded text-xs text-center">15</div>
                  <div className="bg-red-600 p-2 rounded text-xs text-center text-white">20</div>
                  
                  {/* High Row */}
                  <div className="text-xs font-medium p-2 rotate-180" style={{writingMode: 'vertical-lr'}}>High</div>
                  <div className="bg-green-200 p-2 rounded text-xs text-center">4</div>
                  <div className="bg-yellow-300 p-2 rounded text-xs text-center">8</div>
                  <div className="bg-orange-400 p-2 rounded text-xs text-center">12</div>
                  <div className="bg-red-500 p-2 rounded text-xs text-center text-white">16</div>
                  
                  {/* Medium Row */}
                  <div className="text-xs font-medium p-2 rotate-180" style={{writingMode: 'vertical-lr'}}>Medium</div>
                  <div className="bg-green-300 p-2 rounded text-xs text-center">3</div>
                  <div className="bg-yellow-200 p-2 rounded text-xs text-center">6</div>
                  <div className="bg-orange-300 p-2 rounded text-xs text-center">9</div>
                  <div className="bg-red-400 p-2 rounded text-xs text-center">12</div>
                </div>
                
                {/* Assessment Stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">23</div>
                    <div className="text-xs text-gray-600">High Risk Devices</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">47</div>
                    <div className="text-xs text-gray-600">Medium Risk</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">156</div>
                    <div className="text-xs text-gray-600">Low Risk</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}