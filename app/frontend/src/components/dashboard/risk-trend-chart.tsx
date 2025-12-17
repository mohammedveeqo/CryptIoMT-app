import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useOrganization } from "@/contexts/organization-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function RiskTrendChart() {
  const { currentOrganization } = useOrganization();
  const [days, setDays] = useState("30");
  
  const history = useQuery(api.audit.getRiskHistory, 
    currentOrganization ? { 
      organizationId: currentOrganization._id,
      days: parseInt(days)
    } : "skip"
  );

  if (!currentOrganization) return null;

  if (history === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Trend</CardTitle>
          <CardDescription>Loading risk history...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // If no history, show placeholder
  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Risk Trend</CardTitle>
              <CardDescription>Organization security posture over time</CardDescription>
            </div>
            <Select value={days} onValueChange={setDays}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <p>No historical data available yet.</p>
          <p className="text-sm">Risk snapshots are captured daily.</p>
        </CardContent>
      </Card>
    );
  }

  // Reverse history to show chronological order (oldest to newest)
  const data = [...history].reverse().map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    score: item.avgRiskScore,
    critical: item.criticalRiskCount,
    high: item.highRiskCount,
    fullDate: item.date
  }));

  // Calculate improvement
  const startScore = data[0]?.score || 0;
  const endScore = data[data.length - 1]?.score || 0;
  const improvement = startScore - endScore;
  const improvementPercent = startScore > 0 ? Math.round((improvement / startScore) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Risk Trend</CardTitle>
            <CardDescription>
              {improvement > 0 ? (
                <span className="text-green-600 font-medium">
                  Risk reduced by {improvementPercent}% since {data[0]?.date}
                </span>
              ) : improvement < 0 ? (
                <span className="text-red-600 font-medium">
                  Risk increased by {Math.abs(improvementPercent)}% since {data[0]?.date}
                </span>
              ) : (
                <span>No change in risk score since {data[0]?.date}</span>
              )}
            </CardDescription>
          </div>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                formatter={(value: any, name: any) => {
                  if (name === "score") return [value, "Avg Risk Score"];
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                strokeWidth={2}
                name="score"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
