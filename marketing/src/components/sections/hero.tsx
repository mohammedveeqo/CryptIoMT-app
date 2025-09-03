"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Hospital, User, Wind, AlertTriangle, Activity, Brain, Bed, Heart, Wifi, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

export function Hero() {
  const { ref: heroRef, isVisible: heroVisible } = useScrollAnimation();
  
  return (
    <section className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 pt-20 pb-16">
      <div className="container px-4 max-w-6xl mx-auto">
        <div ref={heroRef} className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div className={`space-y-8 transition-all duration-1000 ease-out ${
            heroVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}>
            {/* Trust Badge */}
            <div className={`inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-700 delay-200 ${
              heroVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}>
              <Hospital className="h-4 w-4" />
              <span>Expert-led Clinical Engineering Professionalss</span>
            </div>
            
            {/* Main Heading */}
            <div className={`space-y-6 transition-all duration-1000 delay-300 ${
              heroVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                IoMT 
                <span className="text-blue-600 block">Healthcare</span>
                <span className="text-blue-600 block">Cybersecurity</span>
                <span className="text-gray-700 text-3xl md:text-4xl font-medium block mt-2">
                  That Protects Patients
                </span>
                <span className="text-gray-700 text-3xl md:text-4xl font-medium block">
                  & Connected Devices
                </span>
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                Expert-led risk assessments for medical devices by Clinical Engineering 
                Professionals with globally recognized security certifications, education, & experience
              </p>
              
              {/* Personal Expertise Line */}
              <p className="text-lg text-blue-700 font-medium">
                We work directly with hospitals and vendors to secure 
                connected medical devices across all departments.
              </p>
            </div>
            
            {/* Key Stats - Consultant Focused */}
            <div className={`grid grid-cols-3 gap-4 py-6 transition-all duration-1000 delay-500 ${
              heroVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}>
              <div className="text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-blue-600">20+</div>
                <div className="text-sm text-gray-600">Hospital Systems Secured</div>
              </div>
              <div className="text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-green-600">HIPAA</div>
                <div className="text-sm text-gray-600">NIST & FDA Aligned</div>
              </div>
              <div className="text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-gray-600">Risk Visibility</div>
              </div>
            </div>
            
            {/* CTA Buttons */}

            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-1000 delay-700 ${
              heroVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300" asChild>
                <Link href="#contact">
                  🔒 Get Risk Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <div className="flex gap-2">
                <Button size="lg" variant="outline" className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-6 py-4 text-lg transform hover:scale-105 transition-all duration-300" asChild>
                  <a href="https://app.cryptiomt.com/login" target="_blank" rel="noopener noreferrer">
                    <LogIn className="mr-2 h-5 w-5" />
                    Login
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-green-600 text-green-600 hover:bg-green-50 px-6 py-4 text-lg transform hover:scale-105 transition-all duration-300" asChild>
                  <a href="https://app.cryptiomt.com/signup" target="_blank" rel="noopener noreferrer">
                    <UserPlus className="mr-2 h-5 w-5" />
                    Sign Up
                  </a>
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right Column - Hospital Device Risk Diagram */}
          <div className={`relative transition-all duration-1000 delay-400 ${
            heroVisible 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-8'
          }`}>
            <Card className="p-8 bg-white border border-gray-200 shadow-xl rounded-2xl transform hover:shadow-2xl transition-all duration-500">
              <div className="space-y-6">
                {/* Header with Expert Profile */}
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-red-700">Hidden Risks in Hospital Devices</h3>
                    <p className="text-sm text-gray-600">Cyber threats hiding in your medical equipment</p>
                  </div>
                  {/* Expert Profile Element */}
                  <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-gray-900">Expert Analysis</div>
                      <div className="text-gray-600">Cybersecurity Specialist</div>
                    </div>
                  </div>
                </div>
                
                {/* Device Grid */}
                <div className="grid grid-cols-3 gap-6 py-4">
                  {/* Ventilator */}
                  <div className="relative group">
                    <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto group-hover:bg-blue-200 transition-colors">
                      <Wind className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700">Ventilator</div>
                    </div>
                    {/* Risk Indicator */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Infusion Pump */}
                  <div className="relative group">
                    <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto group-hover:bg-green-200 transition-colors">
                      <Activity className="h-8 w-8 text-green-600" />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700">Infusion Pump</div>
                    </div>
                    {/* Risk Indicator */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* MRI Machine */}
                  <div className="relative group">
                    <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto group-hover:bg-purple-200 transition-colors">
                      <Brain className="h-8 w-8 text-purple-600" />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700">MRI System</div>
                    </div>
                    {/* Risk Indicator */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Smart Bed */}
                  <div className="relative group">
                    <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto group-hover:bg-indigo-200 transition-colors">
                      <Bed className="h-8 w-8 text-indigo-600" />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700">Smart Bed</div>
                    </div>
                    {/* Risk Indicator */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* Patient Monitor */}
                  <div className="relative group">
                    <div className="w-16 h-16 bg-red-100 rounded-xl flex items-center justify-center mx-auto group-hover:bg-red-200 transition-colors">
                      <Heart className="h-8 w-8 text-red-600" />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700">Patient Monitor</div>
                    </div>
                    {/* Risk Indicator */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  </div>

                  {/* HVAC System */}
                  <div className="relative group">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center mx-auto group-hover:bg-gray-200 transition-colors">
                      <Wifi className="h-8 w-8 text-gray-600" />
                    </div>
                    <div className="text-center mt-2">
                      <div className="text-xs font-medium text-gray-700">HVAC System</div>
                    </div>
                    {/* Risk Indicator */}
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="h-3 w-3 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Risk Legend */}
                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-center space-x-6 text-xs">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-gray-600">Critical Risk</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span className="text-gray-600">Medium Risk</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span className="text-gray-600">Low Risk</span>
                    </div>
                  </div>
                </div>
                
                {/* Network Connection Lines */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Subtle connecting lines between devices */}
                  <svg className="w-full h-full opacity-10">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#EF4444" strokeWidth="0.5" strokeDasharray="2,2"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              </div>
            </Card>
            
            {/* Floating Alert - More Urgent */}
            <div className={`absolute -bottom-4 -right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse transition-all duration-1000 delay-1000 ${
              heroVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-bold">5 Critical Threats Found</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


<div className="grid grid-cols-3 gap-4 py-6">
  <div className="text-center">
    <div className="text-3xl font-bold text-red-600">300%</div>
    <div className="text-sm text-gray-600">Increase in Healthcare Cyberattacks</div>
  </div>
  <div className="text-center">
    <div className="text-3xl font-bold text-blue-600">89%</div>
    <div className="text-sm text-gray-600">Devices Run Outdated Software</div>
  </div>
  <div className="text-center">
    <div className="text-3xl font-bold text-orange-600">$10M</div>
    <div className="text-sm text-gray-600">Average Ransomware Cost</div>
  </div>
</div>