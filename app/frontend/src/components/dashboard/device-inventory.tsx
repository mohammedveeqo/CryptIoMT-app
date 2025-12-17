'use client'

import { useState, useMemo, useCallback, useRef, useTransition, memo, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react'
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
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
}

const columnHelper = createColumnHelper<Device>()

// Memoized virtual row component
const VirtualRow = memo(({ row, cells, onClick, density }: { row: any; cells: any[]; onClick?: () => void; density: 'comfortable' | 'compact' }) => (
  <div className="flex w-full border-b hover:bg-muted/70 transition-colors cursor-pointer" onClick={onClick}>
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
  const bulkUpdateStatus = useMutation(api.medicalDevices.bulkUpdateDeviceStatus)
  
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
  }
  type SavedView = {
    name: string;
    filters: DeviceFilters;
    columnVisibility: Record<string, boolean>;
    rowDensity: 'comfortable' | 'compact';
    columnOrder: string[];
  }
  const [savedViews, setSavedViews] = useState<SavedView[]>([])
  const [filters, setFilters] = useState<DeviceFilters>({
    search: '',
    category: 'all',
    manufacturer: 'all',
    classification: 'all',
    network: 'all',
    phi: 'all'
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
            checked={table.getIsAllRowsSelected() || (table.getIsSomeRowsSelected() ? true : false)}
            onChange={(e) => table.toggleAllRowsSelected(!!e.target.checked)}
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
    if (!allDevices) return []
    
    return allDevices.filter(device => {
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
      
      return true
    })
  }, [allDevices, filters])

  // Cascading filter options based on current selections
  const filterOptions = useMemo(() => {
    if (!allDevices) return { categories: [], manufacturers: [], classifications: [] }
    
    // Start with all devices, then progressively filter based on current selections
    let availableDevices = allDevices
    
    // Apply search filter first
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      availableDevices = availableDevices.filter(device => 
        device.name.toLowerCase().includes(searchLower) ||
        device.entity.toLowerCase().includes(searchLower) ||
        device.manufacturer.toLowerCase().includes(searchLower) ||
        device.serialNumber.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply other filters to determine available options
    if (filters.category !== 'all') {
      availableDevices = availableDevices.filter(device => device.category === filters.category)
    }
    if (filters.manufacturer !== 'all') {
      availableDevices = availableDevices.filter(device => device.manufacturer === filters.manufacturer)
    }
    if (filters.classification !== 'all') {
      availableDevices = availableDevices.filter(device => device.classification === filters.classification)
    }
    if (filters.network === 'connected') {
      availableDevices = availableDevices.filter(device => device.deviceOnNetwork)
    } else if (filters.network === 'offline') {
      availableDevices = availableDevices.filter(device => !device.deviceOnNetwork)
    }
    if (filters.phi === 'yes') {
      availableDevices = availableDevices.filter(device => device.hasPHI)
    } else if (filters.phi === 'no') {
      availableDevices = availableDevices.filter(device => !device.hasPHI)
    }
    
    const categorySet = new Set<string>()
    const manufacturerSet = new Set<string>()
    const classificationSet = new Set<string>()
    
    availableDevices.forEach(device => {
      categorySet.add(device.category)
      manufacturerSet.add(device.manufacturer)
      classificationSet.add(device.classification)
    })
    
    return {
      categories: Array.from(categorySet).sort(),
      manufacturers: Array.from(manufacturerSet).sort(),
      classifications: Array.from(classificationSet).sort()
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

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      manufacturer: 'all',
      classification: 'all',
      network: 'all',
      phi: 'all'
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
        <div className="mt-2">
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

          {/* Virtualized table */}
<div className="flex-1 min-h-0">
  {filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <Filter className="h-12 w-12 mb-4 text-muted-foreground" />
      <h3 className="text-lg font-medium mb-2">No devices found</h3>
      <p className="text-sm text-center max-w-md">
        {filters.search || filters.category !== 'all' || filters.manufacturer !== 'all' || 
         filters.classification !== 'all' || filters.network !== 'all' || filters.phi !== 'all'
          ? 'Try adjusting your filters or search terms to find more devices.'
          : 'No devices are available in your organization.'}
      </p>
      {(filters.search || filters.category !== 'all' || filters.manufacturer !== 'all' || 
        filters.classification !== 'all' || filters.network !== 'all' || filters.phi !== 'all') && (
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
                  onClick={() => {
                    const dev = row.original
                    setSelectedDevice(dev)
                    setDetailsOpen(true)
                  }}
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
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>{selectedDevice.name}</SheetTitle>
            <SheetDescription>
              {selectedDevice.entity || 'Unknown'}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Serial</div>
                <div className="font-medium">{selectedDevice.serialNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Manufacturer</div>
                <div className="font-medium">{selectedDevice.manufacturer || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Model</div>
                <div className="font-medium">{selectedDevice.model || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Category</div>
                <div className="font-medium">{selectedDevice.category || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">IP Address</div>
                <div className="font-medium">{selectedDevice.ipAddress || 'N/A'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">OS Version</div>
                <div className="font-medium">{selectedDevice.osVersion || 'Unknown'}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant={selectedDevice.deviceOnNetwork ? 'default' : 'destructive'}>
                  {selectedDevice.deviceOnNetwork ? 'Connected' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={selectedDevice.hasPHI ? 'destructive' : 'secondary'}>
                  {selectedDevice.hasPHI ? 'PHI' : 'No PHI'}
                </Badge>
              </div>
            </div>

            <ErrorBoundary
              fallback={<div className="mt-4 p-4 border border-muted rounded-lg text-sm text-muted-foreground bg-muted/30">Vulnerability functions are not deployed yet.</div>}
            >
              <DeviceCVEDetails deviceId={selectedDevice._id} />
            </ErrorBoundary>
          </div>
        </SheetContent>
      </Sheet>
    )}
    </>
  )
}
