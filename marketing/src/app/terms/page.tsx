import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield, FileText, AlertTriangle } from "lucide-react";

export const metadata = {
  title: "Terms and Conditions - CryptIoMT Healthcare Cybersecurity",
  description: "Terms and conditions for CryptIoMT's healthcare cybersecurity consulting services, risk assessments, and IoMT security solutions.",
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
              Terms and <span className="text-blue-600">Conditions</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Please read these terms and conditions carefully before using our healthcare cybersecurity consulting services.
            </p>
            <div className="mt-8 flex items-center justify-center space-x-4 text-sm text-gray-500">
              <FileText className="h-4 w-4" />
              <span>Last updated: January 2025</span>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <div className="space-y-12">
              
              {/* Introduction */}
              <Card className="p-8 border-l-4 border-l-blue-600">
                <div className="flex items-start space-x-4">
                  <Shield className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Introduction</h2>
                    <p className="text-gray-600 leading-relaxed">
                      These Terms and Conditions (&quot;Terms&quot;) govern your use of CryptIoMT&apos;s healthcare cybersecurity consulting services, including medical device risk assessments, cybersecurity planning, and IoMT security solutions. By engaging our services, you agree to be bound by these Terms.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Services Definition */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Services Provided</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    CryptIoMT provides specialized cybersecurity consulting services for healthcare organizations, including but not limited to:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li><strong>Medical Device Inventory:</strong> Complete discovery and classification of IoMT devices in your network</li>
                    <li><strong>Risk Analysis & Assessment:</strong> NIST-aligned risk evaluation prioritizing life-critical medical devices</li>
                    <li><strong>Cybersecurity Planning:</strong> Tailored security strategies that protect patients without disrupting care</li>
                    <li><strong>Ongoing Support:</strong> Continuous monitoring and security control implementation</li>
                    <li><strong>Staff Training:</strong> Healthcare-specific cybersecurity education and awareness programs</li>
                  </ul>
                </div>
              </div>

              {/* Professional Standards */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">2. Professional Standards</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Our services are provided by Clinical Engineering Professionals with globally recognized security certifications. All assessments and recommendations are:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>NIST Framework Aligned (SP 800-37, Risk Management Framework)</li>
                    <li>HIPAA Compliant</li>
                    <li>FDA Aligned for medical device security</li>
                    <li>Based on industry best practices and clinical engineering expertise</li>
                  </ul>
                </div>
              </div>

              {/* Client Responsibilities */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Client Responsibilities</h2>
                <div className="space-y-4 text-gray-600">
                  <p>To ensure effective service delivery, clients agree to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Provide accurate and complete information about their healthcare environment</li>
                    <li>Grant necessary access to systems and personnel for assessments</li>
                    <li>Maintain confidentiality of assessment methodologies and proprietary information</li>
                    <li>Implement recommended security controls in a timely manner</li>
                    <li>Notify CryptIoMT of any significant changes to their IoMT environment</li>
                  </ul>
                </div>
              </div>

              {/* Confidentiality */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Confidentiality and Data Protection</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    CryptIoMT maintains strict confidentiality standards and HIPAA compliance:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All client information is treated as confidential and protected under HIPAA regulations</li>
                    <li>Data Privacy Impact Assessments (PIA) are conducted for all IoMT devices</li>
                    <li>Client data is never shared with third parties without explicit consent</li>
                    <li>All personnel sign confidentiality agreements and undergo background checks</li>
                    <li>Assessment reports are encrypted and securely transmitted</li>
                  </ul>
                </div>
              </div>

              {/* Pricing and Payment */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Pricing and Payment Terms</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Our comprehensive risk assessments start at $5,000, with typical ROI of 300%+ in the first year:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Pricing is based on scope, complexity, and number of devices assessed</li>
                    <li>Payment terms are Net 30 days from invoice date</li>
                    <li>Typical assessments require 2-3 days on-site with reports delivered within 1 week</li>
                    <li>Additional services are billed at agreed-upon rates</li>
                    <li>Travel expenses may apply for on-site assessments</li>
                  </ul>
                </div>
              </div>

              {/* Limitations of Liability */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Limitations of Liability</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    While CryptIoMT provides expert guidance based on industry best practices:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Our assessments are based on information available at the time of evaluation</li>
                    <li>Cybersecurity is an ongoing process requiring continuous monitoring and updates</li>
                    <li>Implementation of recommendations remains the client&apos;s responsibility</li>
                    <li>CryptIoMT&apos;s liability is limited to the fees paid for services rendered</li>
                    <li>We do not guarantee protection against all possible cyber threats</li>
                  </ul>
                </div>
              </div>

              {/* Intellectual Property */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">7. Intellectual Property</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    CryptIoMT retains ownership of:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Assessment methodologies and proprietary frameworks</li>
                    <li>Software tools and analysis techniques</li>
                    <li>Template documents and reporting formats</li>
                    <li>Training materials and educational content</li>
                  </ul>
                  <p className="mt-4">
                    Clients receive a license to use assessment reports and recommendations for their internal cybersecurity purposes only.
                  </p>
                </div>
              </div>

              {/* Termination */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">8. Termination</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Either party may terminate services with 30 days written notice. Upon termination:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>All outstanding fees become immediately due</li>
                    <li>Confidentiality obligations continue indefinitely</li>
                    <li>Client retains rights to completed assessment reports</li>
                    <li>CryptIoMT will securely destroy client data as requested</li>
                  </ul>
                </div>
              </div>

              {/* Governing Law */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">9. Governing Law</h2>
                <div className="space-y-4 text-gray-600">
                  <p>
                    These Terms are governed by applicable healthcare regulations including HIPAA, and federal cybersecurity frameworks including NIST. Any disputes will be resolved through professional arbitration.
                  </p>
                </div>
              </div>

              {/* Contact Information */}
              <Card className="p-8 bg-blue-50 border-blue-200">
                <div className="flex items-start space-x-4">
                  <AlertTriangle className="h-6 w-6 text-blue-600 mt-1" />
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Information</h2>
                    <p className="text-gray-600 mb-4">
                      For questions about these Terms and Conditions, please contact us:
                    </p>
                    <div className="space-y-2 text-gray-600">
                      <p><strong>Email:</strong> contact@cryptiomt.com</p>
                      <p><strong>Phone:</strong> 414-943-9726</p>
                      <p><strong>Assessment Inquiries:</strong> assessment@cryptiomt.com</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Updates Notice */}
              <div className="text-center py-8 border-t border-gray-200">
                <p className="text-sm text-gray-500">
                  CryptIoMT reserves the right to update these Terms and Conditions. 
                  Clients will be notified of material changes via email.
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
