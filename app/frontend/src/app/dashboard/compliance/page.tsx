'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useOrganization } from "@/contexts/organization-context";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, FileText, CheckCircle, AlertTriangle, Download } from "lucide-react";

export default function CompliancePage() {
    const { currentOrganization } = useOrganization();
    const complianceData = useQuery(
        api.compliance.getComplianceStatus,
        currentOrganization ? { organizationId: currentOrganization._id, frameworkId: "hipaa" } : "skip"
    );
    const updateStatus = useMutation(api.compliance.updateComplianceStatus);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempEvidence, setTempEvidence] = useState("");

    const handleStatusChange = async (controlId: string, status: string) => {
        if (!currentOrganization) return;
        await updateStatus({
            organizationId: currentOrganization._id,
            frameworkId: "hipaa",
            controlId,
            status,
            // Preserve existing evidence if any
            evidence: complianceData?.controls.find((c: any) => c.id === controlId)?.evidence
        });
    };

    const handleSaveEvidence = async (controlId: string) => {
        if (!currentOrganization) return;
        const control = complianceData?.controls.find((c: any) => c.id === controlId);
        await updateStatus({
            organizationId: currentOrganization._id,
            frameworkId: "hipaa",
            controlId,
            status: control?.status || "not_started",
            evidence: tempEvidence
        });
        setEditingId(null);
    };

    const openEvidenceDialog = (control: any) => {
        setTempEvidence(control.evidence || "");
        setEditingId(control.id);
    };

    const handleExport = async () => {
        if (!currentOrganization) return;
        const html2canvas = (await import('html2canvas')).default;
        const jsPDF = (await import('jspdf')).default;
        
        const element = document.getElementById('compliance-report');
        if (!element) return;
        
        const canvas = await html2canvas(element, { scale: 2 } as any);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [canvas.width, canvas.height + 100]
        });

        pdf.setFontSize(24);
        pdf.text(`Compliance Report: ${currentOrganization.name}`, 40, 50);
        pdf.setFontSize(14);
        pdf.text(`Framework: HIPAA Security Rule`, 40, 80);
        pdf.text(`Date: ${new Date().toLocaleDateString()}`, 40, 100);
        
        pdf.addImage(imgData, 'PNG', 0, 120, canvas.width, canvas.height);
        pdf.save(`compliance-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (!complianceData) {
        return <div className="p-8">Loading compliance data...</div>;
    }

    const compliantCount = complianceData.controls.filter((c: any) => c.status === "compliant").length;
    const inProgressCount = complianceData.controls.filter((c: any) => c.status === "in_progress").length;
    const notStartedCount = complianceData.controls.filter((c: any) => c.status === "not_started").length;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Compliance Mapping</h1>
                    <p className="text-muted-foreground">
                        Track compliance with HIPAA Security Rule and other frameworks.
                    </p>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" /> Export Report
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
                        <ShieldCheck className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">{complianceData.score}%</div>
                        <p className="text-xs text-muted-foreground">Overall completion rate</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Controls Met</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{compliantCount}</div>
                        <p className="text-xs text-muted-foreground">Fully compliant controls</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">{inProgressCount}</div>
                        <p className="text-xs text-muted-foreground">Controls being addressed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Action Required</CardTitle>
                        <FileText className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{notStartedCount}</div>
                        <p className="text-xs text-muted-foreground">Controls not yet started</p>
                    </CardContent>
                </Card>
            </div>

            <Card id="compliance-report">
                <CardHeader>
                    <CardTitle>HIPAA Security Rule Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Control ID</TableHead>
                                <TableHead className="w-[200px]">Category</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead className="w-[150px]">Status</TableHead>
                                <TableHead className="w-[100px]">Evidence</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {complianceData.controls.map((control: any) => (
                                <TableRow key={control.id}>
                                    <TableCell className="font-medium">{control.id}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground">{control.category}</TableCell>
                                    <TableCell>
                                        <div className="font-semibold">{control.name}</div>
                                        <div className="text-sm text-muted-foreground">{control.description}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            value={control.status} 
                                            onValueChange={(v) => handleStatusChange(control.id, v)}
                                        >
                                            <SelectTrigger className={`w-[140px] ${
                                                control.status === 'compliant' ? 'text-green-600 border-green-200 bg-green-50' :
                                                control.status === 'non_compliant' ? 'text-red-600 border-red-200 bg-red-50' :
                                                control.status === 'in_progress' ? 'text-orange-600 border-orange-200 bg-orange-50' :
                                                ''
                                            }`}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="not_started">Not Started</SelectItem>
                                                <SelectItem value="in_progress">In Progress</SelectItem>
                                                <SelectItem value="compliant">Compliant</SelectItem>
                                                <SelectItem value="non_compliant">Non-Compliant</SelectItem>
                                                <SelectItem value="not_applicable">N/A</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Dialog open={editingId === control.id} onOpenChange={(open) => !open && setEditingId(null)}>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant={control.evidence ? "default" : "outline"} 
                                                    size="sm"
                                                    onClick={() => openEvidenceDialog(control)}
                                                >
                                                    {control.evidence ? "View" : "Add"}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Evidence for {control.id}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="text-sm text-muted-foreground">
                                                        {control.description}
                                                    </div>
                                                    <Textarea 
                                                        placeholder="Describe how this requirement is met, or paste links to policy documents..."
                                                        value={tempEvidence}
                                                        onChange={(e) => setTempEvidence(e.target.value)}
                                                        className="min-h-[150px]"
                                                    />
                                                    <Button onClick={() => handleSaveEvidence(control.id)}>Save Evidence</Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
