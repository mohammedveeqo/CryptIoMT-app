"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "../../../contexts/organization-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Mail, FileText, Calendar, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  const { currentOrganization, isLoading: isOrgLoading } = useOrganization();
  const { user } = useUser();
  const convexUser = useQuery(api.users.getCurrentUser);
  const updateEmailPreferences = useMutation(api.users.updateEmailPreferences);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const updateOrganization = useMutation(api.organizations.updateOrganization);
  const [orgForm, setOrgForm] = useState({
    name: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    logoUrl: "",
  });

  useEffect(() => {
    if (currentOrganization) {
      setOrgForm({
        name: currentOrganization.name || "",
        contactEmail: currentOrganization.contactEmail || "",
        contactPhone: currentOrganization.contactPhone || "",
        address: currentOrganization.address || "",
        // @ts-ignore
        logoUrl: currentOrganization.logoUrl || "",
      });
    }
  }, [currentOrganization]);

  const handleOrgUpdate = async () => {
    if (!currentOrganization) return;
    await updateOrganization({
        organizationId: currentOrganization._id,
        name: orgForm.name,
        contactEmail: orgForm.contactEmail,
        contactPhone: orgForm.contactPhone,
        address: orgForm.address,
        logoUrl: orgForm.logoUrl,
    });
    // In a real app we'd use a toast here
    // toast({ title: "Updated", description: "Organization settings saved." });
  };
  
  const schedules = useQuery(api.reports.getSchedules, 
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  );
  
  const createSchedule = useMutation(api.reports.createSchedule);
  const deleteSchedule = useMutation(api.reports.deleteSchedule);

  const [newSchedule, setNewSchedule] = useState({
    name: "",
    frequency: "weekly" as "daily" | "weekly" | "monthly",
    type: "summary" as "summary" | "risk_detail" | "compliance",
    recipients: "",
  });

  const handleCreate = async () => {
    if (!currentOrganization) return;
    
    await createSchedule({
      organizationId: currentOrganization._id,
      name: newSchedule.name,
      frequency: newSchedule.frequency,
      type: newSchedule.type,
      recipients: newSchedule.recipients.split(",").map(e => e.trim()).filter(e => e),
    });
    
    setIsCreateOpen(false);
    setNewSchedule({
        name: "",
        frequency: "weekly" as "daily" | "weekly" | "monthly",
        type: "summary" as "summary" | "risk_detail" | "compliance",
        recipients: "",
    });
  };

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this schedule?")) {
        await deleteSchedule({ id });
    }
  };

  const handlePrefChange = async (key: string, value: boolean) => {
    if (!convexUser || !('preferences' in convexUser)) return;
    // @ts-ignore
    const prefs = convexUser.preferences?.emailDigests;
    const current = prefs || {
        weeklySummary: false,
        securityAlerts: false,
        marketingUpdates: false
    };
    
    await updateEmailPreferences({
        weeklySummary: current.weeklySummary ?? false,
        securityAlerts: current.securityAlerts ?? false,
        marketingUpdates: current.marketingUpdates ?? false,
        [key]: value
    });
  };

  if (isOrgLoading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile & Preferences</TabsTrigger>
          <TabsTrigger value="reports">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center">
             <div>
                <h2 className="text-xl font-semibold">Scheduled Reports</h2>
                <p className="text-sm text-muted-foreground">Manage automated email reports for your organization.</p>
             </div>
             <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-2" /> Create Schedule</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Report Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Report Name</Label>
                            <Input 
                                placeholder="Weekly Executive Summary" 
                                value={newSchedule.name}
                                onChange={(e) => setNewSchedule({...newSchedule, name: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select 
                                    value={newSchedule.frequency} 
                                    onValueChange={(v: any) => setNewSchedule({...newSchedule, frequency: v})}
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
                                <Select 
                                    value={newSchedule.type} 
                                    onValueChange={(v: any) => setNewSchedule({...newSchedule, type: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="summary">Executive Summary</SelectItem>
                                        <SelectItem value="risk_detail">Risk Detail Report</SelectItem>
                                        <SelectItem value="compliance">Compliance Report</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Recipients (comma separated)</Label>
                            <Input 
                                placeholder="admin@example.com, manager@example.com" 
                                value={newSchedule.recipients}
                                onChange={(e) => setNewSchedule({...newSchedule, recipients: e.target.value})}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!newSchedule.name || !newSchedule.recipients}>Create Schedule</Button>
                    </DialogFooter>
                </DialogContent>
             </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Next Run</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!schedules ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                            </TableRow>
                        ) : schedules.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No scheduled reports found.</TableCell>
                            </TableRow>
                        ) : (
                            schedules.map((schedule) => (
                                <TableRow key={schedule._id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-muted-foreground" />
                                            {schedule.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize">{schedule.type.replace('_', ' ')}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Calendar className="w-3.5 h-3.5" />
                                            <span className="capitalize">{schedule.frequency}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate" title={schedule.recipients.join(", ")}>
                                        {schedule.recipients.length} recipient{schedule.recipients.length !== 1 ? 's' : ''}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(schedule.nextRun).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(schedule._id)}>
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Email Preferences</CardTitle>
                    <CardDescription>Manage what emails you receive from CryptIoMT.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="weekly-summary" className="flex flex-col space-y-1">
                            <span>Weekly Summary</span>
                            <span className="font-normal text-muted-foreground">Receive a weekly overview of your organization's security posture.</span>
                        </Label>
                        <Input 
                            type="checkbox" 
                            id="weekly-summary" 
                            className="w-4 h-4" 
                            // @ts-ignore
                            checked={convexUser?.preferences?.emailDigests?.weeklySummary ?? false}
                            onChange={(e) => handlePrefChange('weeklySummary', e.target.checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="security-alerts" className="flex flex-col space-y-1">
                            <span>Security Alerts</span>
                            <span className="font-normal text-muted-foreground">Get notified immediately about critical risks and vulnerabilities.</span>
                        </Label>
                        <Input 
                            type="checkbox" 
                            id="security-alerts" 
                            className="w-4 h-4" 
                            // @ts-ignore
                            checked={convexUser?.preferences?.emailDigests?.securityAlerts ?? false}
                            onChange={(e) => handlePrefChange('securityAlerts', e.target.checked)}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <Label htmlFor="marketing" className="flex flex-col space-y-1">
                            <span>Product Updates</span>
                            <span className="font-normal text-muted-foreground">Receive news about new features and improvements.</span>
                        </Label>
                        <Input 
                            type="checkbox" 
                            id="marketing" 
                            className="w-4 h-4" 
                            // @ts-ignore
                            checked={convexUser?.preferences?.emailDigests?.marketingUpdates ?? false}
                            onChange={(e) => handlePrefChange('marketingUpdates', e.target.checked)}
                        />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        <TabsContent value="organization">
            <Card>
                <CardHeader>
                    <CardTitle>Organization Settings</CardTitle>
                    <CardDescription>Manage your organization details and branding.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Organization Name</Label>
                            <Input 
                                value={orgForm.name}
                                onChange={(e) => setOrgForm({...orgForm, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contact Email</Label>
                            <Input 
                                value={orgForm.contactEmail}
                                onChange={(e) => setOrgForm({...orgForm, contactEmail: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input 
                                value={orgForm.contactPhone}
                                onChange={(e) => setOrgForm({...orgForm, contactPhone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input 
                                value={orgForm.address}
                                onChange={(e) => setOrgForm({...orgForm, address: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Logo URL (White-label Reports)</Label>
                        <Input 
                            placeholder="https://example.com/logo.png"
                            value={orgForm.logoUrl}
                            onChange={(e) => setOrgForm({...orgForm, logoUrl: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground">
                            This logo will be used in your scheduled email reports and PDF exports.
                        </p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleOrgUpdate}>Save Changes</Button>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
