"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Hospital, User, Wind, AlertTriangle, Activity, Brain, Bed, Heart, Wifi } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
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
              <span>Expert-led Clinical Engineering Professionals</span>
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
                <div className="text-3xl font-bold text-blue-600">10k+</div>
                <div className="text-sm text-gray-600">Devices Secured</div>
              </div>
              <div className="text-center transform hover:scale-105 transition-transform duration-300">
                <div className="text-3xl font-bold text-green-600">HIPAA</div>
                <div className="text-sm text-gray-600">NIST & FDA Aligned</div>
              </div>
              <div className="text-center transform hover:scale-105 transition-transform duration-300">
                <a 
                  href="https://www.credly.com/org/isc2/badge/certified-information-systems-security-professional-cissp#:~:text=The%20vendor%2Dneutral%20CISSP%20credential,an%20increasingly%20complex%20cyber%20world" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex flex-col items-center group"
                >
                  <div className="mb-2 transform group-hover:scale-110 transition-transform duration-300">
                    <Image
                      src="/images/ISC2_CISSP.webp"
                      alt="ISC2 CISSP Badge"
                      width={64}
                      height={64}
                      className="w-16 h-16 object-contain"
                    />
                  </div>
                  <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">CISSP Certified</div>
                  <div className="text-sm text-gray-600">Globally Recognized</div>
                </a>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className={`flex flex-col sm:flex-row gap-4 pt-4 transition-all duration-1000 delay-700 ${
              heroVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300" asChild>
                <Link href="#contact">
                  Get Risk Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
          
          {/* Right Column - Smart Hospital Room Image */}
          <div className={`relative transition-all duration-1000 delay-400 ${
            heroVisible 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-8'
          }`}>
            <div className="relative">
              {/* Main Hospital Room Image */}
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="/images/smart-hospital-room.jpg"
                  alt="Smart hospital room with connected medical devices and cybersecurity monitoring"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
                
                {/* Overlay with Security Status */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Smart Hospital Room</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-red-600">5 Devices at Risk</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        Connected medical devices require continuous cybersecurity monitoring
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Security Alert */}
              <div className={`absolute -top-4 -right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse transition-all duration-1000 delay-1000 ${
                heroVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-4'
              }`}>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="text-sm font-bold">Critical Threats Detected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}