import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Server, Users, FileText, AlertTriangle, Clock, Share2, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Privacy Policy - CryptIoMT Healthcare Cybersecurity",
  description: "Privacy policy for CryptIoMT's healthcare cybersecurity consulting services. Learn how we protect your data and maintain HIPAA compliance.",
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Badge 
              variant="outline" 
              className="border-green-200 text-green-700 bg-green-50 px-4 py-2 text-sm font-medium mb-6"
            >
              Data Protection
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Privacy <span className="text-green-600">Policy</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Your privacy and data security are fundamental to our healthcare cybersecurity mission.
            </p>
            <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <Lock className="h-4 w-4" />
              <span>Effective Date: January 1, 2025</span>
              <span className="mx-2">•</span>
              <span>Last Updated: January 1, 2025</span>
            </div>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-12">
              
              {/* 1. Introduction */}
              <Card className="p-8 border-l-4 border-l-green-600">
                <div className="flex items-start space-x-4">
                  <Shield className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      CryptIoMT ("we," "us," "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our cybersecurity risk management platform for medical devices.
                    </p>
                    <p className="text-gray-600 leading-relaxed">
                      By using CryptIoMT, you agree to the collection and use of information in accordance with this policy.
                    </p>
                  </div>
                </div>
              </Card>

              {/* 2. Information We Collect */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Information We Collect</h2>
                <div className="space-y-8">
                  {/* 2.1 Information You Provide */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Users className="h-5 w-5 text-blue-600 mr-2" />
                      2.1 Information You Provide
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 pl-7">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Account Information</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                          <li>Name, email address, phone number</li>
                          <li>Organization name and role</li>
                          <li>Password (encrypted)</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Device Data (Customer Data)</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                          <li>Medical device inventory (manufacturer, model, serial numbers)</li>
                          <li>Network information (IP addresses, subnets, VLANs)</li>
                          <li>Device specifications (OS version, firmware)</li>
                          <li>Risk assessments and classifications</li>
                          <li>Tags, notes, and custom fields</li>
                          <li>User-assigned ownership and department</li>
                        </ul>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                        <h4 className="font-semibold text-gray-900 mb-2">Communication Data</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                          <li>Support requests and correspondence</li>
                          <li>Training session notes</li>
                          <li>Assessment request forms</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* 2.2 Automatically Collected Information */}
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                      <Server className="h-5 w-5 text-purple-600 mr-2" />
                      2.2 Automatically Collected Information
                    </h3>
                    <div className="pl-7 space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Usage Data</h4>
                        <p className="text-gray-600 text-sm mb-2">Login times, features accessed, pages viewed, search queries, and actions taken (filters applied, reports generated).</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Technical Data</h4>
                        <p className="text-gray-600 text-sm mb-2">IP address, browser type and version, device type and operating system, referral source.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Cookies and Tracking</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                          <li>Session cookies (required for functionality)</li>
                          <li>Analytics cookies (optional, can be disabled)</li>
                          <li>Authentication tokens</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. How We Use Your Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. How We Use Your Information</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 text-blue-600">Provide the Service</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                      <li>Authenticate users and manage accounts</li>
                      <li>Display device inventory and risk assessments</li>
                      <li>Generate CVE matches and vulnerability alerts</li>
                      <li>Create reports and compliance documentation</li>
                      <li>Facilitate expert consulting services</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 text-green-600">Improve the Service</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                      <li>Analyze usage patterns to enhance features</li>
                      <li>Identify and fix technical issues</li>
                      <li>Develop new functionality based on user needs</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 text-purple-600">Communicate with You</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                      <li>Send service notifications and alerts</li>
                      <li>Provide technical support</li>
                      <li>Deliver scheduled reports and digests</li>
                      <li>Share security updates and best practices</li>
                    </ul>
                  </div>
                  <div className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 text-red-600">Ensure Security & Compliance</h3>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600 text-sm">
                      <li>Detect and prevent fraud or unauthorized access</li>
                      <li>Monitor for security threats and maintain audit logs</li>
                      <li>Comply with HIPAA, FDA, and other regulations</li>
                      <li>Respond to legal requests and enforce Terms of Service</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 4. Protected Health Information (PHI) */}
              <Card className="p-8 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-4">
                  <Lock className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Protected Health Information (PHI)</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">4.1 HIPAA Compliance</h3>
                        <p className="text-gray-600 mb-2">CryptIoMT may process data that is associated with or references Protected Health Information (PHI) under HIPAA.</p>
                        <div className="bg-white p-4 rounded-lg border border-blue-100">
                          <h4 className="font-semibold text-blue-800 mb-2">Business Associate Agreement (BAA)</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                            <li>Healthcare organizations subject to HIPAA must execute a BAA with CryptIoMT</li>
                            <li>The BAA defines how we handle, protect, and use PHI</li>
                            <li>Contact <a href="mailto:compliance@cryptiomt.com" className="text-blue-600 hover:underline">compliance@cryptiomt.com</a> to request a BAA</li>
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">4.2 PHI Handling</h3>
                        <p className="text-gray-600 mb-2">We implement HIPAA-required safeguards including:</p>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                          <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-2 text-green-500" /> Encryption in transit (TLS 1.2+) and at rest (AES-256)</li>
                          <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-2 text-green-500" /> Access controls and authentication</li>
                          <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-2 text-green-500" /> Audit logging of all PHI access</li>
                          <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-2 text-green-500" /> Regular security risk assessments</li>
                          <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-2 text-green-500" /> Workforce training on PHI handling</li>
                          <li className="flex items-center"><CheckCircle className="h-3 w-3 mr-2 text-green-500" /> Incident response procedures</li>
                        </ul>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">4.3 Minimum Necessary Standard</h3>
                        <p className="text-gray-600">We access and use only the minimum amount of PHI necessary to provide the Service.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 5. How We Share Your Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. How We Share Your Information</h2>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                  <p className="text-yellow-800 font-medium text-center">We do NOT sell your personal information or Customer Data.</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Share2 className="h-5 w-5 text-gray-600 mr-2" />
                      5.1 Service Providers
                    </h3>
                    <p className="text-gray-600 mb-3">We share information with trusted third-party providers who assist in operating the Service:</p>
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-semibold block mb-1">Infrastructure & Hosting</span>
                        <span className="text-gray-600">Convex (database), Cloud providers</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-semibold block mb-1">Authentication</span>
                        <span className="text-gray-600">Clerk (user auth)</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <span className="font-semibold block mb-1">Analytics</span>
                        <span className="text-gray-600">Error tracking & performance tools</span>
                      </div>
                    </div>
                    <p className="text-gray-500 text-sm mt-2 italic">All service providers are contractually obligated to protect your data and use it only for specified purposes.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">5.2 Expert Consultants</h3>
                      <p className="text-gray-600 text-sm">When you engage our expert consulting services, your device data and risk assessments may be shared with CryptIoMT security consultants to provide tailored recommendations.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">5.3 Legal Requirements</h3>
                      <p className="text-gray-600 text-sm">We may disclose information if required by law (court orders, subpoenas), for government investigations, to protect rights/safety, or to enforce our Terms of Service.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">5.4 Business Transfers</h3>
                      <p className="text-gray-600 text-sm">If CryptIoMT is acquired or merged, your information may be transferred to the successor entity. You will be notified of any such change.</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">5.5 With Your Consent</h3>
                      <p className="text-gray-600 text-sm">We may share information for other purposes with your explicit consent.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Data Security */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Data Security</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">6.1 Security Measures</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="border p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Technical Safeguards</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                          <li>Encryption in transit (TLS) and at rest (AES-256)</li>
                          <li>Multi-factor authentication</li>
                          <li>Role-based access controls</li>
                          <li>Regular security patches</li>
                          <li>Intrusion detection</li>
                          <li>Automated backups</li>
                        </ul>
                      </div>
                      <div className="border p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Administrative Safeguards</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                          <li>Security policies and procedures</li>
                          <li>Employee background checks and training</li>
                          <li>Incident response plan</li>
                          <li>Regular risk assessments</li>
                        </ul>
                      </div>
                      <div className="border p-4 rounded-lg">
                        <h4 className="font-bold text-gray-900 mb-2">Physical Safeguards</h4>
                        <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                          <li>Secure data centers with 24/7 monitoring</li>
                          <li>Access controls and surveillance</li>
                          <li>Environmental controls (fire, flood, climate)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                    <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                      <AlertTriangle className="h-5 w-5 mr-2" />
                      6.2 Data Breach Notification
                    </h3>
                    <div className="text-gray-700 text-sm space-y-2">
                      <p>In the event of a data breach involving PHI or personal information:</p>
                      <ul className="list-disc pl-5">
                        <li>We will notify affected users within 72 hours of discovery</li>
                        <li>We will provide details of the breach and remediation steps</li>
                        <li>For PHI breaches, we will comply with HIPAA breach notification requirements</li>
                      </ul>
                      <p className="font-medium mt-2">Report breaches to: <a href="mailto:security@cryptiomt.com" className="text-red-700 hover:underline">security@cryptiomt.com</a></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7. Data Retention */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Data Retention</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Database className="h-4 w-4 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">7.1 Active Accounts</h3>
                    </div>
                    <p className="text-gray-600 text-sm">We retain your information for as long as your account is active or as needed to provide the Service.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Clock className="h-4 w-4 text-orange-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">7.2 Deleted Accounts</h3>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                      <li>Customer Data is retained for 30 days to allow export</li>
                      <li>After 30 days, data is permanently deleted unless legally required</li>
                      <li>Audit logs retained up to 7 years for compliance</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Server className="h-4 w-4 text-purple-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">7.3 Backup Retention</h3>
                    </div>
                    <p className="text-gray-600 text-sm">Backup copies may persist for up to 90 days after deletion.</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <Card className="p-8 bg-green-50 border-green-200">
                <div className="flex items-start space-x-4">
                  <Lock className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
                    <p className="text-gray-600 mb-4">
                      For privacy-related questions, concerns, or to exercise your rights:
                    </p>
                    <div className="grid sm:grid-cols-2 gap-4 text-gray-600">
                      <div>
                        <p className="font-semibold">Privacy Officer</p>
                        <a href="mailto:privacy@cryptiomt.com" className="text-green-700 hover:underline">privacy@cryptiomt.com</a>
                      </div>
                      <div>
                        <p className="font-semibold">General Contact</p>
                        <a href="mailto:contact@cryptiomt.com" className="text-green-700 hover:underline">contact@cryptiomt.com</a>
                      </div>
                      <div>
                        <p className="font-semibold">Security Team</p>
                        <a href="mailto:security@cryptiomt.com" className="text-green-700 hover:underline">security@cryptiomt.com</a>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
