import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, Lock, Eye, Database } from "lucide-react";

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
              <span>Last updated: January 2025</span>
            </div>
          </div>
        </section>

        {/* Privacy Content */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-12">
              
              {/* Introduction */}
              <Card className="p-8 border-l-4 border-l-green-600">
                <div className="flex items-start space-x-4">
                  <Shield className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Privacy</h2>
                    <p className="text-gray-600 leading-relaxed">
                      CryptIoMT is committed to protecting the privacy and security of all information entrusted to us. As healthcare cybersecurity professionals, we understand the critical importance of data protection and maintain the highest standards of confidentiality and HIPAA compliance.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Information We Collect */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Information We Collect</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Eye className="h-5 w-5 text-blue-600 mr-2" />
                      Contact Information
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-gray-600">
                      <li>Name, title, and organization</li>
                      <li>Email address and phone number</li>
                      <li>Business address and contact preferences</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <Database className="h-5 w-5 text-purple-600 mr-2" />
                      Assessment Data
                    </h3>
                    <ul className="list-disc pl-6 space-y-2 text-gray-600">
                      <li>Medical device inventory and network configurations</li>
                      <li>Risk assessment findings and vulnerability data</li>
                      <li>System logs and security event information</li>
                      <li>Organizational policies and procedures</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* How We Use Information */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. How We Use Your Information</h2>
                <div className="space-y-4 text-gray-600">
                  <p>We use collected information solely for legitimate business purposes:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Service Delivery:</strong> Conducting risk assessments, security planning, and ongoing support</li>
                    <li><strong>Communication:</strong> Providing updates, reports, and responding to inquiries</li>
                    <li><strong>Compliance:</strong> Meeting regulatory requirements including HIPAA, NIST, and FDA guidelines</li>
                    <li><strong>Quality Improvement:</strong> Enhancing our methodologies and service offerings</li>
                    <li><strong>Legal Obligations:</strong> Complying with applicable laws and regulations</li>
                  </ul>
                </div>
              </div>

              {/* HIPAA Compliance */}
              <Card className="p-8 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-4">
                  <Shield className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">3. HIPAA Compliance & Healthcare Data</h2>
                    <div className="space-y-4 text-gray-600">
                      <p>
                        As healthcare cybersecurity consultants, we are committed to HIPAA compliance:
                      </p>
                      <ul className="list-disc pl-6 space-y-2">
                        <li>All personnel undergo HIPAA training and sign Business Associate Agreements</li>
                        <li>Protected Health Information (PHI) is handled according to HIPAA standards</li>
                        <li>Data Privacy Impact Assessments (PIA) are conducted for all IoMT devices</li>
                        <li>Minimum necessary standard is applied to all data access</li>
                        <li>Breach notification procedures are in place and tested regularly</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Data Security */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Data Security Measures</h2>
                <div className="space-y-4 text-gray-600">
                  <p>We implement comprehensive security controls to protect your information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Encryption:</strong> All data is encrypted in transit and at rest using industry-standard protocols</li>
                    <li><strong>Access Controls:</strong> Role-based access with multi-factor authentication</li>
                    <li><strong>Network Security:</strong> Firewalls, intrusion detection, and secure VPN connections</li>
                    <li><strong>Physical Security:</strong> Secure facilities with controlled access and monitoring</li>
                    <li><strong>Regular Audits:</strong> Continuous monitoring and third-party security assessments</li>
                    <li><strong>Incident Response:</strong> 24/7 monitoring with rapid response procedures</li>
                  </ul>
                </div>
              </div>

              {/* Data Sharing */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Information Sharing</h2>
                <div className="space-y-4 text-gray-600">
                  <p>We do not sell, rent, or share your information except in these limited circumstances:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>With Your Consent:</strong> When you explicitly authorize information sharing</li>
                    <li><strong>Service Providers:</strong> Trusted partners who assist in service delivery (under strict confidentiality agreements)</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or regulatory authority</li>
                    <li><strong>Business Transfers:</strong> In the event of a merger or acquisition (with continued privacy protections)</li>
                  </ul>
                </div>
              </div>

              {/* Data Retention */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Data Retention</h2>
                <div className="space-y-4 text-gray-600">
                  <p>We retain information only as long as necessary:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Assessment Data:</strong> Retained for 7 years or as required by healthcare regulations</li>
                    <li><strong>Contact Information:</strong> Maintained while business relationship exists</li>
                    <li><strong>Legal Hold:</strong> Extended retention when required for legal proceedings</li>
                    <li><strong>Secure Disposal:</strong> All data is securely destroyed when retention period expires</li>
                  </ul>
                </div>
              </div>

              {/* Your Rights */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Your Privacy Rights</h2>
                <div className="space-y-4 text-gray-600">
                  <p>You have the following rights regarding your personal information:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Access:</strong> Request copies of your personal information</li>
                    <li><strong>Correction:</strong> Request correction of inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your information (subject to legal requirements)</li>
                    <li><strong>Portability:</strong> Request transfer of your data to another organization</li>
                    <li><strong>Restriction:</strong> Request limitation of processing activities</li>
                    <li><strong>Objection:</strong> Object to certain types of data processing</li>
                  </ul>
                </div>
              </div>

              {/* Cookies and Tracking */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Cookies and Website Analytics</h2>
                <div className="space-y-4 text-gray-600">
                  <p>Our website uses minimal tracking technologies:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                    <li><strong>Analytics:</strong> Anonymous usage statistics to improve our services</li>
                    <li><strong>No Third-Party Tracking:</strong> We do not use advertising or social media tracking</li>
                    <li><strong>Cookie Control:</strong> You can disable cookies through your browser settings</li>
                  </ul>
                </div>
              </div>

              {/* International Transfers */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. International Data Transfers</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    All data processing occurs within secure, HIPAA-compliant facilities. If international transfers are necessary, we ensure:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Adequate protection through approved transfer mechanisms</li>
                    <li>Contractual safeguards with international partners</li>
                    <li>Compliance with applicable data protection laws</li>
                    <li>Client notification and consent when required</li>
                  </ul>
                </div>
              </div>

              {/* Contact Information */}
              <Card className="p-8 bg-green-50 border-green-200">
                <div className="flex items-start space-x-4">
                  <Lock className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us About Privacy</h2>
                    <p className="text-gray-600 mb-4">
                      For privacy-related questions, concerns, or to exercise your rights:
                    </p>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Privacy Officer:</strong> privacy@cryptiomt.com</p>
                      <p><strong>General Contact:</strong> contact@cryptiomt.com</p>
                      <p><strong>Phone:</strong> (555) 123-4567</p>
                      <p><strong>Response Time:</strong> We respond to privacy inquiries within 48 hours</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Updates Notice */}
              <div className="text-center py-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  This Privacy Policy may be updated to reflect changes in our practices or legal requirements. 
                  We will notify you of material changes via email and post updates on our website.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}