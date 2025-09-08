'use client'

import { useState, useMemo, useCallback, useRef, useTransition, memo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Search, Filter, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { useOrganization } from '@/contexts/organization-context'
import { Skeleton } from '@/components/ui/skeleton'
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
}

const columnHelper = createColumnHelper<Device>()

// Memoized virtual row component
const VirtualRow = memo(({ row, cells }: { row: any; cells: any[] }) => (
  <div className="flex w-full border-b hover:bg-gray-50 hover:bg-opacity-75 transition-colors">
    {cells.map(cell => (
      <div
        key={cell.id}
        className="p-3 flex items-center truncate"
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
  const [isPending, startTransition] = useTransition()
  const tableContainerRef = useRef<HTMLDivElement>(null)
  
  // State management
  const [sorting, setSorting] = useState<SortingState>([])
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    manufacturer: 'all',
    classification: 'all',
    network: 'all',
    phi: 'all'
  })

  // Fetch devices data
  const allDevices = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : 'skip'
  )

  // Memoized column definitions
  const columns = useMemo<ColumnDef<Device, any>[]>(
    () => [
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
    state: { sorting },
    onSortingChange: setSorting,
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 53,
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

  if (!allDevices) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
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
    <Card className="bg-white/60 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Device Inventory
        </CardTitle>
        <CardDescription>
          {filteredData.length} of {allDevices.length} devices
          {isPending && <span className="text-blue-600 ml-2">(Filtering...)</span>}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search input */}
          <div className="relative flex-shrink-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
          </div>

          {/* Virtualized table */}
{/* Virtualized table */}
<div className="flex-1 min-h-0">
  {filteredData.length === 0 ? (
    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
      <Filter className="h-12 w-12 mb-4 text-gray-300" />
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
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Sticky header */}
      <div className="bg-gray-50 border-b sticky top-0 z-10">
        <div className="flex w-full">
          {table.getHeaderGroups().map(headerGroup => (
            headerGroup.headers.map(header => (
              <div
                key={header.id}
                className="p-3 text-left text-sm font-medium text-gray-700 border-r last:border-r-0"
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
        className="overflow-auto"
        style={{ height: '400px' }}
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
  )
}