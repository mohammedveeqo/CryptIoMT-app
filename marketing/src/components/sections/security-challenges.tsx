"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Database, 
  Zap, 
  Lock,
  Activity,
  Building2
} from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const risks = [
  {
    icon: Users,
    title: "Patient Harm",
    description: "Attackers have the ability to modify medical device parameters and critical settings, putting the patients at risk.",
    color: "from-red-500 to-red-600"
  },
  {
    icon: Activity,
    title: "Operational Disruption",
    description: "Critical patient monitoring systems can be disabled by ransomware attacks endangering patients or widespread operational failures.",
    color: "from-orange-500 to-orange-600"
  },
  {
    icon: Database,
    title: "Data Breaches",
    description: "Theft of sensitive patient health information (PHI) subject to regulatory security mandates from the Health Insurance Portability and Accountability Act (HIPAA), a U.S. federal law enacted in 1996.",
    color: "from-purple-500 to-purple-600"
  },
  {
    icon: Zap,
    title: "Device Hijacking",
    description: "Threat actors can gain control of device functions compromising patient safety such as incorrect medication dosages or misleading vital sign data.",
    color: "from-yellow-500 to-yellow-600"
  },
  {
    icon: Lock,
    title: "Ransomware",
    description: "Malware can disrupt patient care by locking up devices or sequestering information until a ransom is paid.",
    color: "from-blue-500 to-blue-600"
  },
  {
    icon: Building2,
    title: "Operational Crises",
    description: "Hospitals are forced to transfer patients to other facilities due to patient care disruptions.",
    color: "from-green-500 to-green-600"
  }
];

export function SecurityChallenges() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: contentRef, isVisible: contentVisible } = useScrollAnimation();
  const { ref: risksRef, isVisible: risksVisible } = useScrollAnimation();

  return (
    <section id="security-challenges" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div 
          ref={headerRef}
          className={`text-center space-y-6 mb-16 transition-all duration-1000 ease-out ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <Badge 
            variant="outline" 
            className="border-red-200 text-red-700 bg-red-50 px-4 py-2 text-sm font-medium mx-auto"
          >
            Critical Healthcare Security Issues
          </Badge>
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
            Security Challenges in Clinical Engineering
          </h2>
        </div>

        {/* Main Content */}
        <div 
          ref={contentRef}
          className={`mb-16 transition-all duration-1000 ease-out delay-200 ${
            contentVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="bg-gray-50 rounded-2xl p-8 lg:p-12">
            <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
              <p>
                The healthcare sector has become a lucrative target for cyberattacks due to the vast amount of high value patient data and the critical nature of healthcare services. Healthcare&apos;s dependence on digital medical systems and networked environments have greatly increased after the COVID-19 pandemic. These technological innovations incentivize attackers as hospitals are often motivated to pay ransoms to avoid disruptions and crippling of their organizations.
              </p>
              <p>
                Medical instrumentation is now utilizing network connectivity for communications across hospital departments, hospitals within the system and remote outpatient medical clinics. Operating systems provide the necessary software environment which is fundamental to controlling the hardware and software applications associated with a medical device. This expands an organization&apos;s attack surface and medical data privacy subject to regulations becomes a great concern.
              </p>
              <p>
                Medical device cyberattacks exploit known vulnerabilities on medical devices with outdated operating systems, software, and 
                insecure configurations initiated by due to poor device inventory and tracking. Many devices run on older software that has not 
                received crucial security patches, leaving them susceptible to known exploits. With emerging technologies, AI-driven 
                cybercrimes on connected medical devices are at a rise with threat actors attempting to produce critical disruptions to patient 
                care or steal patient data otherwise known as Ransomware.
              </p>
            </div>
          </div>
        </div>

        {/* Risks Section */}
        <div 
          ref={risksRef}
          className={`transition-all duration-1000 ease-out delay-400 ${
            risksVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Medical Device Cyberattacks & Risks
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Understanding the critical threats facing healthcare organizations today
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {risks.map((risk, index) => {
              const Icon = risk.icon;
              return (
                <Card 
                  key={risk.title}
                  className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white border border-gray-200 rounded-2xl overflow-hidden ${
                    risksVisible 
                      ? `animate-fade-in-up` 
                      : 'opacity-0'
                  }`}
                  style={{
                    animationDelay: risksVisible ? `${index * 100}ms` : '0ms'
                  }}
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${risk.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h4 className="text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors duration-300">
                          {risk.title}
                        </h4>
                        <p className="text-gray-600 leading-relaxed text-sm">
                          {risk.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}