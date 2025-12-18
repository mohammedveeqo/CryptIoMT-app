"use client"

import { useState, useRef } from "react"
import { useMutation } from "convex/react"
import { api } from "../../../../convex/_generated/api"
import { Id } from "../../../../convex/_generated/dataModel"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Upload, ArrowRight, Check, AlertCircle, FileSpreadsheet, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DeviceImportDialogProps {
  organizationId: string
  trigger?: React.ReactNode
  onSuccess?: () => void
}

const TARGET_FIELDS = [
  { key: "Name", label: "Device Name", required: true },
  { key: "Entity", label: "Entity/Hospital", required: false },
  { key: "Serial Number", label: "Serial Number", required: true },
  { key: "Manufacturer", label: "Manufacturer", required: true },
  { key: "Model", label: "Model", required: true },
  { key: "Category", label: "Category", required: true },
  { key: "Classification", label: "Classification", required: false },
  { key: "Technician", label: "Technician", required: false },
  { key: "Customer PHI category", label: "PHI Category", required: false },
  { key: "Device on network?", label: "On Network? (Yes/No)", required: false },
  { key: "Has PHI", label: "Has PHI? (Yes/No)", required: false },
  { key: "IP Address", label: "IP Address", required: false },
  { key: "MAC Address", label: "MAC Address", required: false },
  { key: "OS manufacturer", label: "OS Manufacturer", required: false },
  { key: "OS Version", label: "OS Version", required: false },
]

export function DeviceImportDialog({ organizationId, trigger, onSuccess }: DeviceImportDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing">("upload")
  const [fileData, setFileData] = useState<any[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [fileName, setFileName] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const importDevices = useMutation(api.medicalDevices.importMedicalDevices)
  const clearDevices = useMutation(api.medicalDevices.clearOrganizationDevices)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    setError(null)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: "array" })
      
      // Get the first sheet
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) throw new Error("No sheets found in file")

      const sheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" }) as any[]

      if (jsonData.length === 0) {
        throw new Error("Sheet is empty")
      }

      // Extract headers from the first row keys
      const detectedHeaders = Object.keys(jsonData[0])
      setHeaders(detectedHeaders)
      setFileData(jsonData)
      
      // Auto-map based on similar names
      const initialMapping: Record<string, string> = {}
      TARGET_FIELDS.forEach(field => {
        const match = detectedHeaders.find(h => 
          h.toLowerCase().replace(/[^a-z0-9]/g, "") === field.key.toLowerCase().replace(/[^a-z0-9]/g, "") ||
          h.toLowerCase().includes(field.label.toLowerCase())
        )
        if (match) {
          initialMapping[field.key] = match
        }
      })
      setMapping(initialMapping)
      setStep("mapping")
    } catch (err) {
      setError(String(err))
    }
  }

  const handleMappingChange = (targetKey: string, sourceHeader: string) => {
    setMapping(prev => ({ ...prev, [targetKey]: sourceHeader }))
  }

  const getMappedData = () => {
    return fileData.map(row => {
      const mappedRow: any = {}
      TARGET_FIELDS.forEach(field => {
        const sourceHeader = mapping[field.key]
        if (sourceHeader) {
          mappedRow[field.key] = row[sourceHeader]
        }
      })
      return mappedRow
    })
  }

  const handleImport = async () => {
    setStep("importing")
    try {
      const mappedDevices = getMappedData()
      
      // Optional: Clear existing devices before import? 
      // The original code did this, so we should probably keep it or ask.
      // Assuming replacement for now as per original code.
      await clearDevices({ organizationId: organizationId as Id<"organizations"> })
      
      await importDevices({
        organizationId: organizationId as Id<"organizations">,
        devices: mappedDevices
      })
      
      setOpen(false)
      onSuccess?.()
      
      // Reset state after success
      setTimeout(() => {
        setStep("upload")
        setFileData([])
        setHeaders([])
        setMapping({})
        setFileName("")
      }, 500)
      
    } catch (err) {
      setError("Import failed: " + String(err))
      setStep("preview")
    }
  }

  const reset = () => {
    setStep("upload")
    setFileData([])
    setHeaders([])
    setMapping({})
    setFileName("")
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
        setOpen(val)
        if (!val) reset()
    }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Import Devices
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Devices</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import devices for this organization.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 space-y-4 hover:bg-muted/50 transition-colors">
              <div className="bg-primary/10 p-4 rounded-full">
                <FileSpreadsheet className="h-10 w-10 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to select file or drag and drop</p>
                <p className="text-xs text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV</p>
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
                id="file-upload"
              />
              <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
                Select File
              </Button>
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === "mapping" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Map Columns</h3>
                  <p className="text-sm text-muted-foreground">
                    Match columns from <strong>{fileName}</strong> to the system fields.
                  </p>
                </div>
              </div>

              <ScrollArea className="h-[400px] border rounded-md p-4">
                <div className="grid gap-4">
                  {TARGET_FIELDS.map((field) => (
                    <div key={field.key} className="grid grid-cols-2 gap-4 items-center">
                      <div>
                        <Label className={field.required ? "font-bold" : ""}>
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </Label>
                        <p className="text-xs text-muted-foreground">Target Field: {field.key}</p>
                      </div>
                      <Select
                        value={mapping[field.key] || ""}
                        onValueChange={(val) => handleMappingChange(field.key, val)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select column..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore_field_value_special">-- Ignore --</SelectItem>
                          {headers.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {step === "preview" && (
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">Preview Import</h3>
                  <p className="text-sm text-muted-foreground">
                    Review the data before importing. Found {fileData.length} rows.
                  </p>
                </div>
              </div>
              
              <div className="border rounded-md overflow-hidden">
                <ScrollArea className="h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {TARGET_FIELDS.slice(0, 5).map(f => (
                            <TableHead key={f.key}>{f.label}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getMappedData().slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {TARGET_FIELDS.slice(0, 5).map(f => (
                            <TableCell key={f.key}>{row[f.key] || <span className="text-muted-foreground italic">Empty</span>}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  This will replace all existing devices for this organization. This action cannot be undone.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Import Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {step === "importing" && (
             <div className="flex flex-col items-center justify-center py-10 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-lg font-medium">Importing Devices...</p>
                <p className="text-sm text-muted-foreground">Please wait while we process your data.</p>
             </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t">
          {step === "upload" && (
             <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          )}
          
          {step === "mapping" && (
            <>
              <Button variant="ghost" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={() => setStep("preview")} disabled={Object.keys(mapping).length === 0}>
                Next: Preview <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="ghost" onClick={() => setStep("mapping")}>Back</Button>
              <Button onClick={handleImport}>
                <Check className="ml-2 h-4 w-4" /> Confirm Import
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
