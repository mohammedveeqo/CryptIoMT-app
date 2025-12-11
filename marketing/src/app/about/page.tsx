import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Award, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export const metadata = {
  title: "About - CryptIoMT Healthcare Cybersecurity",
  description: "Learn about our expert-led cybersecurity consulting services for healthcare organizations and IoMT environments.",
};

export default function AboutPage() {
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
            <div className="grid lg:grid-cols-2 gap-12 items-center">
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
              <Card className="p-8">
                <div className="text-center">
                  <Shield className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Healthcare-First Approach
                  </h3>
                  <p className="text-gray-600">
                    Unlike generic cybersecurity firms, we understand the unique 
                    challenges of healthcare environments and medical device security.
                  </p>
                </div>
              </Card>
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
              <Card className="p-6 text-center">
                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Clinical Engineering
                </h3>
                <p className="text-gray-600">
                  Deep understanding of medical device operations and healthcare workflows
                </p>
              </Card>
              <Card className="p-6 text-center">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Cybersecurity
                </h3>
                <p className="text-gray-600">
                  Advanced security certifications and proven track record in threat mitigation
                </p>
              </Card>
              <Card className="p-6 text-center">
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

        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Certifications</h2>
              <p className="text-lg text-gray-600">CISSP Certified</p>
            </div>
            <Card className="p-6">
              <div className="flex items-center gap-8 justify-center">
                <div className="relative h-24 w-24 rounded-2xl bg-[#0f6a55] flex-shrink-0">
                  <div className="absolute top-2 left-3 text-[11px] font-semibold text-white/90">ISC2</div>
                  <div className="h-full w-full flex items-end justify-start p-4">
                    <span className="text-white font-bold text-lg leading-none">CISSP</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-lg font-semibold text-gray-900">Certified Information Systems Security Professional</p>
                  <p className="text-sm text-gray-500">Issued by ISC2</p>
                  <Link
                    href="https://www.credly.com/badges/ffbe391c-d251-4158-86be-b99c86c64a18/public_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 hover:border-blue-300"
                  >
                    Verify
                  </Link>
                </div>
              </div>
            </Card>
         </div>
       </section>
      </main>
      <Footer />
    </>
  );
}
