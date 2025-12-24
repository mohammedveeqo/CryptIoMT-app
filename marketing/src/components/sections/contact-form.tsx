"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  CheckCircle,
  User,
  Building2
} from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

interface FormData {
  name: string;
  email: string;
  organization: string;
  phone: string;
  message: string;
  assessmentType: string;
}

export function ContactForm() {
  const { ref: formRef, isVisible: formVisible } = useScrollAnimation();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    organization: '',
    phone: '',
    message: '',
    assessmentType: 'comprehensive'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const formPayload = new FormData(e.currentTarget);
      formPayload.append("access_key", "1e8e421c-c762-4f75-a7e7-54e33ac4e422");
      
      // Add custom subject
      formPayload.append("subject", `New Assessment Request from ${formData.name}`);
      formPayload.append("from_name", "CryptIoMT Marketing Site");

      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formPayload
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        setFormData({
            name: '',
            email: '',
            organization: '',
            phone: '',
            message: '',
            assessmentType: 'comprehensive'
        });
      } else {
        setError(data.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Failed to submit form. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="text-center p-12 bg-white shadow-xl rounded-2xl">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Thank You!</h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                We&apos;ve received your request for a cybersecurity risk assessment. 
                Our team will contact you within 24 hours to discuss your needs.
              </p>
              <div className="pt-6">
                <Button 
                  onClick={() => setIsSubmitted(false)}
                  variant="outline"
                  className="px-8 py-3"
                >
                  Submit Another Request
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="relative py-24 bg-white overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-50 opacity-50 blur-[100px]"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4">
        <div 
          ref={formRef}
          className={`transition-all duration-1000 ${
            formVisible 
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
              Get Started Today
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Request Your Risk Assessment
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ready to secure your healthcare organization? Contact our cybersecurity experts 
              to schedule a comprehensive risk assessment tailored to your needs.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="p-8 bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pb-6">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Schedule Your Assessment
                  </CardTitle>
                  <p className="text-gray-600">
                    Fill out the form below and we&apos;ll contact you within 24 hours to discuss your cybersecurity needs.
                  </p>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name and Email Row */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium text-gray-700">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="John Smith"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="john@hospital.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Organization and Phone Row */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="organization" className="text-sm font-medium text-gray-700">
                          Organization *
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            id="organization"
                            name="organization"
                            required
                            value={formData.organization}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="General Hospital"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="phone" className="text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Assessment Type */}
                    <div className="space-y-2">
                      <label htmlFor="assessmentType" className="text-sm font-medium text-gray-700">
                        Assessment Type *
                      </label>
                      <select
                        id="assessmentType"
                        name="assessmentType"
                        required
                        value={formData.assessmentType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      >
                        <option value="comprehensive">Comprehensive Risk Assessment</option>
                        <option value="device-inventory">Medical Device Inventory Assessment</option>
                        <option value="risk-analysis">Risk Analysis & Framework</option>
                        <option value="security-planning">Cybersecurity Planning & Monitoring</option>
                        <option value="consultation">Initial Consultation</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-sm font-medium text-gray-700">
                        Additional Information
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={formData.message}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                        placeholder="Tell us about your current cybersecurity challenges, number of devices, or specific concerns..."
                      />
                    </div>

                    {/* Submit Button */}
                    {error && (
                      <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-100">
                        {error}
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-4 text-lg font-semibold transform hover:scale-105 transition-all duration-300"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Submitting...</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Send className="h-5 w-5" />
                          <span>Request Assessment</span>
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Information */}
            <div className="space-y-6">
              {/* Contact Details */}
              <Card className="p-6 bg-white/80 backdrop-blur-sm border-gray-200 shadow-lg rounded-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">414-943-9726</div>
                      <div className="text-sm text-gray-600">Mon-Fri 8AM-6PM EST</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Mail className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">assessment@cryptiomt.com</div>
                      <div className="text-sm text-gray-600">24-hour response time</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Nationwide Service</div>
                      <div className="text-sm text-gray-600">On-site assessments available</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Response Time */}
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                <CardContent className="text-center space-y-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Quick Response</h3>
                  <p className="text-sm text-gray-600">
                    We respond to all assessment requests within 24 hours and can typically 
                    schedule on-site visits within 1-2 weeks.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
