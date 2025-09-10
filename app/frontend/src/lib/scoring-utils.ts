export interface TechnicianMetrics {
  technicianId: string;
  name: string;
  deviceCount: number;
  totalDevices: number;
  criticalPHIDevices: number;
  supportedOSDevices: number;
  networkConnectedDevices: number;
  validIPDevices: number;
  duplicateIPCount: number;
  legacyOSCount: number;
  alertsAssigned?: number;
  alertsResolved?: number;
  avgResolutionTime?: number;
  // Add the missing rate properties that scoring functions expect
  osComplianceRate: number;
  networkComplianceRate: number;
  ipValidityRate: number;
  duplicateIPPenalty: number;
  criticalPHIScore: number;
  legacyOSScore: number;
  resolutionScore: number;
}

export interface ScoringWeights {
  workload: number;
  compliance: number;
  riskMitigation: number;
}

export interface ScoringModel {
  name: string;
  description: string;
  weights: ScoringWeights;
}

export const SCORING_MODELS: Record<string, ScoringModel> = {
  balanced: {
    name: "Balanced",
    description: "Equal focus on workload, compliance, and risk management",
    weights: { workload: 0.3, compliance: 0.3, riskMitigation: 0.4 }
  },
  riskFocused: {
    name: "Risk-Focused",
    description: "Prioritizes risk mitigation and security compliance",
    weights: { workload: 0.2, compliance: 0.3, riskMitigation: 0.5 }
  },
  productivityFocused: {
    name: "Productivity-Focused",
    description: "Emphasizes workload management and device coverage",
    weights: { workload: 0.5, compliance: 0.3, riskMitigation: 0.2 }
  }
};

export interface TechnicianScore {
  technicianId: string;
  name: string;
  overallScore: number;
  workloadScore: number;
  complianceScore: number;
  riskMitigationScore: number;
  metrics: TechnicianMetrics;
  rank: number;
  percentile: number;
}

// Normalize values to 0-100 scale
function normalize(value: number, min: number, max: number): number {
  if (max === min) return 50; // Default to middle if no variation
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

// Calculate workload score (higher device count = higher score)
function calculateWorkloadScore(metrics: TechnicianMetrics, allMetrics: TechnicianMetrics[]): number {
  const deviceCounts = allMetrics.map(m => m.deviceCount);
  const minDevices = Math.min(...deviceCounts);
  const maxDevices = Math.max(...deviceCounts);
  
  const deviceScore = normalize(metrics.deviceCount, minDevices, maxDevices);
  const coveragePercentage = (metrics.deviceCount / metrics.totalDevices) * 100;
  
  return (deviceScore * 0.7) + (coveragePercentage * 0.3);
}

// Calculate compliance score (higher compliance = higher score)
function calculateComplianceScore(metrics: TechnicianMetrics): number {
  // Use the pre-calculated rates from the query
  const {
    osComplianceRate,
    networkComplianceRate,
    ipValidityRate,
    duplicateIPPenalty
  } = metrics;
  
  // Weighted average of compliance metrics
  const complianceScore = (
    osComplianceRate * 0.3 +
    networkComplianceRate * 0.25 +
    ipValidityRate * 0.25 +
    (1 - duplicateIPPenalty) * 0.2
  ) * 100;
  
  return Math.round(Math.max(0, Math.min(100, complianceScore)));
}

function calculateRiskMitigationScore(metrics: TechnicianMetrics): number {
  // Use the pre-calculated scores from the query
  const {
    criticalPHIScore,
    legacyOSScore,
    resolutionScore
  } = metrics;
  
  // Weighted average of risk mitigation metrics
  const riskScore = (
    criticalPHIScore * 0.4 +
    legacyOSScore * 0.35 +
    resolutionScore * 0.25
  ) * 100;
  
  return Math.round(Math.max(0, Math.min(100, riskScore)));
}

// Main scoring function
export function calculateTechnicianScores(
  metricsArray: TechnicianMetrics[],
  model: ScoringModel = SCORING_MODELS.balanced
): TechnicianScore[] {
  const scores = metricsArray.map(metrics => {
    const workloadScore = calculateWorkloadScore(metrics, metricsArray);
    const complianceScore = calculateComplianceScore(metrics);
    const riskMitigationScore = calculateRiskMitigationScore(metrics);
    
    const overallScore = 
      (workloadScore * model.weights.workload) +
      (complianceScore * model.weights.compliance) +
      (riskMitigationScore * model.weights.riskMitigation);
    
    return {
      technicianId: metrics.technicianId,
      name: metrics.name,
      overallScore: Math.round(overallScore),
      workloadScore: Math.round(workloadScore),
      complianceScore: Math.round(complianceScore),
      riskMitigationScore: Math.round(riskMitigationScore),
      metrics,
      rank: 0, // Will be set after sorting
      percentile: 0 // Will be calculated after sorting
    };
  });
  
  // Sort by overall score (descending) and assign ranks
  scores.sort((a, b) => b.overallScore - a.overallScore);
  
  scores.forEach((score, index) => {
    score.rank = index + 1;
    score.percentile = Math.round(((scores.length - index) / scores.length) * 100);
  });
  
  return scores;
}

// Get performance insights
export function getPerformanceInsights(score: TechnicianScore): string[] {
  const insights: string[] = [];
  
  if (score.complianceScore < 70) {
    insights.push("Focus on OS updates and network configuration compliance");
  }
  
  if (score.riskMitigationScore < 60) {
    insights.push("High exposure to critical PHI devices - consider risk reduction strategies");
  }
  
  if (score.workloadScore > 90) {
    insights.push("Excellent device coverage - consider mentoring other technicians");
  }
  
  if (score.overallScore >= 85) {
    insights.push("Top performer - excellent across all metrics");
  } else if (score.overallScore < 60) {
    insights.push("Performance improvement needed - consider additional training");
  }
  
  return insights;
}