"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Shield, Database, Zap, Lock, Hospital } from "lucide-react";

const threats = [
  {
    icon: AlertTriangle,
    title: "Patient Harm",
    description: "Attackers can modify medical device parameters and critical settings, putting patients at direct risk.",
    severity: "Critical"
  },
  {
    icon: Hospital,
    title: "Operational Disruption", 
    description: "Ransomware attacks can disable critical patient monitoring systems, endangering patients.",
    severity: "High"
  },
  {
    icon: Database,
    title: "Data Breaches",
    description: "Theft of sensitive PHI subject to HIPAA regulatory mandates and compliance requirements.",
    severity: "High"
  },
  {
    icon: Zap,
    title: "Device Hijacking",
    description: "Threat actors gain control of device functions, causing incorrect dosages or misleading vital signs.",
    severity: "Critical"
  },
  {
    icon: Lock,
    title: "Ransomware",
    description: "Malware disrupts patient care by locking devices or sequestering information until ransom is paid.",
    severity: "Critical"
  }
];

export function Threats() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container px-4 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Critical Threats Facing Healthcare Today
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Healthcare has become a prime target for cyberattacks due to valuable patient data 
            and the critical nature of medical services. Understanding these threats is the first step to protection.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {threats.map((threat, index) => {
            const Icon = threat.icon;
            return (
              <Card key={index} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-red-600" />
                    <CardTitle className="text-lg">{threat.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-3">{threat.description}</p>
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                    threat.severity === 'Critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {threat.severity} Risk
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}