"use client";

import { Mail, Phone, CheckCircle } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-6">
            <Logo size="md" />
            <p className="text-gray-600 text-sm leading-relaxed max-w-xs">
              Expert cybersecurity consulting for healthcare organizations and IoMT environments.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>contact@cryptiomt.com</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>414-943-9726</span>
              </div>
              <div className="pt-2">
                <a
                  href="https://www.credly.com/badges/ffbe391c-d251-4158-86be-b99c86c64a18/public_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <div className="border border-gray-200 rounded-2xl p-5 flex items-center justify-between gap-6 hover:border-blue-300 transition w-full max-w-[520px] shadow-sm">
                    <div className="flex items-center gap-6">
                      <div className="relative h-20 w-20 rounded-2xl bg-[#0f6a55] flex-shrink-0">
                        <div className="absolute top-1 left-2 text-[10px] font-semibold text-white/90">ISC2</div>
                        <div className="h-full w-full flex items-end justify-start p-3">
                          <span className="text-white font-bold text-base leading-none">CISSP</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-900">CISSP Certified</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1"><CheckCircle className="h-4 w-4 text-green-600" /> Verified on Credly</p>
                      </div>
                    </div>
                    <span className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700">Verify</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <button 
                  onClick={() => scrollToSection("risk-assessment")}
                  className="hover:text-blue-600 transition-colors"
                >
                  Risk Assessment
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("services")}
                  className="hover:text-blue-600 transition-colors"
                >
                  Security Planning
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("services")}
                  className="hover:text-blue-600 transition-colors"
                >
                  Ongoing Support
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("services")}
                  className="hover:text-blue-600 transition-colors"
                >
                  Staff Training
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <button 
                  onClick={() => scrollToSection("about")}
                  className="hover:text-blue-600 transition-colors"
                >
                  About Us
                </button>
              </li>
              <li>
                <button 
                  onClick={() => scrollToSection("contact")}
                  className="hover:text-blue-600 transition-colors"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Get Started</h3>
            <p className="text-sm text-gray-600 mb-4">
              Ready to secure your healthcare organization?
            </p>
            <button
              onClick={() => scrollToSection("contact")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Request Assessment
            </button>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © 2025 CryptIoMT. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link 
                href="/privacy"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link 
                href="/terms"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
