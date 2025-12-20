import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, FileText, AlertTriangle, Scale, UserCheck, Lock, Activity, Ban, Server } from "lucide-react";

export const metadata = {
  title: "Terms of Service - CryptIoMT Healthcare Cybersecurity",
  description: "Terms of Service for CryptIoMT's healthcare cybersecurity consulting services, risk assessments, and IoMT security solutions.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <Badge 
              variant="outline" 
              className="border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium mb-6"
            >
              Legal Information
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Terms of <span className="text-blue-600">Service</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Please read these Terms of Service carefully before using our healthcare cybersecurity platform and services.
            </p>
            <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              <span>Effective Date: January 1, 2025</span>
              <span className="mx-2">•</span>
              <span>Last Updated: January 1, 2025</span>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-12">
              
              {/* 1. Agreement to Terms */}
              <Card className="p-8 border-l-4 border-l-blue-600">
                <div className="flex items-start space-x-4">
                  <Scale className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      These Terms of Service (&quot;Terms&quot;) govern your access to and use of CryptIoMT&apos;s cybersecurity risk management platform (&quot;Service&quot;). By creating an account or using the Service, you agree to these Terms.
                    </p>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization.
                    </p>
                    <p className="font-bold text-red-600">
                      IF YOU DO NOT AGREE TO THESE TERMS, DO NOT USE THE SERVICE.
                    </p>
                  </div>
                </div>
              </Card>

              {/* 2. Service Description */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Service Description</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    CryptIoMT provides a cloud-based platform for managing cybersecurity risks in Internet of Medical Things (IoMT) environments, including:
                  </p>
                  <ul className="grid md:grid-cols-2 gap-3 list-none">
                    <li className="flex items-center"><Activity className="h-4 w-4 text-blue-500 mr-2" /> Medical device inventory and classification</li>
                    <li className="flex items-center"><Activity className="h-4 w-4 text-blue-500 mr-2" /> Vulnerability (CVE) tracking and alerts</li>
                    <li className="flex items-center"><Activity className="h-4 w-4 text-blue-500 mr-2" /> Risk assessment and scoring</li>
                    <li className="flex items-center"><Activity className="h-4 w-4 text-blue-500 mr-2" /> Network topology visualization</li>
                    <li className="flex items-center"><Activity className="h-4 w-4 text-blue-500 mr-2" /> Compliance reporting (HIPAA, NIST, FDA)</li>
                    <li className="flex items-center"><Activity className="h-4 w-4 text-blue-500 mr-2" /> Expert-led consulting services</li>
                  </ul>
                  <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mt-4">
                    <p className="text-sm text-yellow-800 font-semibold">
                      IMPORTANT: CryptIoMT is a security tool, not a medical device. We do not provide medical advice, clinical decision support, or device operation guidance.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Eligibility */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Eligibility</h2>
                <div className="space-y-4 text-gray-600">
                  <p>You must be:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>At least 18 years old</li>
                    <li>Authorized to represent your organization (if applicable)</li>
                    <li>Able to form legally binding contracts</li>
                  </ul>
                </div>
              </div>

              {/* 4. Account Registration */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Account Registration</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center mb-3">
                      <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">4.1 Account Creation</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">You must provide:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li>Accurate and complete information</li>
                      <li>Valid email address</li>
                      <li>Strong password</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Lock className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">4.2 Account Security</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">You are responsible for:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li>Maintaining confidentiality of credentials</li>
                      <li>All activities under your account</li>
                      <li>Notifying us immediately of unauthorized access: <a href="mailto:security@cryptiomt.com" className="text-blue-600">security@cryptiomt.com</a></li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center mb-3">
                      <Shield className="h-5 w-5 text-blue-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">4.3 Account Types</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Access is granted based on role:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li><strong>Super Admin:</strong> Full platform access</li>
                      <li><strong>Admin:</strong> Organization-level management</li>
                      <li><strong>Analyst:</strong> Security operations</li>
                      <li><strong>Customer:</strong> View-only or limited access</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 5. Acceptable Use */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Acceptable Use</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-green-200 bg-green-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-3 flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      5.1 Permitted Use
                    </h3>
                    <ul className="list-disc pl-5 space-y-2 text-green-800 text-sm">
                      <li>Manage medical device inventory</li>
                      <li>Assess cybersecurity risks</li>
                      <li>Track vulnerabilities and compliance</li>
                      <li>Generate reports for audits</li>
                      <li>Collaborate with your team</li>
                    </ul>
                  </div>

                  <div className="border border-red-200 bg-red-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center">
                      <Ban className="h-5 w-5 mr-2" />
                      5.2 Prohibited Use
                    </h3>
                    <p className="text-sm text-red-800 mb-2">You may NOT:</p>
                    <ul className="list-disc pl-5 space-y-2 text-red-800 text-sm">
                      <li>Violate laws or regulations (HIPAA, FDA, etc.)</li>
                      <li>Access another user&apos;s account or data without permission</li>
                      <li>Interfere with Service operation or security</li>
                      <li>Reverse engineer or copy the platform</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* 6. Intellectual Property */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Intellectual Property</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">6.1 Ownership</h3>
                    <p className="text-gray-600">CryptIoMT owns all rights, title, and interest in the Service, including software, design, logos, and algorithms.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">6.2 License</h3>
                    <p className="text-gray-600">We grant you a limited, non-exclusive, non-transferable license to use the Service for your internal business purposes during the subscription term.</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">6.3 Feedback</h3>
                    <p className="text-gray-600">If you provide feedback or suggestions, we may use them without obligation or compensation to you.</p>
                  </div>
                </div>
              </div>

              {/* 7. Confidentiality & Data */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Confidentiality & Data</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Our use of your data is governed by our <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You retain ownership of your Customer Data</li>
                    <li>We protect your data with industry-standard security measures</li>
                    <li>For HIPAA-covered entities, a Business Associate Agreement (BAA) is required</li>
                  </ul>
                </div>
              </div>

              {/* 8. Subscription and Payment */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Subscription and Payment</h2>
                <div className="space-y-4 text-gray-600">
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Fees:</strong> You agree to pay all applicable fees for your subscription plan.</li>
                    <li><strong>Billing:</strong> Fees are billed in advance (monthly or annually).</li>
                    <li><strong>Refunds:</strong> Payments are non-refundable unless required by law.</li>
                    <li><strong>Taxes:</strong> You are responsible for any applicable taxes.</li>
                  </ul>
                </div>
              </div>

              {/* 9. Termination */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Termination</h2>
                <div className="space-y-4 text-gray-600">
                  <p><strong>By You:</strong> You may cancel your account at any time. Access continues until the end of the billing period.</p>
                  <p><strong>By Us:</strong> We may suspend or terminate your account for:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Violation of these Terms</li>
                    <li>Non-payment of fees</li>
                    <li>Legal requirements or security risks</li>
                  </ul>
                </div>
              </div>

              {/* 10. Disclaimers */}
              <Card className="p-8 bg-gray-50 border-gray-200">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-6 w-6 text-gray-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Disclaimers</h2>
                    <div className="space-y-4 text-gray-600 text-sm uppercase">
                      <p>THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND.</p>
                      <p>WE DO NOT GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, SECURE, OR ERROR-FREE.</p>
                      <p>WE ARE NOT RESPONSIBLE FOR THE ACCURACY OF THIRD-PARTY VULNERABILITY DATA (NVD, ETC.).</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 11. Limitation of Liability */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">11. Limitation of Liability</h2>
                <p className="text-gray-600">
                  TO THE FULLEST EXTENT PERMITTED BY LAW, CRYPTIOMT SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES, OR LOSS OF PROFITS OR DATA. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU IN THE 12 MONTHS PRECEDING THE CLAIM.
                </p>
              </div>

              {/* 12. Governing Law */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">12. Governing Law</h2>
                <p className="text-gray-600">
                  These Terms are governed by the laws of the State of [Your State], without regard to conflict of law principles. Any disputes shall be resolved in the courts of [Your County/State].
                </p>
              </div>

              {/* 13. Changes to Terms */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">13. Changes to Terms</h2>
                <p className="text-gray-600">
                  We may modify these Terms at any time. Material changes will be notified via email or platform alert. Continued use constitutes acceptance.
                </p>
              </div>

              {/* 14. Contact Information */}
              <Card className="p-8 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-4">
                  <Server className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Contact Information</h2>
                    <p className="text-gray-600 mb-4">
                      For questions about these Terms of Service:
                    </p>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>CryptIoMT Legal Team</strong></p>
                      <p><strong>Email:</strong> <a href="mailto:contact@cryptiomt.com" className="text-blue-700 hover:underline">contact@cryptiomt.com</a></p>
                      <p><strong>Phone:</strong> 414-943-9726</p>
                      <p><strong>Address:</strong> [Your Business Address]</p>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="text-center text-sm text-gray-500 pt-8 border-t">
                <p>© 2025 CryptIoMT. All rights reserved.</p>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
