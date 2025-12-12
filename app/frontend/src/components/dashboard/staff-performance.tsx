"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useMemo, useState, memo } from "react";
import {
  Users,
  Trophy,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Award,
  Target,
  AlertTriangle,
  CheckCircle,
  Settings
} from "lucide-react";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";
import {
  calculateTechnicianScores,
  getPerformanceInsights,
  SCORING_MODELS,
  type TechnicianMetrics,
  type TechnicianScore,
  type ScoringModel
} from "@/lib/scoring-utils";
import { useCachedQuery } from "@/hooks/use-cached-query";

const PERFORMANCE_COLORS = {
  excellent: '#10B981',
  good: '#3B82F6',
  average: '#F59E0B',
  poor: '#EF4444'
};

export function StaffPerformance() {
  const { currentOrganization } = useOrganization();
  const [selectedModel, setSelectedModel] = useState<string>('balanced');
  
  // Fetch technician performance data
  const technicianDataLive = useQuery(
    api.medicalDevices.getTechnicianMetrics,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  const { data: technicianData, invalidate } = useCachedQuery(
    currentOrganization ? `tech-metrics:${currentOrganization._id}` : 'tech-metrics:none',
    technicianDataLive
  );
  
  const isLoading = currentOrganization && technicianData === undefined;
  
  // Calculate scores based on selected model
  const technicianScores = useMemo(() => {
    if (!technicianData) return [];
    
    const model = SCORING_MODELS[selectedModel];
    return calculateTechnicianScores(technicianData, model);
  }, [technicianData, selectedModel]);
  
  // Performance statistics
  const performanceStats = useMemo(() => {
    if (technicianScores.length === 0) return null;
    
    const scores = technicianScores.map(t => t.overallScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const topPerformer = technicianScores[0];
    const needsImprovement = technicianScores.filter(t => t.overallScore < 60).length;
    
    return {
      averageScore: Math.round(avgScore),
      topPerformer,
      totalTechnicians: technicianScores.length,
      needsImprovement,
      excellentPerformers: technicianScores.filter(t => t.overallScore >= 85).length
    };
  }, [technicianScores]);
  
  // Chart data preparations
  const leaderboardData = useMemo(() => 
    technicianScores.slice(0, 10).map(score => ({
      name: score.name,
      score: score.overallScore,
      workload: score.workloadScore,
      compliance: score.complianceScore,
      riskMitigation: score.riskMitigationScore,
      rank: score.rank
    })), [technicianScores]
  );
  
  const scatterData = useMemo(() => 
    technicianScores.map(score => ({
      name: score.name,
      workload: score.workloadScore,
      risk: score.riskMitigationScore,
      compliance: score.complianceScore,
      overall: score.overallScore,
      deviceCount: score.metrics.deviceCount
    })), [technicianScores]
  );
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => invalidate()}>Refresh Data</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with Model Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Staff Performance</h2>
          <p className="text-muted-foreground">
            Comprehensive technician performance evaluation and scoring
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Scoring Model:</label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SCORING_MODELS).map(([key, model]) => (
                <SelectItem key={key} value={key}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => invalidate()}>Refresh Data</Button>
        </div>
      </div>
      
      {/* Performance Overview Cards */}
      {performanceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.averageScore}</div>
              <p className="text-xs text-muted-foreground">
                Across {performanceStats.totalTechnicians} technicians
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{performanceStats.topPerformer.name}</div>
              <p className="text-xs text-muted-foreground">
                Score: {performanceStats.topPerformer.overallScore}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellent Performers</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {performanceStats.excellentPerformers}
              </div>
              <p className="text-xs text-muted-foreground">
                Score ≥ 85
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Need Improvement</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {performanceStats.needsImprovement}
              </div>
              <p className="text-xs text-muted-foreground">
                Score &lt; 60
              </p>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leaderboard Chart */}
        <TechnicianLeaderboard data={leaderboardData} />
        
        {/* Risk vs Workload Scatter */}
        <RiskWorkloadMatrix data={scatterData} />
      </div>
      
      {/* Detailed Performance Table */}
      <PerformanceTable scores={technicianScores} />
    </div>
  );
}

// Technician Leaderboard Component
const TechnicianLeaderboard = memo(({ data }: { data: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Trophy className="h-5 w-5" />
        Top Performers
      </CardTitle>
      <CardDescription>
        Ranked by overall performance score
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="horizontal" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={80} fontSize={12} />
            <Tooltip 
              formatter={(value, name) => [
                `${value}`, 
                name === 'score' ? 'Overall Score' : name
              ]}
            />
            <Bar dataKey="score" fill="#3B82F6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
));
TechnicianLeaderboard.displayName = 'TechnicianLeaderboard';

// Risk vs Workload Matrix Component
const RiskWorkloadMatrix = memo(({ data }: { data: any[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        Risk vs Workload Analysis
      </CardTitle>
      <CardDescription>
        Performance distribution across key metrics
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="workload" 
              name="Workload Score" 
              domain={[0, 100]}
              label={{ value: 'Workload Score', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="risk" 
              name="Risk Mitigation" 
              domain={[0, 100]}
              label={{ value: 'Risk Mitigation Score', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value, name, props) => [
                `${value}`,
                name === 'workload' ? 'Workload Score' : 'Risk Mitigation Score'
              ]}
              labelFormatter={(label, payload) => 
                payload?.[0]?.payload?.name || 'Technician'
              }
            />
            <Scatter 
              dataKey="risk" 
              fill="#8884d8"
              fillOpacity={0.7}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </CardContent>
  </Card>
));
RiskWorkloadMatrix.displayName = 'RiskWorkloadMatrix';

// Performance Table Component
const PerformanceTable = memo(({ scores }: { scores: TechnicianScore[] }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5" />
        Detailed Performance Breakdown
      </CardTitle>
      <CardDescription>
        Complete performance metrics for all technicians
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Rank</th>
              <th className="text-left p-2">Technician</th>
              <th className="text-left p-2">Overall Score</th>
              <th className="text-left p-2">Workload</th>
              <th className="text-left p-2">Compliance</th>
              <th className="text-left p-2">Risk Mitigation</th>
              <th className="text-left p-2">Devices</th>
              <th className="text-left p-2">Insights</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((score) => {
              const insights = getPerformanceInsights(score);
              return (
                <tr key={score.technicianId} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    <Badge variant={score.rank <= 3 ? "default" : "secondary"}>
                      #{score.rank}
                    </Badge>
                  </td>
                  <td className="p-2 font-medium">{score.name}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{score.overallScore}</span>
                      <Progress value={score.overallScore} className="w-16 h-2" />
                    </div>
                  </td>
                  <td className="p-2">{score.workloadScore}</td>
                  <td className="p-2">{score.complianceScore}</td>
                  <td className="p-2">{score.riskMitigationScore}</td>
                  <td className="p-2">{score.metrics.deviceCount}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {insights.slice(0, 2).map((insight, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {insight.length > 30 ? `${insight.substring(0, 30)}...` : insight}
                        </Badge>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </CardContent>
  </Card>
));
PerformanceTable.displayName = 'PerformanceTable';
