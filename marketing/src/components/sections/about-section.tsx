"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Award, CheckCircle } from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";
import Image from "next/image";

export function AboutSection() {
  const { ref: sectionRef, isVisible: sectionVisible } = useScrollAnimation();

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Badge 
            variant="outline" 
            className="border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium mb-6"
          >
            Expert Healthcare Cybersecurity
          </Badge>
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            About <span className="text-blue-600">CryptIoMT</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            We are Clinical Engineering Professionals with globally recognized security 
            certifications, providing expert-led cybersecurity consulting specifically 
            designed for healthcare organizations and IoMT environments.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div 
            ref={sectionRef}
            className={`grid lg:grid-cols-2 gap-12 items-center transition-all duration-1000 ${
              sectionVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Our Mission
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                To protect patients and healthcare organizations by securing connected 
                medical devices through comprehensive risk assessments, expert guidance, 
                and industry-leading cybersecurity practices.
              </p>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">NIST Framework Aligned</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">HIPAA Compliant Solutions</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-gray-700">Clinical Engineering Expertise</span>
                </div>
              </div>
            </div>
            <div className="relative">
              {/* Team Photo */}
              <div className="relative overflow-hidden rounded-2xl shadow-xl">
                <Image
                  src="/images/team-photo.jpg"
                  alt="CryptIoMT cybersecurity team - Clinical Engineering Professionals"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority={false}
                />
                {/* Professional Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
                
                {/* Floating Badge */}
                <div className="absolute bottom-6 left-6 right-6">
                  <Card className="p-4 bg-white/95 backdrop-blur-sm border-0 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                          Expert Team
                        </h3>
                        <p className="text-sm text-gray-600">
                          Clinical Engineering Professionals with globally recognized security certifications
                        </p>
                      </div>
                      <Shield className="h-8 w-8 text-blue-600" />
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Expertise
            </h2>
            <p className="text-lg text-gray-600">
              Specialized knowledge in healthcare cybersecurity and medical device security
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Clinical Engineering
              </h3>
              <p className="text-gray-600">
                Deep understanding of medical device operations and healthcare workflows
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Cybersecurity
              </h3>
              <p className="text-gray-600">
                Advanced security certifications and proven track record in threat mitigation
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-lg transition-shadow">
              <Award className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Compliance
              </h3>
              <p className="text-gray-600">
                Expert knowledge of HIPAA, FDA, and other healthcare regulatory requirements
              </p>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}