"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  FileText, 
  ArrowRight,
  CheckCircle,
  Search,
  Settings,
  BarChart3,
  X,
  Briefcase,
  GraduationCap,
  FileCheck,
  UserCheck,
  Lock
} from "lucide-react";
import Image from "next/image";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";
import { useState } from "react";

const services = [
  {
    icon: Search,
    title: "Medical Device Inventory Assessment & Classification/Categorization",
    description: "An accurate discovery and inventory of IoMT assets allows for alignment to an organization's security goals and objectives.",
    features: [
      "Identification of IoMT devices", 
      "IoMT Enumeration", 
      "Qualitative Asset Valuation",
      "Asset Privacy Impact Assessment (PIA)"
    ],
    color: "from-blue-500 to-cyan-500",
    detailedDescription: [
      "When implementing a comprehensive cybersecurity IoMT asset management program, a detailed inventory of networked and networkable devices must be developed. This may require a physical inventory that may include the documentation of IP and MAC addresses, operating system, software versions and device types.",
      "Existing Computerized Maintenance Management Systems (CMMS) data extract are ingested, and data is normalized so that qualitative or quantitative asset valuations can take place. The integration of asset valuation into a Clinical Engineering's IoMT program allows for the prioritization assets based on criticality, value and potential business impact.",
      "This ensures that Clinical Engineering resources are directed to interrogate IoMT devices with a high financial, patient care, and operational impact. A Data Privacy Impact Assessment (PIA) type assessment is conducted against IoMT devices to further identify, evaluate potential privacy risks while ensuring security mandates from regulatory bodies like the Health Insurance Portability and Accountability Act (HIPAA) are understood."
    ]
  },
  {
    icon: BarChart3,
    title: "Medical Device Risk Analysis & Risk Framework NIST SP 800-37",
    description: "Systematic evaluation of IoMT assets to understand potential threats, vulnerabilities, impact, & probability/likelihood.",
    features: [
      "Prioritize life-critical devices", 
      "HIPAA, NIST & FDA aligned", 
      "Business Impact Analysis (BIA)",
      "Risk Management Framework (RMF)"
    ],
    color: "from-purple-500 to-violet-500",
    detailedDescription: [
      "Upon a thorough inventory of networked and networkable medical devices, a security risk analysis should be conducted to assess and prioritize risk while leveraging the qualitative/quantitative report and Privacy Impact Assessment. These perquisites are instrumental in formulating a Business Impact Analysis (BIA) that will aid in the identification of valuable assets, potential threats and vulnerabilities.",
      "The BIA will help determine the likelihood of threat exploitation and potential impact to the organization driving informed decision-making and prioritization of resources to reduce risk to an acceptable level minimizing disruption of critical business functions.",
      "The Risk Analysis is accomplished by leveraging industry standardized methodologies utilized in Information systems organizations such as, NIST SP 800-37, Risk Management Frameworks (RFM) developed by the National Institute of Standards and Technology (NIST). This helps align the medical device security program with methodologies that Information Security teams and Organizational Governance such as CISO's understand.",
      "Risk Management Frameworks allow proactive security, risk-based decision making, compliance support (HIPAA, NIST & FDA alignment), and continuous monitoring."
    ]
  },
  {
    icon: Settings,
    title: "Customized Cybersecurity Planning & Monitoring",
    description: "Tailored security strategies that align with your workflows and compliance requirements — protecting patients without slowing down care.",
    features: [
      "Step-by-step roadmaps", 
      "Mitigate & Implement security controls", 
      "Patching, Antivirus, Access controls",
      "MDS2 adherence & Cyber Hygiene"
    ],
    color: "from-green-500 to-emerald-500",
    detailedDescription: [
      "Upon completion of a Medical Device Inventory Classification/Categorization and Medical Device Risk Analysis, one must codify findings to create a customized cybersecurity plan to meet the hospital's inherit security standards in a cost-effective yet effective manner so that security resources are allocated intelligently.",
      "Previously completed analytics have brought visibility and should ensure security of the medical device throughout the product lifecycle. Security gaps such as lack of patching or security updates are identified and compensating controls such as firewall rules and segmentation based on vendor recommendations can be enforced.",
      "Manufacturer Disclosure Statement for Medical Device Security (MDS2) forms developed by NENA are provided by healthcare manufacturers for healthcare organizations with information about the medical device's security features and capabilities will be incorporated as a part of the security control process. MDS2's inform healthcare organizations about a medical device's security controls, such as patch management, encryption, and remote access, to help them evaluate risks and make informed purchasing decisions.",
      "Cyber Hygiene guidelines will be shared advising on the implementation of strong passwords, access controls, network segmentation, and regular software updates. Risk Management consisting of regularly scheduled risk audits on medical devices will be presented as part of a continuous postmarked surveillance protocol.",
      "A Medical Device Cybersecurity Plan will be developed to ensure that monitoring or predefine risk controls is effective and updates to these controls take place as needed. A patching cadence will be established for medical devices identified with high asset valuation as determined by the qualitative/quantitative findings. A well-executed Comprehensive Healthcare IoMT Cybersecurity program is crucial in ensuring patients are protected from harm, ensuring data privacy, and maintaining the availability of healthcare services."
    ]
  }
];

