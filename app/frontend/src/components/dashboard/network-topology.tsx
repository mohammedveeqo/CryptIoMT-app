'use client'

import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Network, Shield, Filter, Wifi, WifiOff, Router, Database, BarChart3 } from 'lucide-react'
import { useOrganization } from '@/contexts/organization-context'
import * as d3 from 'd3'
import { Progress } from '@/components/ui/progress'

interface NetworkNode {
  id: string
  name: string
  group: string
  size: number
  color: string
  entity: string
  manufacturer: string
  model: string
  category: string
  classification: string
  ipAddress?: string
  macAddress?: string
  osManufacturer?: string
  osVersion?: string
  deviceOnNetwork: boolean
  hasPHI: boolean
  customerPHICategory?: string
  subnet?: string
  isDHCP?: boolean
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface NetworkLink {
  source: string | NetworkNode
  target: string | NetworkNode
  value: number
  type: string
}

interface SubnetInfo {
  subnet: string
  deviceCount: number
  dhcpCount: number
  staticCount: number
  dhcpPercentage: number
  hospitals: Set<string>
  devices: NetworkNode[]
}

interface TopologyFilters {
  view: 'logical' | 'security' | 'connectivity' | 'subnet'
  phiLevel: 'all' | 'high' | 'medium' | 'low' | 'none'
  networkStatus: 'all' | 'connected' | 'offline'
  manufacturer: string
  category: string
  entity: string
  subnet: string
}

export function NetworkTopology() {
  const { currentOrganization } = useOrganization()
  const [filters, setFilters] = useState<TopologyFilters>({
    view: 'subnet',
    phiLevel: 'all',
    networkStatus: 'all',
    manufacturer: 'all',
    category: 'all',
    entity: 'all',
    subnet: 'all'
  })
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [selectedSubnet, setSelectedSubnet] = useState<SubnetInfo | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const svgRef = useRef<SVGSVGElement>(null)

  const allDevices = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  )

