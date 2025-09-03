"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const riskLevels = [
  { level: "Critical", color: "bg-red-600", textColor: "text-white", description: "Immediate action required" },
  { level: "High", color: "bg-red-400", textColor: "text-white", description: "Action required within 30 days" },
  { level: "Medium", color: "bg-orange-300", textColor: "text-gray-900", description: "Action required within 90 days" },
  { level: "Low", color: "bg-yellow-200", textColor: "text-gray-900", description: "Monitor and review" },
  { level: "Very Low", color: "bg-green-200", textColor: "text-gray-900", description: "Acceptable risk level" }
];

const impactLevels = ["Critical", "High", "Medium", "Low", "Very Low"];
const probabilityLevels = ["Very Low", "Low", "Medium", "High", "Critical"];

function getRiskScore(impact: number, probability: number): number {
  return (impact + 1) * (probability + 1);
}

function getRiskLevel(score: number): string {
  if (score >= 20) return "Critical";
  if (score >= 15) return "High";
  if (score >= 9) return "Medium";
  if (score >= 4) return "Low";
  return "Very Low";
}

function getRiskColor(level: string): string {
  switch (level) {
    case "Critical": return "bg-red-600 text-white";
    case "High": return "bg-red-400 text-white";
    case "Medium": return "bg-orange-300 text-gray-900";
    case "Low": return "bg-yellow-200 text-gray-900";
    default: return "bg-green-200 text-gray-900";
  }
}

export function RiskMatrix() {
  const { ref: matrixRef, isVisible: matrixVisible } = useScrollAnimation();

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div 
          ref={matrixRef}
          className={`transition-all duration-1000 ${
            matrixVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          {/* Section Header */}
          <div className="text-center space-y-6 mb-16">
            <Badge 
              variant="outline" 
              className="border-purple-200 text-purple-700 bg-purple-50 px-4 py-2 text-sm font-medium mx-auto"
            >
              Risk Assessment Framework
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900">
              Interactive Risk Matrix
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our NIST SP 800-37 aligned risk assessment framework helps you systematically 
              evaluate and prioritize cybersecurity risks in your healthcare environment.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Risk Matrix */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-bold">Risk Assessment Matrix</CardTitle>
                  <p className="text-sm text-gray-600">Impact vs. Probability Analysis</p>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-6 gap-2 min-w-[500px]">
                      {/* Headers */}
                      <div className="p-3"></div>
                      {probabilityLevels.map((prob) => (
                        <div key={prob} className="p-3 text-xs font-medium text-center">
                          {prob}
                        </div>
                      ))}
                      
                      {/* Matrix Rows */}
                      {impactLevels.map((impact, impactIndex) => (
                        <>
                          <div key={impact} className="p-3 text-xs font-medium flex items-center justify-center">
                            <div className="transform -rotate-90 whitespace-nowrap">{impact}</div>
                          </div>
                          {probabilityLevels.map((prob, probIndex) => {
                            const score = getRiskScore(impactIndex, probIndex);
                            const level = getRiskLevel(score);
                            const colorClass = getRiskColor(level);
                            
                            return (
                              <div 
                                key={`${impact}-${prob}`}
                                className={`p-3 rounded text-xs text-center font-medium ${colorClass} hover:scale-105 transition-transform cursor-pointer`}
                                title={`${impact} Impact × ${prob} Probability = ${level} Risk (Score: ${score})`}
                              >
                                {score}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Risk Level Legend */}
            <div className="space-y-6">
              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold">Risk Levels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {riskLevels.map((risk) => (
                    <div key={risk.level} className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded ${risk.color}`}></div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{risk.level}</div>
                        <div className="text-xs text-gray-600">{risk.description}</div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="p-6">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-bold">Assessment Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Devices</span>
                    <span className="font-bold">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Assessed</span>
                    <span className="font-bold text-green-600">892</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">High Risk</span>
                    <span className="font-bold text-red-600">23</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Compliance Score</span>
                    <span className="font-bold text-blue-600">87%</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}