const additionalServices = [
  {
    icon: Briefcase,
    title: "Biomedical Project Management",
    description: "Project Management oversight for complex Biomedical or Diagnostic Imaging network connected systems.",
    features: [
      "Project Management oversight for complex Biomedical or Diagnostic Imaging network connected systems",
      "Hospital-wide upgrades or new equipment deployments",
      "Project Management methodologies and frameworks are utilized"
    ],
    color: "from-indigo-500 to-indigo-600",
    detailedDescription: [
      "Our biomedical project management services provide comprehensive oversight for complex healthcare technology implementations. We specialize in managing large-scale biomedical and diagnostic imaging system deployments, ensuring seamless integration with existing hospital networks and workflows.",
      "Our experienced project managers utilize industry-standard methodologies and frameworks to deliver projects on time, within budget, and to specification, while maintaining the highest standards of patient safety and regulatory compliance."
    ]
  },
  {
    icon: GraduationCap,
    title: "Clinical Engineering IT Education",
    description: "Clinical Engineering tailored IT network education as it relates to medical equipment connectivity.",
    features: [
      "Clinical Engineering tailored IT network education as it relates to medical equipment connectivity",
      "PACS IT Networking and troubleshooting",
      "Entry-level Clinical Engineering Networking principles"
    ],
    color: "from-teal-500 to-teal-600",
    detailedDescription: [
      "We provide specialized education programs designed specifically for clinical engineering professionals who need to understand IT networking in the context of medical device connectivity. Our curriculum covers essential networking concepts, PACS system integration, troubleshooting methodologies, and best practices for maintaining secure and reliable medical device networks.",
      "These educational programs bridge the gap between traditional clinical engineering skills and modern IT networking requirements."
    ]
  },
  {
    icon: FileCheck,
    title: "Biomedical / IT Service Level Agreements",
    description: "Drafting of SLA's as they relate to the identification of service and responsibilities associated with CE, IT, Operations or Facilities Management.",
    features: [
      "Drafting of SLA's as they relate to the identification of service and responsibilities associated with CE, IT, Operations or Facilities Management"
    ],
    color: "from-rose-500 to-rose-600",
    detailedDescription: [
      "Our service level agreement development ensures clear definition of roles, responsibilities, and performance expectations between clinical engineering, IT, operations, and facilities management teams.",
      "We create comprehensive SLAs that establish accountability frameworks, response time requirements, escalation procedures, and performance metrics specific to biomedical and IT service delivery in healthcare environments."
    ]
  },
  {
    icon: UserCheck,
    title: "Clinical Engineering IT Consulting",
    description: "Strategic planning and cost control while improving performance and regulatory compliance.",
    features: [
      "Strategic planning and cost control while improving performance and regulatory compliance",
      "Temporary Clinical Engineering Director or Managerial oversight due to leadership staff turnover"
    ],
    color: "from-amber-500 to-amber-600",
    detailedDescription: [
      "Our consulting services provide strategic guidance for clinical engineering departments seeking to optimize their IT infrastructure and processes. We offer interim leadership solutions during staff transitions, develop long-term strategic plans that balance cost control with performance improvement, and ensure ongoing regulatory compliance.",
      "Our consultants bring extensive experience in healthcare technology management and can quickly assess organizational needs to implement effective solutions."
    ]
  }
];

