'use client'

import { useState, useMemo, useCallback, useRef, useTransition, memo, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal, ChevronDown, Save, Trash2, Plus, User, Building2 } from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu'
import { useOrganization } from '@/contexts/organization-context'
import { useSearchParams, useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  createColumnHelper, 
  getCoreRowModel, 
  getSortedRowModel, 
  useReactTable,
  flexRender,
  type ColumnDef,
  type SortingState
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useCachedQuery } from '@/hooks/use-cached-query'
import { DeviceCVEDetails } from './device-cve-details'
import { DeviceHistory } from './device-history'
import { DeviceTags } from './device-tags'
import { ErrorBoundary } from 'react-error-boundary'

interface DeviceInventoryProps {
  isAdmin?: boolean
  userRole?: string
}

type Device = {
  _id: string
  name: string
  entity: string
  serialNumber: string
  manufacturer: string
  model: string
  category: string
  classification: string
  deviceOnNetwork: boolean
  hasPHI: boolean
  cveCount?: number
  tags?: string[]
  ownerId?: string
  ownerName?: string
  owner?: {
    department?: string
  }
}

const columnHelper = createColumnHelper<Device>()

// Memoized virtual row component
const VirtualRow = memo(({ row, cells, onClick, density }: { row: any; cells: any[]; onClick?: () => void; density: 'comfortable' | 'compact' }) => (
  <div className={`flex w-full border-b hover:bg-muted/70 transition-colors ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
    {cells.map(cell => (
      <div
        key={cell.id}
        className={density === 'compact' ? 'p-1 flex items-center truncate' : 'p-3 flex items-center truncate'}
        style={{ width: cell.column.getSize() }}
      >
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
      </div>
    ))}
  </div>
))
VirtualRow.displayName = 'VirtualRow'

export function DeviceInventory({ isAdmin = false, userRole = 'customer' }: DeviceInventoryProps) {
  const { currentOrganization } = useOrganization()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false)
  const [assignReason, setAssignReason] = useState('')
  const [pendingAssign, setPendingAssign] = useState<{ type: 'single' | 'bulk', ownerId: string | undefined, deviceIds: string[] } | null>(null)
  const bulkUpdateStatus = useMutation(api.medicalDevices.bulkUpdateDeviceStatus)
  const assignDeviceOwner = useMutation(api.medicalDevices.assignDeviceOwner)
  
  // State management
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({})
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [rowDensity, setRowDensity] = useState<'comfortable' | 'compact'>('comfortable')
  const [columnOrder, setColumnOrder] = useState<string[]>([])
  type DeviceFilters = { 
    search: string;
    category: string;
    manufacturer: string;
    classification: string;
    network: string;
    phi: string;
    tags?: string[];
    owner?: string;
    department?: string;
  }

  type SavedView = {
    name: string;
    filters: DeviceFilters;
    columnVisibility: Record<string, boolean>;
    rowDensity: 'comfortable' | 'compact';
    columnOrder: string[];
  }
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  
  const groups = useQuery(api.groups.getGroups, currentOrganization ? { organizationId: currentOrganization._id } : "skip");
  const members = useQuery(api.organizations.getOrganizationMembers, currentOrganization ? { organizationId: currentOrganization._id } : "skip");
  const createGroup = useMutation(api.groups.createGroup);
  const deleteGroup = useMutation(api.groups.deleteGroup);

  const [filters, setFilters] = useState<DeviceFilters>({
    search: '',
    category: 'all',
    manufacturer: 'all',
    classification: 'all',
    network: 'all',
    phi: 'all',
    tags: [],
    owner: 'all',
    department: 'all'
  })

  // Initialize filters from URL query params
  const initializedFromUrlRef = useRef(false)
  if (!initializedFromUrlRef.current) {
    const qpClass = searchParams.get('classification')
    const qpPhi = searchParams.get('phi')
    const qpNetwork = searchParams.get('network')
    const qpSearch = searchParams.get('search')
    setFilters(prev => ({
      ...prev,
      classification: qpClass ? qpClass : prev.classification,
      phi: qpPhi === 'yes' || qpPhi === 'no' ? qpPhi : prev.phi,
      network: qpNetwork === 'connected' || qpNetwork === 'offline' ? qpNetwork : prev.network,
      search: qpSearch || prev.search,
    }))
    initializedFromUrlRef.current = true
  }

  // Fetch devices data
  const liveDevices = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : 'skip'
  )

  const { data: allDevices, invalidate } = useCachedQuery(
    currentOrganization ? `devices:${currentOrganization._id}` : 'devices:none',
    liveDevices
  )

  // Memoized column definitions
  const columns = useMemo<ColumnDef<Device, any>[]>(
    () => [
      columnHelper.display({
        id: 'select',
        header: ({ table }) => (
          <input
            type="checkbox"
            aria-label="Select all"
            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() ? true : false)}
            onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
            className="h-4 w-4"
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            aria-label="Select row"
            checked={row.getIsSelected()}
            onChange={(e) => row.toggleSelected(!!e.target.checked)}
            className="h-4 w-4"
          />
        ),
        size: 40,
      }),
      columnHelper.accessor('name', {
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 hover:bg-transparent"
          >
            Device Name
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        size: 200,
      }),
      columnHelper.accessor('ownerName', {
        header: 'Owner',
        cell: ({ row }) => {
            const val = row.original.ownerName;
            const ownerId = row.original.ownerId;
            return val && val !== 'Unknown' ? (
                <div 
                    className="flex items-center gap-2 cursor-pointer hover:underline hover:text-blue-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFilters(prev => ({ ...prev, owner: ownerId || 'all' }));
                    }}
                >
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate" title={val}>{val}</span>
                </div>
            ) : (
                <span 
                    className="text-muted-foreground text-xs italic cursor-pointer hover:underline hover:text-blue-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFilters(prev => ({ ...prev, owner: 'unassigned' }));
                    }}
                >
                    Unassigned
                </span>
            );
        },
        size: 160,
      }),
      columnHelper.accessor(row => row.owner?.department || 'Unassigned', {
        id: 'department',
        header: 'Department',
        cell: ({ getValue }) => {
             const val = getValue();
             return val && val !== 'Unassigned' ? (
                <div 
                    className="flex items-center gap-2 cursor-pointer hover:underline hover:text-blue-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFilters(prev => ({ ...prev, department: val }));
                    }}
                >
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate" title={val}>{val}</span>
                </div>
             ) : (
                 <span 
                    className="text-muted-foreground text-xs italic cursor-pointer hover:underline hover:text-blue-600"
                    onClick={(e) => {
                        e.stopPropagation();
                        setFilters(prev => ({ ...prev, department: 'unassigned' }));
                    }}
                 >
                    Unassigned
                </span>
             );
        },
        size: 140,
      }),
      columnHelper.accessor('entity', {
        header: 'Entity',
        size: 150,
      }),
      columnHelper.accessor('serialNumber', {
        header: 'Serial Number',
        size: 150,
      }),
      columnHelper.accessor('manufacturer', {
        header: 'Manufacturer',
        size: 150,
      }),
      columnHelper.accessor('model', {
        header: 'Model',
        size: 120,
      }),
      columnHelper.accessor('category', {
        header: 'Category',
        cell: ({ getValue }) => (
          <Badge variant="secondary">{getValue()}</Badge>
        ),
        size: 120,
      }),
      columnHelper.accessor('classification', {
        header: 'Classification',
        cell: ({ getValue }) => (
          <Badge variant="outline">{getValue()}</Badge>
        ),
        size: 120,
      }),
      columnHelper.accessor('deviceOnNetwork', {
        header: 'Network',
        cell: ({ getValue }) => (
          <Badge 
            variant={getValue() ? "default" : "destructive"}
            className={getValue() ? "bg-green-600" : ""}
          >
            {getValue() ? "Connected" : "Offline"}
          </Badge>
        ),
        size: 100,
      }),
      columnHelper.accessor('hasPHI', {
        header: 'PHI',
        cell: ({ getValue }) => (
          <Badge 
            variant={getValue() ? "destructive" : "secondary"}
            className={getValue() ? "bg-red-600" : ""}
          >
            {getValue() ? "Yes" : "No"}
          </Badge>
        ),
        size: 80,
      }),
      columnHelper.accessor('cveCount', {
        header: 'Vulns',
        cell: ({ getValue }) => {
          const count = getValue() || 0;
          return (
             <Badge 
                variant={count > 0 ? "destructive" : "secondary"} 
                className={count > 0 ? "bg-red-600" : "bg-green-600"}
             >
              {count}
            </Badge>
          )
        },
        size: 80,
      }),
      columnHelper.accessor('tags', {
        header: 'Tags',
        cell: ({ getValue }) => {
          const tags = getValue() || [];
          return (
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 2).map((tag: string) => (
                <Badge key={tag} variant="outline" className="text-[10px] px-1 h-5">
                  {tag}
                </Badge>
              ))}
              {tags.length > 2 && (
                <Badge variant="outline" className="text-[10px] px-1 h-5">
                  +{tags.length - 2}
                </Badge>
              )}
            </div>
          );
        },
        size: 120,
      }),
      columnHelper.display({
        id: 'details',
        header: 'Details',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" onClick={() => {
            const dev = (row as any).original
            setSelectedDevice(dev)
            setDetailsOpen(true)
          }}>View</Button>
        ),
        size: 100,
      }),
    ],
    []
  )

  // Optimized filtered data with early returns
  const filteredData = useMemo(() => {
    if (!allDevices) return [] as Device[]
    
    return (allDevices as unknown as Device[]).filter(device => {
      // Early return for search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const matchesSearch = 
          device.name.toLowerCase().includes(searchLower) ||
          device.entity.toLowerCase().includes(searchLower) ||
          device.manufacturer.toLowerCase().includes(searchLower) ||
          device.serialNumber.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }
      
      // Early returns for other filters
      if (filters.category !== 'all' && device.category !== filters.category) return false
      if (filters.manufacturer !== 'all' && device.manufacturer !== filters.manufacturer) return false
      if (filters.classification !== 'all' && device.classification !== filters.classification) return false
      if (filters.network === 'connected' && !device.deviceOnNetwork) return false
      if (filters.network === 'offline' && device.deviceOnNetwork) return false
      if (filters.phi === 'yes' && !device.hasPHI) return false
      if (filters.phi === 'no' && device.hasPHI) return false
      
      // Owner filter
      if (filters.owner && filters.owner !== 'all') {
        if (filters.owner === 'unassigned') {
           if (device.ownerId) return false;
        } else {
           if (device.ownerId !== filters.owner) return false;
        }
      }

      // Department filter
      if (filters.department && filters.department !== 'all') {
         const dept = device.owner?.department || 'Unassigned';
         if (filters.department === 'unassigned') {
             if (dept !== 'Unassigned') return false;
         } else {
             if (dept !== filters.department) return false;
         }
      }

      if (filters.tags && filters.tags.length > 0) {
        const deviceTags = device.tags || [];
        const hasMatchingTag = filters.tags.some(tag => deviceTags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      return true
    })
  }, [allDevices, filters])

  // Cascading filter options based on current selections
  const filterOptions = useMemo(() => {
    if (!allDevices) return { categories: [], manufacturers: [], classifications: [], tags: [], ownerCounts: new Map(), departmentCounts: new Map(), unassignedCount: 0 }
    
    const matchesSearch = (device: Device, search: string) => {
        const searchLower = search.toLowerCase()
        return device.name.toLowerCase().includes(searchLower) ||
          device.entity.toLowerCase().includes(searchLower) ||
          device.manufacturer.toLowerCase().includes(searchLower) ||
          device.serialNumber.toLowerCase().includes(searchLower)
    }

    const checkFilter = (device: Device, key: string) => {
       if (key !== 'search' && filters.search && !matchesSearch(device, filters.search)) return false
       if (key !== 'category' && filters.category !== 'all' && device.category !== filters.category) return false
       if (key !== 'manufacturer' && filters.manufacturer !== 'all' && device.manufacturer !== filters.manufacturer) return false
       if (key !== 'classification' && filters.classification !== 'all' && device.classification !== filters.classification) return false
       if (key !== 'network') {
          if (filters.network === 'connected' && !device.deviceOnNetwork) return false
          if (filters.network === 'offline' && device.deviceOnNetwork) return false
       }
       if (key !== 'phi') {
          if (filters.phi === 'yes' && !device.hasPHI) return false
          if (filters.phi === 'no' && device.hasPHI) return false
       }
       if (key !== 'owner' && filters.owner && filters.owner !== 'all') {
          if (filters.owner === 'unassigned') {
             if (device.ownerId) return false;
          } else {
             if (device.ownerId !== filters.owner) return false;
          }
       }
       if (key !== 'department' && filters.department && filters.department !== 'all') {
          const dept = device.owner?.department || 'Unassigned';
          if (filters.department === 'unassigned') {
             if (dept !== 'Unassigned') return false;
          } else {
             if (dept !== filters.department) return false;
          }
       }
       // Tags logic omitted for brevity/complexity in "except" logic, usually tags are additive
       return true
    }

    // Original sequential logic for existing dropdowns (simpler to keep as is or adapt?)
    // Let's adapt the "availableDevices" concept to be "devices matching current filters"
    // But for dropdowns we often want "what would be available if I changed THIS filter"
    
    // For simplicity and stability, let's keep the sequential logic for the original fields 
    // but implement the "except self" logic for Owner and Department as they are new and requested with counts.
    
    // ... Actually, let's just do a single pass for Owner and Department counts
    
    let availableDevices = allDevices
    if (filters.search) availableDevices = availableDevices.filter(d => matchesSearch(d, filters.search))
    if (filters.category !== 'all') availableDevices = availableDevices.filter(d => d.category === filters.category)
    if (filters.manufacturer !== 'all') availableDevices = availableDevices.filter(d => d.manufacturer === filters.manufacturer)
    if (filters.classification !== 'all') availableDevices = availableDevices.filter(d => d.classification === filters.classification)
    if (filters.network === 'connected') availableDevices = availableDevices.filter(d => d.deviceOnNetwork)
     else if (filters.network === 'offline') availableDevices = availableDevices.filter(d => !d.deviceOnNetwork)
     if (filters.phi === 'yes') availableDevices = availableDevices.filter(d => d.hasPHI)
     else if (filters.phi === 'no') availableDevices = availableDevices.filter(d => !d.hasPHI)
     // Note: I'm NOT filtering by Owner/Dept here for the sets below, to allow seeing options?
     // The original code filtered by everything.
     // If I stick to original code style:
     if (filters.owner && filters.owner !== 'all') {
         if (filters.owner === 'unassigned') availableDevices = availableDevices.filter(d => !d.ownerId)
         else availableDevices = availableDevices.filter(d => d.ownerId === filters.owner)
     }
     if (filters.department && filters.department !== 'all') {
          if (filters.department === 'unassigned') {
             availableDevices = availableDevices.filter(d => !d.owner?.department || d.owner.department === 'Unassigned')
          } else {
             availableDevices = availableDevices.filter(d => d.owner?.department === filters.department)
          }
     }
     
     const categorySet = new Set<string>()
    const manufacturerSet = new Set<string>()
    const classificationSet = new Set<string>()
    const tagSet = new Set<string>()
    
    availableDevices.forEach(device => {
      categorySet.add(device.category)
      manufacturerSet.add(device.manufacturer)
      classificationSet.add(device.classification)
      if (device.tags) device.tags.forEach(t => tagSet.add(t))
    })
    
    // Now calculate Owner/Dept counts based on "everything EXCEPT owner/dept"
    const devicesForOwner = allDevices.filter(d => checkFilter(d, 'owner'));
    const ownerCounts = new Map<string, number>();
    let unassignedCount = 0;
    devicesForOwner.forEach(d => {
        if (d.ownerId) ownerCounts.set(d.ownerId, (ownerCounts.get(d.ownerId) || 0) + 1);
        else unassignedCount++;
    });

    const devicesForDept = allDevices.filter(d => checkFilter(d, 'department'));
    const departmentCounts = new Map<string, number>();
    let unassignedDeptCount = 0;
    devicesForDept.forEach(d => {
        const dept = d.owner?.department || 'Unassigned';
        departmentCounts.set(dept, (departmentCounts.get(dept) || 0) + 1);
        if (dept === 'Unassigned') unassignedDeptCount++;
    });
    
    return {
      categories: Array.from(categorySet).sort(),
      manufacturers: Array.from(manufacturerSet).sort(),
      classifications: Array.from(classificationSet).sort(),
      tags: Array.from(tagSet).sort(),
      ownerCounts,
      departmentCounts,
      unassignedCount,
      unassignedDeptCount
    }
  }, [allDevices, filters])

  // Table instance - call useReactTable directly, not inside useMemo
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting, columnVisibility, rowSelection, columnOrder },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    enableRowSelection: true,
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => rowDensity === 'compact' ? 36 : 53,
    overscan: 10,
  })

  // Optimized handlers with immediate UI feedback
  const handleSearchInput = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }, [])

  const handleFilterChange = useCallback((key: string, value: string | string[]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      manufacturer: 'all',
      classification: 'all',
      network: 'all',
      phi: 'all',
      tags: []
    })
  }, [])

  useEffect(() => {
    const orgId = currentOrganization ? currentOrganization._id : 'none'
    const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(`deviceInventory:${orgId}:state`) : null
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted)
        if (parsed.filters) setFilters(parsed.filters)
        if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility)
        if (parsed.rowDensity) setRowDensity(parsed.rowDensity)
        if (parsed.columnOrder) setColumnOrder(parsed.columnOrder)
      } catch {}
    }
    const viewsRaw = typeof window !== 'undefined' ? window.localStorage.getItem(`deviceInventory:${orgId}:views`) : null
    if (viewsRaw) {
      try {
        setSavedViews(JSON.parse(viewsRaw))
      } catch {}
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrganization])

  useEffect(() => {
    const orgId = currentOrganization ? currentOrganization._id : 'none'
    const payload = { filters, columnVisibility, rowDensity }
    const id = setTimeout(() => {
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(`deviceInventory:${orgId}:state`, JSON.stringify({ ...payload, columnOrder }))
        }
      } catch {}
    }, 400)
    return () => clearTimeout(id)
  }, [filters, columnVisibility, rowDensity, columnOrder, currentOrganization])

  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'overview'
    if (currentTab !== 'devices') return
    const qp = new URLSearchParams(Array.from(searchParams.entries()))
    if (filters.search) qp.set('search', filters.search); else qp.delete('search')
    if (filters.classification !== 'all') qp.set('classification', filters.classification); else qp.delete('classification')
    if (filters.phi === 'yes' || filters.phi === 'no') qp.set('phi', filters.phi); else qp.delete('phi')
    if (filters.network === 'connected' || filters.network === 'offline') qp.set('network', filters.network); else qp.delete('network')
    const qs = qp.toString()
    router.replace(qs ? `?${qs}` : `?tab=devices`)
  }, [filters, router, searchParams])

  useEffect(() => {
    if (columnOrder.length === 0) {
      const order = table.getAllLeafColumns().map(c => c.id)
      setColumnOrder(order)
    }
  }, [table, columnOrder.length])

  const [selectedGroup, setSelectedGroup] = useState<string>("")

  const saveAsGroup = useCallback(async () => {
    if (!currentOrganization) return;
    const name = typeof window !== 'undefined' ? window.prompt('Name this group') : undefined
    if (!name) return
    
    await createGroup({
      organizationId: currentOrganization._id,
      name,
      filters: {
        search: filters.search,
        category: filters.category,
        manufacturer: filters.manufacturer,
        classification: filters.classification,
        network: filters.network,
        hasPHI: filters.phi,
        tags: filters.tags
      },
      isSmartGroup: true
    })
  }, [createGroup, currentOrganization, filters])
  
  const handleGroupChange = useCallback((groupId: string) => {
    if (groupId === "none") {
      setSelectedGroup("");
      return;
    }
    const group = groups?.find((g: any) => g._id === groupId);
    if (group) {
      setSelectedGroup(groupId);
      setFilters({
         search: group.filters.search || "",
         category: group.filters.category || "all",
         manufacturer: group.filters.manufacturer || "all",
         classification: group.filters.classification || "all",
         network: group.filters.network || "all",
         phi: group.filters.hasPHI || "all",
         tags: group.filters.tags || []
      });
    }
  }, [groups])

  const saveCurrentView = useCallback(() => {
    const name = typeof window !== 'undefined' ? window.prompt('Name this view') : undefined
    if (!name) return
    const view: SavedView = { name, filters, columnVisibility, rowDensity, columnOrder }
    const next = [...savedViews.filter((v) => v.name !== name), view]
    setSavedViews(next)
    const orgId = currentOrganization ? currentOrganization._id : 'none'
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`deviceInventory:${orgId}:views`, JSON.stringify(next))
      }
    } catch {}
  }, [filters, columnVisibility, rowDensity, columnOrder, savedViews, currentOrganization])

  const applyView = useCallback((name: string) => {
    const v = savedViews.find((sv) => sv.name === name)
    if (!v) return
    setFilters(v.filters)
    setColumnVisibility(v.columnVisibility)
    setRowDensity(v.rowDensity)
    setColumnOrder(v.columnOrder)
  }, [savedViews])

  const deleteView = useCallback((name: string) => {
    const next = savedViews.filter(v => v.name !== name)
    setSavedViews(next)
    const orgId = currentOrganization ? currentOrganization._id : 'none'
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(`deviceInventory:${orgId}:views`, JSON.stringify(next))
      }
    } catch {}
  }, [savedViews, currentOrganization])

  const moveColumn = useCallback((id: string, dir: 'left'|'right') => {
    const idx = columnOrder.indexOf(id)
    if (idx < 0) return
    const target = dir === 'left' ? idx - 1 : idx + 1
    if (target < 0 || target >= columnOrder.length) return
    const next = [...columnOrder]
    const [item] = next.splice(idx, 1)
    next.splice(target, 0, item)
    setColumnOrder(next)
  }, [columnOrder])

  const confirmAssign = () => {
      if (!pendingAssign || !currentOrganization) return
      
      assignDeviceOwner({ 
          organizationId: currentOrganization._id, 
          deviceIds: pendingAssign.deviceIds as any, 
          ownerId: pendingAssign.ownerId as any,
          reason: assignReason 
      })
      .then(() => {
          invalidate();
          if (pendingAssign.type === 'bulk') {
             setRowSelection({});
          } else {
             setSelectedDevice((prev: any) => prev ? ({ ...prev, ownerId: pendingAssign.ownerId }) : prev);
          }
          setReasonDialogOpen(false)
          setPendingAssign(null)
      })
      .catch(() => {})
  }

  const handleBulkAssign = (ownerId: string | undefined) => {
      const selectedRows = table.getSelectedRowModel().rows
      const ids = selectedRows.map(r => (r.original as any)._id)
      if (!currentOrganization || ids.length === 0) return
      
      setPendingAssign({ type: 'bulk', ownerId, deviceIds: ids })
      setAssignReason('')
      setReasonDialogOpen(true)
  }

  if (!allDevices) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Device Inventory
          </CardTitle>
          <CardDescription>
            Loading medical devices...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card className="min-h-[75vh] h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          Device Inventory
        </CardTitle>
        <CardDescription>
          {filteredData.length} of {allDevices.length} devices
          {isPending && <span className="text-blue-600 ml-2">(Filtering...)</span>}
        </CardDescription>
        <div className="mt-2 flex items-center gap-2">
          <Select value={selectedGroup} onValueChange={handleGroupChange}>
             <SelectTrigger className="w-[200px] h-8">
                <SelectValue placeholder="Select Group" />
             </SelectTrigger>
             <SelectContent>
                <SelectItem value="none">All Devices</SelectItem>
                {groups?.map((g: any) => (
                  <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                ))}
             </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={saveAsGroup}>
            <Save className="h-4 w-4 mr-2" /> Save Group
          </Button>
          <Button variant="outline" size="sm" onClick={invalidate}>
            Refresh Data
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search devices..."
              value={filters.search}
              onChange={(e) => handleSearchInput(e.target.value)}
              className="pl-10 transition-all duration-200 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Filter controls */}
          <div className="flex flex-wrap gap-3 items-center flex-shrink-0">
            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
            >
              <SelectTrigger className="w-40 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50">
                <SelectValue placeholder="Device Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Device Types</SelectItem>
                {filterOptions.categories.map(category => (
                  <SelectItem 
                    key={category} 
                    value={category}
                    className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                  >
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.manufacturer}
              onValueChange={(value) => handleFilterChange('manufacturer', value)}
            >
              <SelectTrigger className="w-40 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {filterOptions.manufacturers.map(manufacturer => (
                  <SelectItem 
                    key={manufacturer} 
                    value={manufacturer}
                    className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                  >
                    {manufacturer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.classification}
              onValueChange={(value) => handleFilterChange('classification', value)}
            >
              <SelectTrigger className="w-40 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                {filterOptions.classifications.map(classification => (
                  <SelectItem 
                    key={classification} 
                    value={classification}
                    className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
                  >
                    {classification}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.network}
              onValueChange={(value) => handleFilterChange('network', value)}
            >
              <SelectTrigger className="w-32 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-blue-50 cursor-pointer transition-colors duration-150">Any Status</SelectItem>
                <SelectItem value="connected" className="hover:bg-blue-50 cursor-pointer transition-colors duration-150">Connected</SelectItem>
                <SelectItem value="offline" className="hover:bg-blue-50 cursor-pointer transition-colors duration-150">Offline</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.phi}
              onValueChange={(value) => handleFilterChange('phi', value)}
            >
              <SelectTrigger className="w-32 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50">
                <SelectValue placeholder="PHI Data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-blue-50 cursor-pointer transition-colors duration-150">Any PHI</SelectItem>
                <SelectItem value="yes" className="hover:bg-blue-50 cursor-pointer transition-colors duration-150">Has PHI</SelectItem>
                <SelectItem value="no" className="hover:bg-blue-50 cursor-pointer transition-colors duration-150">No PHI</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.owner || 'all'}
              onValueChange={(value) => handleFilterChange('owner', value)}
            >
              <SelectTrigger className="w-40 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50">
                <SelectValue placeholder="Owner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Owners</SelectItem>
                <SelectItem value="unassigned" className="text-yellow-600">
                    Unassigned ({filterOptions.unassignedCount})
                </SelectItem>
                {members?.map((m: any) => {
                    const count = filterOptions.ownerCounts.get(m.user?._id) || 0;
                    if (count === 0 && filters.owner !== m.user?._id) return null;
                    return (
                        <SelectItem key={m._id} value={m.user?._id || ''}>
                            {m.user?.name || m.user?.email || 'Unknown'} ({count})
                        </SelectItem>
                    )
                })}
              </SelectContent>
            </Select>

            <Select
              value={filters.department || 'all'}
              onValueChange={(value) => handleFilterChange('department', value)}
            >
              <SelectTrigger className="w-40 transition-all duration-200 hover:border-blue-300 hover:bg-blue-50/50">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="unassigned" className="text-yellow-600">
                    Unassigned ({filterOptions.unassignedDeptCount})
                </SelectItem>
                {Array.from(filterOptions.departmentCounts.entries()).map(([dept, count]) => {
                     if (dept === 'Unassigned') return null;
                     return (
                        <SelectItem key={dept} value={dept}>
                            {dept} ({count})
                        </SelectItem>
                     )
                })}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-32 justify-between font-normal">
                  {filters.tags && filters.tags.length > 0 
                    ? `${filters.tags.length} selected` 
                    : "Tags"}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filterOptions.tags.length === 0 && (
                  <div className="p-2 text-sm text-muted-foreground">No tags available</div>
                )}
                {filterOptions.tags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={filters.tags?.includes(tag)}
                    onCheckedChange={(checked) => {
                      const current = filters.tags || [];
                      const next = checked
                        ? [...current, tag]
                        : current.filter((t) => t !== tag);
                      handleFilterChange("tags", next);
                    }}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-300 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Layout
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Row density</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={rowDensity} onValueChange={(v) => setRowDensity(v as any)}>
                  <DropdownMenuRadioItem value="comfortable">Comfortable</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="compact">Compact</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Columns</DropdownMenuLabel>
                {table.getAllLeafColumns().map(col => (
                  <DropdownMenuCheckboxItem
                    key={col.id}
                    checked={col.getIsVisible()}
                    onCheckedChange={(checked) => col.toggleVisibility(!!checked)}
                  >
                    {col.id}
                  </DropdownMenuCheckboxItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Reorder</DropdownMenuLabel>
                {columnOrder.map(id => (
                  <DropdownMenuItem key={`order-${id}`} className="flex items-center justify-between gap-2">
                    <span className="text-sm">{id}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => moveColumn(id, 'left')}>↑</Button>
                      <Button variant="outline" size="sm" onClick={() => moveColumn(id, 'right')}>↓</Button>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  Saved Views
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={saveCurrentView}>Save current view</DropdownMenuItem>
                <DropdownMenuSeparator />
                {savedViews.length === 0 && (
                  <DropdownMenuItem disabled>No saved views</DropdownMenuItem>
                )}
                {savedViews.map(v => (
                  <DropdownMenuItem key={`apply-${v.name}`} onClick={() => applyView(v.name)}>
                    {v.name}
                  </DropdownMenuItem>
                ))}
                {savedViews.length > 0 && <DropdownMenuSeparator />}
                {savedViews.length > 0 && <DropdownMenuLabel>Delete Views</DropdownMenuLabel>}
                {savedViews.map(v => (
                  <DropdownMenuItem key={`delete-${v.name}`} onClick={() => deleteView(v.name)}>
                    Delete {v.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {Object.keys(rowSelection).length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Selected {Object.keys(rowSelection).length}</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1">
                      <User className="h-4 w-4 mr-1" /> Assign Owner
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
                    <DropdownMenuLabel>Select Owner</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => handleBulkAssign(undefined)}
                        className="text-yellow-600 cursor-pointer"
                    >
                        Unassign
                    </DropdownMenuItem>
                    {members?.map((m: any) => (
                        <DropdownMenuItem 
                            key={m.user?._id} 
                            onClick={() => handleBulkAssign(m.user?._id)}
                            className="cursor-pointer"
                        >
                            {m.user?.name || m.user?.email}
                        </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedRows = table.getSelectedRowModel().rows
                    const ids = selectedRows.map(r => (r.original as any)._id)
                    if (!currentOrganization || ids.length === 0) return
                    bulkUpdateStatus({ organizationId: currentOrganization._id, deviceIds: ids, status: 'maintenance' })
                      .then(() => invalidate())
                      .catch(() => {})
                  }}
                  className="flex items-center gap-1"
                >
                  Mark Maintenance
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedRows = table.getSelectedRowModel().rows
                    const ids = selectedRows.map(r => (r.original as any)._id)
                    if (!currentOrganization || ids.length === 0) return
                    bulkUpdateStatus({ organizationId: currentOrganization._id, deviceIds: ids, status: 'inactive' })
                      .then(() => invalidate())
                      .catch(() => {})
                  }}
                >
                  Mark Inactive
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedRows = table.getSelectedRowModel().rows
                    const ids = selectedRows.map(r => (r.original as any)._id)
                    if (!currentOrganization || ids.length === 0) return
                    bulkUpdateStatus({ organizationId: currentOrganization._id, deviceIds: ids, status: 'active' })
                      .then(() => invalidate())
                      .catch(() => {})
                  }}
                >
                  Mark Active
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedRows = table.getSelectedRowModel().rows
                    const header = ['name','entity','serialNumber','manufacturer','model','category','classification','ipAddress','onNetwork','hasPHI','cveCount']
                    const rows = selectedRows.map(r => {
                      const d = r.original as any
                      return {
                        name: d.name,
                        entity: d.entity,
                        serialNumber: d.serialNumber,
                        manufacturer: d.manufacturer,
                        model: d.model,
                        category: d.category,
                        classification: d.classification,
                        ipAddress: d.ipAddress || '',
                        onNetwork: d.deviceOnNetwork ? 'yes' : 'no',
                        hasPHI: d.hasPHI ? 'yes' : 'no',
                        cveCount: d.cveCount || 0,
                      }
                    })
                    const quote = (val: string) => '"' + String(val).replace(/"/g,'""') + '"'
                    const csv = [header.join(','), ...rows.map(r => header.map(h => quote((r as any)[h] ?? '')).join(','))].join('\n')
                    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'devices-selected.csv'
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                >
                  Export Selected
                </Button>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const rows = filteredData.map(d => ({
                  name: d.name,
                  entity: d.entity,
                  serialNumber: d.serialNumber,
                  manufacturer: d.manufacturer,
                  model: d.model,
                  category: d.category,
                  classification: d.classification,
                  ipAddress: (d as any).ipAddress || '',
                  onNetwork: d.deviceOnNetwork ? 'yes' : 'no',
                  hasPHI: d.hasPHI ? 'yes' : 'no',
                  cveCount: d.cveCount || 0,
                }))
                const header = Object.keys(rows[0] || {name:'',entity:'',serialNumber:'',manufacturer:'',model:'',category:'',classification:'',ipAddress:'',onNetwork:'',hasPHI:'',cveCount:''})
                const quote = (val: string) => '"' + String(val).replace(/"/g,'""') + '"'
                const csv = [header.join(','), ...rows.map(r => header.map(h => quote((r as any)[h] ?? '')).join(','))].join('\n')
                const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'devices-filtered.csv'
                a.click()
                URL.revokeObjectURL(url)
              }}
              className="flex items-center gap-2"
            >
              Export CSV
            </Button>
          </div>

          {/* Summary Stats for Filtered View */}
          {(filters.search || filters.category !== 'all' || filters.manufacturer !== 'all' || 
            filters.classification !== 'all' || filters.network !== 'all' || filters.phi !== 'all' || 
            (filters.tags && filters.tags.length > 0)) && (
            <div className="flex gap-4 text-xs text-muted-foreground bg-muted/50 p-2 rounded-md border border-muted items-center">
              <span className="font-semibold text-foreground">Summary:</span>
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">{filteredData.length}</span> Devices
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {filteredData.filter(d => d.deviceOnNetwork).length}
                </span> Online
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {filteredData.filter(d => d.hasPHI).length}
                </span> w/ PHI
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">
                  {filteredData.filter(d => (d.cveCount || 0) > 0).length}
                </span> Vulnerable
              </div>
            </div>
          )}

          {/* Virtualized table */}
<div className="flex-1 min-h-0">
  {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Filter className="h-12 w-12 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">No devices found</h3>
      <p className="text-sm text-center max-w-md">
        {filters.search || filters.category !== 'all' || filters.manufacturer !== 'all' || 
         filters.classification !== 'all' || filters.network !== 'all' || filters.phi !== 'all' ||
         (filters.tags && filters.tags.length > 0)
          ? 'Try adjusting your filters or search terms to find more devices.'
          : 'No devices are available in your organization.'}
      </p>
      {(filters.search || filters.category !== 'all' || filters.manufacturer !== 'all' || 
        filters.classification !== 'all' || filters.network !== 'all' || filters.phi !== 'all' ||
        (filters.tags && filters.tags.length > 0)) && (
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="mt-4 flex items-center gap-2"
        >
          <X className="h-4 w-4" />
          Clear All Filters
        </Button>
      )}
    </div>
  ) : (
    <div className="border rounded-lg overflow-hidden bg-card">
      {/* Sticky header */}
      <div className="bg-muted border-b sticky top-0 z-10">
        <div className="flex w-full">
          {table.getHeaderGroups().map(headerGroup => (
            headerGroup.headers.map(header => (
              <div
                key={header.id}
                className="p-3 text-left text-sm font-medium text-foreground border-r last:border-r-0"
                style={{ width: header.getSize() }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
              </div>
            ))
          ))}
        </div>
      </div>

      {/* Virtualized rows */}
      <div
        ref={tableContainerRef}
        className="overflow-auto h-[70vh]"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index]
            return (
              <div
                key={row.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <VirtualRow
                  row={row}
                  cells={row.getVisibleCells()}
                  density={rowDensity}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )}
</div>
        </div>
      </CardContent>
    </Card>
    {selectedDevice && (
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedDevice.name}</DialogTitle>
            <DialogDescription>
              {selectedDevice.entity || 'Unknown'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 text-sm bg-muted/30 p-4 rounded-lg">
              <div>
                <div className="text-muted-foreground text-xs mb-1">Serial</div>
                <div className="font-medium truncate" title={selectedDevice.serialNumber}>{selectedDevice.serialNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Manufacturer</div>
                <div className="font-medium truncate" title={selectedDevice.manufacturer}>{selectedDevice.manufacturer || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Model</div>
                <div className="font-medium truncate" title={selectedDevice.model}>{selectedDevice.model || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Category</div>
                <div className="font-medium truncate" title={selectedDevice.category}>{selectedDevice.category || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">IP Address</div>
                <div className="font-medium">{selectedDevice.ipAddress || 'N/A'}</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">OS Version</div>
                <div className="font-medium">{selectedDevice.osVersion || 'Unknown'}</div>
              </div>
              <div className="flex items-end">
                <Badge variant={selectedDevice.deviceOnNetwork ? 'default' : 'destructive'}>
                  {selectedDevice.deviceOnNetwork ? 'Connected' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-end">
                <Badge variant={selectedDevice.hasPHI ? 'destructive' : 'secondary'}>
                  {selectedDevice.hasPHI ? 'PHI' : 'No PHI'}
                </Badge>
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-lg space-y-3">
               <h3 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Assignment
               </h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Owner</label>
                      <Select 
                        value={selectedDevice.ownerId || "unassigned"} 
                        onValueChange={(val) => {
                             const newOwnerId = val === "unassigned" ? undefined : val;
                             if (!currentOrganization) return;
                             setPendingAssign({ type: 'single', ownerId: newOwnerId, deviceIds: [selectedDevice._id] })
                             setAssignReason('')
                             setReasonDialogOpen(true)
                        }}
                      >
                        <SelectTrigger className="h-8 bg-background">
                           <SelectValue placeholder="Select Owner" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {members?.map((m: any) => (
                                <SelectItem key={m._id} value={m.user?._id}>
                                    {m.user?.name || m.user?.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Department</label>
                      <div className="text-sm font-medium h-8 flex items-center">
                          {selectedDevice.ownerId && members?.find((m: any) => m.user?._id === selectedDevice.ownerId)?.user?.department || 'Unassigned'}
                      </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Location</label>
                      <div className="text-sm font-medium h-8 flex items-center">
                          {selectedDevice.ownerId && members?.find((m: any) => m.user?._id === selectedDevice.ownerId)?.user?.location || 'Unassigned'}
                      </div>
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Contact</label>
                      <div className="text-sm font-medium h-8 flex items-center truncate">
                          {selectedDevice.ownerId && members?.find((m: any) => m.user?._id === selectedDevice.ownerId)?.user?.email || '-'}
                      </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                 <DeviceTags deviceId={selectedDevice._id} tags={selectedDevice.tags} />
                 
                 <ErrorBoundary fallback={<div className="text-sm text-muted-foreground">Error loading history.</div>}>
                    <DeviceHistory deviceId={selectedDevice._id} />
                 </ErrorBoundary>
              </div>

              <div>
                <ErrorBoundary
                  fallback={<div className="p-4 border border-muted rounded-lg text-sm text-muted-foreground bg-muted/30">Vulnerability functions are not deployed yet.</div>}
                >
                  <DeviceCVEDetails deviceId={selectedDevice._id} />
                </ErrorBoundary>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )}
    <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Owner</DialogTitle>
          <DialogDescription>
            {pendingAssign?.ownerId ? 'Please provide a reason for this assignment change.' : 'Please provide a reason for unassigning this device.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason (Optional)
            </label>
            <Input
              id="reason"
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
              placeholder="e.g. Employee left, New hire, Load balancing"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setReasonDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={confirmAssign}>
            Confirm Assignment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
