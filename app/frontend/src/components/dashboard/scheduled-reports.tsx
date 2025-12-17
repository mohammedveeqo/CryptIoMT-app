"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useOrganization } from "@/contexts/organization-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Mail, Plus, Trash2, FileText, CheckCircle2, Download } from "lucide-react";
import { toast } from "sonner";

export function ScheduledReports() {
  const { currentOrganization } = useOrganization();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [type, setType] = useState<"summary" | "risk_detail" | "compliance">("summary");
  const [recipients, setRecipients] = useState("");

  const schedules = useQuery(
    api.reports.getSchedules,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );

  const createSchedule = useMutation(api.reports.createSchedule);
  const deleteSchedule = useMutation(api.reports.deleteSchedule);

  const handleExportPDF = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).default;

      // Find the element to capture - in this case, the schedules list or the parent container
      // We'll target the card grid or the whole component if it has an ID, or just use document.body as fallback
      // But let's try to capture the "scheduled-reports-list" if we add an ID, or just the parent div
      const element = document.getElementById("scheduled-reports-container");
      
      if (!element) {
        toast.error("Could not find content to export");
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      } as any);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("scheduled-reports.pdf");
      toast.success("PDF downloaded");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleCreate = async () => {
    if (!currentOrganization) return;
    if (!name || !recipients) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      await createSchedule({
        organizationId: currentOrganization._id,
        name,
        frequency,
        type,
        recipients: recipients.split(",").map((e) => e.trim()),
      });
      toast.success("Schedule created successfully");
      setIsOpen(false);
      setName("");
      setRecipients("");
      setFrequency("weekly");
    } catch (error) {
      toast.error("Failed to create schedule");
      console.error(error);
    }
  };

  const handleDelete = async (id: any) => {
    try {
      await deleteSchedule({ id });
      toast.success("Schedule deleted");
    } catch (error) {
      toast.error("Failed to delete schedule");
    }
  };

  if (!currentOrganization) return null;

  return (
    <div className="space-y-6 mt-8" id="scheduled-reports-container">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5" /> Scheduled Reports
          </h2>
          <p className="text-muted-foreground text-sm">
            Automatically email reports to stakeholders
          </p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportPDF}>
                <Download className="w-4 h-4 mr-2" /> Export PDF
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Create Schedule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Report</DialogTitle>
              <DialogDescription>
                Configure automated email reports for your organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input
                  placeholder="e.g. Weekly Executive Summary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select
                    value={frequency}
                    onValueChange={(v: any) => setFrequency(v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Executive Summary</SelectItem>
                      <SelectItem value="risk_detail">Risk Details</SelectItem>
                      <SelectItem value="compliance">Compliance Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Recipients (comma separated)</Label>
                <Input
                  placeholder="admin@hospital.com, ciso@hospital.com"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Create Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schedules?.map((schedule) => (
          <Card key={schedule._id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    {schedule.name}
                    {schedule.isActive && (
                      <Badge variant="secondary" className="text-[10px] h-5">Active</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Next run: {new Date(schedule.nextRun).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(schedule._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Frequency
                  </span>
                  <span className="capitalize">{schedule.frequency}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Type
                  </span>
                  <span className="capitalize">{schedule.type.replace('_', ' ')}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Recipients
                  </span>
                  <span>{schedule.recipients.length}</span>
                </div>
                {schedule.lastRun && (
                    <div className="flex items-center gap-2 mt-2 text-xs text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        Last sent: {new Date(schedule.lastRun).toLocaleDateString()}
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {schedules?.length === 0 && (
          <div className="col-span-full text-center py-12 border rounded-lg bg-muted/20 border-dashed">
            <Mail className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
            <h3 className="text-lg font-medium">No scheduled reports</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
              Create a schedule to automatically send reports to your team.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