export function Services() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation();
  const { ref: additionalRef, isVisible: additionalVisible } = useScrollAnimation();
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedAdditionalService, setSelectedAdditionalService] = useState<number | null>(null);

  const handleLearnMore = (index: number) => {
    setSelectedService(index);
  };

  const handleAdditionalLearnMore = (index: number) => {
    setSelectedAdditionalService(index);
  };

  const closeModal = () => {
    setSelectedService(null);
    setSelectedAdditionalService(null);
  };

  return (
    <section id="services" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header with Dashboard Image */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Left Column - Text Content */}
          <div 
            ref={headerRef}
            className={`space-y-6 transition-all duration-1000 ease-out ${
              headerVisible 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-8'
            }`}
          >
            <Badge 
              variant="outline" 
              className="border-blue-200 text-blue-700 bg-blue-50 px-4 py-2 text-sm font-medium"
            >
              Medical Device Risk Assessments & Security Planning
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Specialized Risk-Centric Threat Modeling
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Specialized risk centric threat modeling and asset valuation designed specifically for 
              connected medical assets. Protect patient safety, secure sensitive data, and 
              maintain uninterrupted care.
            </p>
          </div>
          
          {/* Right Column - Cybersecurity Dashboard Image */}
          <div className={`transition-all duration-1000 delay-300 ${
            headerVisible 
              ? 'opacity-100 translate-x-0' 
              : 'opacity-0 translate-x-8'
          }`}>
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src="/images/cybersecurity-dashboard.jpg"
                  alt="Cybersecurity dashboard showing real-time medical device monitoring and threat detection"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
                
                {/* Dashboard Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-gray-900">Real-Time Monitoring</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium text-green-600">Active Monitoring</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        24/7 cybersecurity monitoring and threat detection for medical devices
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Security Metrics */}
              <div className="absolute -top-4 -right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-bold">99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Services Grid */}
        <div 
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20 transition-all duration-1000 ease-out delay-300 ${
            gridVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <Card 
                key={service.title}
                className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border border-gray-200 rounded-2xl overflow-hidden ${
                  gridVisible 
                    ? `animate-fade-in-up` 
                    : 'opacity-0'
                }`}
                style={{
                  animationDelay: gridVisible ? `${index * 100}ms` : '0ms'
                }}
              >
                <CardContent className="p-8">
                  <div className="space-y-6">
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content */}
                    <div className="space-y-4">
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {service.description}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="pt-2">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-between group-hover:bg-blue-50 group-hover:text-blue-600 transition-all duration-300"
                        onClick={() => handleLearnMore(index)}
                      >
                        Learn More
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Services Section */}
        <div 
          ref={additionalRef}
          className={`transition-all duration-1000 ease-out delay-500 ${
            additionalVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-12">
            <Badge 
              variant="outline" 
              className="border-purple-200 text-purple-700 bg-purple-50 px-4 py-2 text-sm font-medium mx-auto mb-6"
            >
              Extended Capabilities
            </Badge>
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Additional Service Offerings
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive support services to enhance your clinical engineering and IT operations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {additionalServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card 
                  key={service.title}
                  className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border border-gray-200 rounded-2xl overflow-hidden ${
                    additionalVisible 
                      ? `animate-fade-in-up` 
                      : 'opacity-0'
                  }`}
                  style={{
                    animationDelay: additionalVisible ? `${index * 150}ms` : '0ms'
                  }}
                >
                  <CardContent className="p-8">
                    <div className="space-y-6">
                      {/* Icon */}
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>

                      {/* Content */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300">
                          {service.title}
                        </h4>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {service.description}
                        </p>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start space-x-3 text-xs text-gray-600">
                            <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-1" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA */}
                      <div className="pt-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="w-full justify-between group-hover:bg-purple-50 group-hover:text-purple-600 transition-all duration-300"
                          onClick={() => handleAdditionalLearnMore(index)}
                        >
                          Learn More
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
        
        {/* Trust Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Your Partner in Medical Cybersecurity</h3>
            <p className="text-lg text-gray-600 mb-6 max-w-3xl mx-auto">
              We work directly with hospitals, health systems, and vendors to close critical security gaps, 
              protect patient care, and reduce compliance risks.
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4" />
                <span>NIST Cybersecurity Framework</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>FDA Medical Device Security Guidelines</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for main services */}
      {selectedService !== null && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeModal}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 mx-4">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${services[selectedService].color} flex items-center justify-center flex-shrink-0`}>
                      {(() => {
                        const Icon = services[selectedService].icon;
                        return <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />;
                      })()}
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                      {services[selectedService].title}
                    </h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2 h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    {services[selectedService].description}
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Key Features:</h4>
                    <ul className="grid grid-cols-1 gap-3">
                      {services[selectedService].features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm sm:text-base text-gray-600">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Detailed Overview:</h4>
                    <div className="space-y-4">
                      {services[selectedService].detailedDescription.map((paragraph, idx) => (
                        <p key={idx} className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal for additional services */}
      {selectedAdditionalService !== null && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={closeModal}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 mx-4">
              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${additionalServices[selectedAdditionalService].color} flex items-center justify-center flex-shrink-0`}>
                      {(() => {
                        const Icon = additionalServices[selectedAdditionalService].icon;
                        return <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />;
                      })()}
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                      {additionalServices[selectedAdditionalService].title}
                    </h3>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700 flex-shrink-0 ml-2 h-8 w-8 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
                    {additionalServices[selectedAdditionalService].description}
                  </p>
                  
                  <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Key Features:</h4>
                    <ul className="space-y-3">
                      {additionalServices[selectedAdditionalService].features.map((feature, idx) => (
                        <li key={idx} className="flex items-start space-x-3 text-sm sm:text-base text-gray-600">
                          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Detailed Overview:</h4>
                    <div className="space-y-4">
                      {additionalServices[selectedAdditionalService].detailedDescription.map((paragraph, idx) => (
                        <p key={idx} className="text-sm sm:text-base text-gray-600 leading-relaxed">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}