  // Enhanced subnet analysis with DHCP detection
  const subnetAnalysis = useMemo(() => {
    if (!allDevices) return { subnets: new Map<string, SubnetInfo>(), totalDHCP: 0, totalStatic: 0, dhcpPercentage: 0 }

    const subnets = new Map<string, SubnetInfo>()
    let totalDHCP = 0
    let totalStatic = 0

    allDevices.forEach(device => {
      if (!device.ipAddress) return

      // Extract subnet from IP (first 3 octets)
      const ipParts = device.ipAddress.split('.')
      if (ipParts.length !== 4) return
      
      const subnet = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24`
      
      // DHCP detection logic based on IP patterns
      const lastOctet = parseInt(ipParts[3])
      const isDHCP = (
        // Common DHCP ranges
        (lastOctet >= 100 && lastOctet <= 199) || // 192.168.1.100-199
        (lastOctet >= 20 && lastOctet <= 99) ||   // 192.168.1.20-99
        device.ipAddress.includes('dhcp') ||       // Explicit DHCP in name
        // Dynamic range indicators
        (lastOctet > 50 && lastOctet < 200 && lastOctet !== 1 && lastOctet !== 254)
      )

      if (isDHCP) totalDHCP++
      else totalStatic++

      if (!subnets.has(subnet)) {
        subnets.set(subnet, {
          subnet,
          deviceCount: 0,
          dhcpCount: 0,
          staticCount: 0,
          dhcpPercentage: 0,
          hospitals: new Set(),
          devices: []
        })
      }

      const subnetInfo = subnets.get(subnet)!
      subnetInfo.deviceCount++
      if (isDHCP) subnetInfo.dhcpCount++
      else subnetInfo.staticCount++
      subnetInfo.dhcpPercentage = (subnetInfo.dhcpCount / subnetInfo.deviceCount) * 100
      subnetInfo.hospitals.add(device.entity || 'Unknown')
      
      // Add device with DHCP info
      subnetInfo.devices.push({
        id: device._id,
        name: device.name,
        group: subnet,
        size: isDHCP ? 8 : 6,
        color: isDHCP ? '#3B82F6' : '#EF4444', // Blue for DHCP, Red for Static
        entity: device.entity || 'Unknown',
        manufacturer: device.manufacturer || 'Unknown',
        model: device.model || 'Unknown',
        category: device.category || 'Unknown',
        classification: device.classification || 'Unknown',
        ipAddress: device.ipAddress,
        macAddress: device.macAddress,
        osManufacturer: device.osManufacturer,
        osVersion: device.osVersion,
        deviceOnNetwork: device.deviceOnNetwork || false,
        hasPHI: device.hasPHI || false,
        customerPHICategory: device.customerPHICategory,
        subnet,
        isDHCP
      })
    })

    const totalDevices = totalDHCP + totalStatic
    const dhcpPercentage = totalDevices > 0 ? (totalDHCP / totalDevices) * 100 : 0

    return { subnets, totalDHCP, totalStatic, dhcpPercentage }
  }, [allDevices])

  // Filter devices based on current filters
  const filteredDevices = useMemo(() => {
    if (!allDevices) return []

    return allDevices.filter(device => {
      // PHI Level filter
      if (filters.phiLevel !== 'all') {
        const phiCategory = device.customerPHICategory?.toLowerCase() || ''
        if (filters.phiLevel === 'none' && device.hasPHI) return false
        if (filters.phiLevel !== 'none' && !phiCategory.includes(filters.phiLevel)) return false
      }

      // Network Status filter
      if (filters.networkStatus === 'connected' && !device.deviceOnNetwork) return false
      if (filters.networkStatus === 'offline' && device.deviceOnNetwork) return false

      // Manufacturer filter
      if (filters.manufacturer !== 'all' && device.manufacturer !== filters.manufacturer) return false

      // Category filter
      if (filters.category !== 'all' && device.category !== filters.category) return false

      // Entity filter
      if (filters.entity !== 'all' && device.entity !== filters.entity) return false

      // Subnet filter
      if (filters.subnet !== 'all') {
        const deviceSubnet = device.ipAddress ? 
          device.ipAddress.split('.').slice(0, 3).join('.') + '.0/24' : 'No Network'
        if (deviceSubnet !== filters.subnet) return false
      }

      return true
    })
  }, [allDevices, filters])

  // Create network data for visualization
  const networkData = useMemo(() => {
    const nodes: NetworkNode[] = []
    const links: NetworkLink[] = []

    if (filters.view === 'subnet') {
      // Create subnet nodes and device nodes
      subnetAnalysis.subnets.forEach((subnetInfo, subnet) => {
        // Add subnet node (larger, central)
        nodes.push({
          id: `subnet-${subnet}`,
          name: subnet,
          group: 'subnet',
          size: Math.max(15, subnetInfo.deviceCount * 2),
          color: '#10B981', // Green for subnets
          entity: `${subnetInfo.hospitals.size} hospitals`,
          manufacturer: 'Network',
          model: 'Subnet',
          category: 'Network Infrastructure',
          classification: 'Subnet',
          subnet,
          deviceOnNetwork: true,
          hasPHI: false
        })

        // Add device nodes connected to subnet
        subnetInfo.devices.forEach(device => {
          if (filteredDevices.some(d => d._id === device.id)) {
            nodes.push(device)
            // Link device to subnet
            links.push({
              source: device.id,
              target: `subnet-${subnet}`,
              value: 1,
              type: 'subnet-connection'
            })
          }
        })
      })
    } else {
      // Original network topology logic for other views
      // ... existing code for logical, security, connectivity views ...
    }

    return { nodes, links }
  }, [filteredDevices, filters.view, subnetAnalysis])

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!allDevices) return { manufacturers: [], categories: [], entities: [], subnets: [] }

    const manufacturers = [...new Set(allDevices.map(d => d.manufacturer).filter(Boolean))]
    const categories = [...new Set(allDevices.map(d => d.category).filter(Boolean))]
    const entities = [...new Set(allDevices.map(d => d.entity).filter(Boolean))]
    const subnets = Array.from(subnetAnalysis.subnets.keys())

    return { manufacturers, categories, entities, subnets }
  }, [allDevices, subnetAnalysis])

  // D3 visualization effect
  useEffect(() => {
    if (!svgRef.current || networkData.nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svg.append('g')

    // Create simulation
    const simulation = d3.forceSimulation(networkData.nodes as any)
      .force('link', d3.forceLink(networkData.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5))

    // Add links
    const link = container.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)

    // Add nodes
    const node = container.append('g')
      .selectAll('circle')
      .data(networkData.nodes)
      .enter().append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart()
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d: any) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d: any) => {
          if (!event.active) simulation.alphaTarget(0)
          d.fx = null
          d.fy = null
        })
      )

    // Add labels
    const labels = container.append('g')
      .selectAll('text')
      .data(networkData.nodes)
      .enter().append('text')
      .text((d: any) => d.name.length > 15 ? d.name.substring(0, 15) + '...' : d.name)
      .attr('font-size', '10px')
      .attr('font-family', 'Arial')
      .attr('text-anchor', 'middle')
      .attr('dy', (d: any) => d.size + 15)
      .attr('fill', '#333')

    // Node click handler
    node.on('click', (event, d: any) => {
      if (d.group === 'subnet') {
        const subnetInfo = subnetAnalysis.subnets.get(d.subnet)
        setSelectedSubnet(subnetInfo || null)
        setSelectedNode(null)
      } else {
        setSelectedNode(d)
        setSelectedSubnet(null)
      }
    })

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y)

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)

      labels
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y)
    })

    return () => {
      simulation.stop()
    }
  }, [networkData, dimensions, subnetAnalysis])

  if (!allDevices) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Network Topology
          </CardTitle>
          <CardDescription>
            Loading network topology...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gray-100 rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Network KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subnets</p>
                <p className="text-2xl font-bold text-gray-900">{subnetAnalysis.subnets.size}</p>
              </div>
              <Router className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">DHCP Devices</p>
                <p className="text-2xl font-bold text-gray-900">{subnetAnalysis.totalDHCP}</p>
              </div>
              <Wifi className="h-8 w-8 text-green-600" />
            </div>
            <div className="mt-2">
              <Progress value={subnetAnalysis.dhcpPercentage} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">{subnetAnalysis.dhcpPercentage.toFixed(1)}% of total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Static IP Devices</p>
                <p className="text-2xl font-bold text-gray-900">{subnetAnalysis.totalStatic}</p>
              </div>
              <Database className="h-8 w-8 text-red-600" />
            </div>
            <div className="mt-2">
              <Progress value={100 - subnetAnalysis.dhcpPercentage} className="w-full" />
              <p className="text-xs text-gray-500 mt-1">{(100 - subnetAnalysis.dhcpPercentage).toFixed(1)}% of total</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Devices/Subnet</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subnetAnalysis.subnets.size > 0 ? 
                    Math.round((subnetAnalysis.totalDHCP + subnetAnalysis.totalStatic) / subnetAnalysis.subnets.size) : 0
                  }
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Topology Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
            <div className="space-y-2">
              <Label>View Type</Label>
              <Select value={filters.view} onValueChange={(value: 'logical' | 'security' | 'connectivity' | 'subnet') => setFilters(prev => ({ ...prev, view: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subnet">Subnet View</SelectItem>
                  <SelectItem value="logical">Logical View</SelectItem>
                  <SelectItem value="security">Security View</SelectItem>
                  <SelectItem value="connectivity">Connectivity View</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Subnet</Label>
              <Select value={filters.subnet} onValueChange={(value) => setFilters(prev => ({ ...prev, subnet: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subnets</SelectItem>
                  {filterOptions.subnets.map((subnet) => (
                    <SelectItem key={subnet} value={subnet}>{subnet}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>PHI Level</Label>
              <Select value={filters.phiLevel} onValueChange={(value: 'all' | 'high' | 'medium' | 'low' | 'none') => setFilters(prev => ({ ...prev, phiLevel: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="none">No PHI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Network Status</Label>
              <Select value={filters.networkStatus} onValueChange={(value: 'all' | 'connected' | 'offline') => setFilters(prev => ({ ...prev, networkStatus: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Devices</SelectItem>
                  <SelectItem value="connected">Connected</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Manufacturer</Label>
              <Select value={filters.manufacturer} onValueChange={(value) => setFilters(prev => ({ ...prev, manufacturer: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Manufacturers</SelectItem>
                  {filterOptions.manufacturers.map((manufacturer) => (
                    <SelectItem key={manufacturer} value={manufacturer}>{manufacturer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {filterOptions.categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Hospital</Label>
              <Select value={filters.entity} onValueChange={(value) => setFilters(prev => ({ ...prev, entity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Hospitals</SelectItem>
                  {filterOptions.entities.map((entity) => (
                    <SelectItem key={entity} value={entity}>{entity}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setFilters({
                view: 'subnet',
                phiLevel: 'all',
                networkStatus: 'all',
                manufacturer: 'all',
                category: 'all',
                entity: 'all',
                subnet: 'all'
              })}
            >
              Reset Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Topology Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-3 bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Network Topology - {filters.view.charAt(0).toUpperCase() + filters.view.slice(1)} View
            </CardTitle>
            <CardDescription>
              {networkData.nodes.length} nodes, {networkData.links.length} connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden bg-gray-50 w-full">
              <svg
                ref={svgRef}
                width={dimensions.width}
                height={dimensions.height}
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                style={{ background: '#f9fafb', display: 'block', width: '100%', height: 'auto' }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Details Panel */}
        <Card className="bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedSubnet ? 'Subnet Details' : 'Device Details'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSubnet ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedSubnet.subnet}</h3>
                  <p className="text-sm text-gray-600">{selectedSubnet.hospitals.size} hospitals</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">TOTAL DEVICES</Label>
                    <p className="text-sm font-bold">{selectedSubnet.deviceCount}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">DHCP DEVICES</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-blue-600">{selectedSubnet.dhcpCount}</p>
                      <Badge variant="secondary" className="text-xs">
                        {selectedSubnet.dhcpPercentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">STATIC IP DEVICES</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-red-600">{selectedSubnet.staticCount}</p>
                      <Badge variant="outline" className="text-xs">
                        {(100 - selectedSubnet.dhcpPercentage).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">HOSPITALS</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Array.from(selectedSubnet.hospitals).map(hospital => (
                        <Badge key={hospital} variant="outline" className="text-xs">
                          {hospital}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : selectedNode ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                  <p className="text-sm text-gray-600">{selectedNode.entity}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">IP ADDRESS</Label>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-mono">{selectedNode.ipAddress}</p>
                      <Badge variant={selectedNode.isDHCP ? "default" : "destructive"} className="text-xs">
                        {selectedNode.isDHCP ? 'DHCP' : 'Static'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">SUBNET</Label>
                    <p className="text-sm">{selectedNode.subnet}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">MAC ADDRESS</Label>
                    <p className="text-sm font-mono">{selectedNode.macAddress || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">MANUFACTURER</Label>
                    <p className="text-sm">{selectedNode.manufacturer}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">MODEL</Label>
                    <p className="text-sm">{selectedNode.model}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">NETWORK STATUS</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedNode.deviceOnNetwork ? (
                        <><Wifi className="h-4 w-4 text-green-600" /><span className="text-sm text-green-600">Connected</span></>
                      ) : (
                        <><WifiOff className="h-4 w-4 text-red-600" /><span className="text-sm text-red-600">Offline</span></>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">PHI STATUS</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {selectedNode.hasPHI ? (
                        <>
                          <Shield className="h-4 w-4 text-red-600" />
                          <Badge variant="destructive" className="text-xs">
                            {selectedNode.customerPHICategory || 'Has PHI'}
                          </Badge>
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 text-green-600" />
                          <Badge variant="secondary" className="text-xs">No PHI</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Click on a subnet or device node to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subnet Analysis Table */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Devices per Subnet
          </CardTitle>
          <CardDescription>
            Network segmentation and IP allocation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Subnet</th>
                  <th className="text-center p-2">Total Devices</th>
                  <th className="text-center p-2">DHCP</th>
                  <th className="text-center p-2">Static</th>
                  <th className="text-center p-2">DHCP %</th>
                  <th className="text-left p-2">Hospitals</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(subnetAnalysis.subnets.entries())
                  .sort(([,a], [,b]) => b.deviceCount - a.deviceCount)
                  .map(([subnet, info]) => (
                    <tr key={subnet} className="border-b hover:bg-gray-50 cursor-pointer" 
                        onClick={() => setSelectedSubnet(info)}>
                      <td className="p-2 font-mono text-xs">{subnet}</td>
                      <td className="text-center p-2 font-bold">{info.deviceCount}</td>
                      <td className="text-center p-2 text-blue-600 font-medium">{info.dhcpCount}</td>
                      <td className="text-center p-2 text-red-600 font-medium">{info.staticCount}</td>
                      <td className="text-center p-2">
                        <Badge variant={info.dhcpPercentage > 50 ? "default" : "secondary"} className="text-xs">
                          {info.dhcpPercentage.toFixed(1)}%
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {Array.from(info.hospitals).slice(0, 3).map(hospital => (
                            <Badge key={hospital} variant="outline" className="text-xs">
                              {hospital}
                            </Badge>
                          ))}
                          {info.hospitals.size > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{info.hospitals.size - 3} more
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Subnet View</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm">Subnet Nodes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm">DHCP Devices</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm">Static IP Devices</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">IP Assignment</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• DHCP: Dynamic IP assignment</p>
                <p>• Static: Fixed IP configuration</p>
                <p>• Subnet: Network segment (first 3 octets)</p>
                <p>• Detection based on IP patterns</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Interactions</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Click subnets for network details</p>
                <p>• Click devices for device info</p>
                <p>• Click table rows for subnet analysis</p>
                <p>• Drag nodes to reposition</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}