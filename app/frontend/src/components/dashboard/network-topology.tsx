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
import { Network, Shield, Filter, Wifi, WifiOff } from 'lucide-react'
import { useOrganization } from '@/contexts/organization-context'
import * as d3 from 'd3'

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

interface TopologyFilters {
  view: 'logical' | 'security' | 'connectivity'
  phiLevel: 'all' | 'high' | 'medium' | 'low' | 'none'
  networkStatus: 'all' | 'connected' | 'offline'
  manufacturer: string
  category: string
  entity: string
}

export function NetworkTopology() {
  const { currentOrganization } = useOrganization()
  const allDevices = useQuery(api.medicalDevices.getAllMedicalDevices, 
    currentOrganization ? { organizationId: currentOrganization._id } : 'skip'
  )

  const svgRef = useRef<SVGSVGElement>(null)
  const [filters, setFilters] = useState<TopologyFilters>({
    view: 'logical',
    phiLevel: 'all',
    networkStatus: 'all',
    manufacturer: 'all',
    category: 'all',
    entity: 'all'
  })

  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Generate network data from devices
  const networkData = useMemo(() => {
    if (!allDevices) return { nodes: [], links: [] }

    // Filter devices based on current filters
    const filteredDevices = allDevices.filter(device => {
      if (filters.phiLevel !== 'all') {
        if (filters.phiLevel === 'none' && device.hasPHI) return false
        if (filters.phiLevel === 'high' && device.customerPHICategory !== 'High') return false
        if (filters.phiLevel === 'medium' && device.customerPHICategory !== 'Medium') return false
        if (filters.phiLevel === 'low' && device.customerPHICategory !== 'Low') return false
      }
      if (filters.networkStatus === 'connected' && !device.deviceOnNetwork) return false
      if (filters.networkStatus === 'offline' && device.deviceOnNetwork) return false
      if (filters.manufacturer !== 'all' && device.manufacturer !== filters.manufacturer) return false
      if (filters.category !== 'all' && device.category !== filters.category) return false
      if (filters.entity !== 'all' && device.entity !== filters.entity) return false
      return true
    })

    // Create nodes
    const nodes: NetworkNode[] = filteredDevices.map(device => {
      let color = '#64748b' // Default gray
      let size = 8

      // Color coding based on current view
      switch (filters.view) {
        case 'security':
          if (device.hasPHI) {
            switch (device.customerPHICategory) {
              case 'High': color = '#dc2626'; size = 12; break // Red
              case 'Medium': color = '#ea580c'; size = 10; break // Orange
              case 'Low': color = '#eab308'; size = 8; break // Yellow
              default: color = '#16a34a'; size = 6; break // Green
            }
          } else {
            color = '#16a34a' // Green for no PHI
            size = 6
          }
          break
        case 'connectivity':
          color = device.deviceOnNetwork ? '#2563eb' : '#dc2626' // Blue connected, Red offline
          size = device.deviceOnNetwork ? 10 : 6
          break
        case 'logical':
        default:
          // Color by manufacturer
          const manufacturerColors: Record<string, string> = {
            'GE Healthcare': '#3b82f6',
            'Philips': '#8b5cf6',
            'Siemens': '#06b6d4',
            'Medtronic': '#10b981',
            'Abbott': '#f59e0b',
            'Boston Scientific': '#ef4444',
          }
          color = manufacturerColors[device.manufacturer] || '#64748b'
          size = 8
      }

      // Extract subnet from IP address
      const subnet = device.ipAddress ? 
        device.ipAddress.split('.').slice(0, 3).join('.') + '.0/24' : 
        'No Network'

      return {
        id: device._id,
        name: device.name,
        group: filters.view === 'logical' ? device.entity : 
               filters.view === 'security' ? (device.hasPHI ? 'PHI Devices' : 'Non-PHI Devices') :
               device.deviceOnNetwork ? 'Connected' : 'Offline',
        size,
        color,
        entity: device.entity,
        manufacturer: device.manufacturer,
        model: device.model,
        category: device.category,
        classification: device.classification,
        ipAddress: device.ipAddress,
        macAddress: device.macAddress,
        osManufacturer: device.osManufacturer,
        osVersion: device.osVersion,
        deviceOnNetwork: device.deviceOnNetwork,
        hasPHI: device.hasPHI,
        customerPHICategory: device.customerPHICategory,
        subnet
      }
    })

    // Create links based on relationships
    const links: NetworkLink[] = []

    // Create links based on current view
    switch (filters.view) {
      case 'connectivity':
        // Link devices in same subnet
        const subnetGroups = new Map<string, NetworkNode[]>()
        nodes.forEach(node => {
          if (node.subnet && node.subnet !== 'No Network') {
            if (!subnetGroups.has(node.subnet)) {
              subnetGroups.set(node.subnet, [])
            }
            subnetGroups.get(node.subnet)!.push(node)
          }
        })
        
        subnetGroups.forEach(subnetNodes => {
          for (let i = 0; i < subnetNodes.length; i++) {
            for (let j = i + 1; j < subnetNodes.length; j++) {
              links.push({
                source: subnetNodes[i].id,
                target: subnetNodes[j].id,
                value: 1,
                type: 'subnet'
              })
            }
          }
        })
        break
        
      case 'logical':
        // Link devices by entity/hospital
        const entityGroups = new Map<string, NetworkNode[]>()
        nodes.forEach(node => {
          if (!entityGroups.has(node.entity)) {
            entityGroups.set(node.entity, [])
          }
          entityGroups.get(node.entity)!.push(node)
        })
        
        entityGroups.forEach(entityNodes => {
          // Create hub-and-spoke pattern for each entity
          if (entityNodes.length > 1) {
            const hub = entityNodes[0]
            for (let i = 1; i < entityNodes.length; i++) {
              links.push({
                source: hub.id,
                target: entityNodes[i].id,
                value: 1,
                type: 'entity'
              })
            }
          }
        })
        break
        
      case 'security':
        // Link devices with similar PHI risk levels
        const phiGroups = new Map<string, NetworkNode[]>()
        nodes.forEach(node => {
          const phiGroup = node.hasPHI ? (node.customerPHICategory || 'Unknown') : 'No PHI'
          if (!phiGroups.has(phiGroup)) {
            phiGroups.set(phiGroup, [])
          }
          phiGroups.get(phiGroup)!.push(node)
        })
        
        phiGroups.forEach(phiNodes => {
          // Create connections between devices with same PHI level
          for (let i = 0; i < phiNodes.length && i < 5; i++) {
            for (let j = i + 1; j < phiNodes.length && j < 5; j++) {
              links.push({
                source: phiNodes[i].id,
                target: phiNodes[j].id,
                value: 1,
                type: 'phi-level'
              })
            }
          }
        })
        break
    }

    return { nodes, links }
  }, [allDevices, filters])

  // Filter options
  const filterOptions = useMemo(() => {
    if (!allDevices) return { manufacturers: [], categories: [], entities: [] }
    
    const manufacturers = [...new Set(allDevices.map(d => d.manufacturer))].sort()
    const categories = [...new Set(allDevices.map(d => d.category))].sort()
    const entities = [...new Set(allDevices.map(d => d.entity))].sort()
    
    return { manufacturers, categories, entities }
  }, [allDevices])

  // D3 Force Simulation
  useEffect(() => {
    if (!svgRef.current || !networkData.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = dimensions.width
    const height = dimensions.height

    // Create simulation
    const simulation = d3.forceSimulation(networkData.nodes as any)
      .force('link', d3.forceLink(networkData.links).id((d: any) => d.id).distance(50))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 2))

    // Create container group
    const container = svg.append('g')

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        container.attr('transform', event.transform)
      })

    svg.call(zoom as any)

    // Create links
    const link = container.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', 2)

    // Create nodes
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
      setSelectedNode(d)
    })

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')

    node.on('mouseover', (event, d: any) => {
      tooltip.style('visibility', 'visible')
        .html(`
          <strong>${d.name}</strong><br/>
          Entity: ${d.entity}<br/>
          Manufacturer: ${d.manufacturer}<br/>
          Model: ${d.model}<br/>
          ${d.ipAddress ? `IP: ${d.ipAddress}<br/>` : ''}
          Network: ${d.deviceOnNetwork ? 'Connected' : 'Offline'}<br/>
          PHI: ${d.hasPHI ? (d.customerPHICategory || 'Yes') : 'No'}
        `)
    })
    .on('mousemove', (event) => {
      tooltip.style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px')
    })
    .on('mouseout', () => {
      tooltip.style('visibility', 'hidden')
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

    // Cleanup
    return () => {
      tooltip.remove()
      simulation.stop()
    }
  }, [networkData, dimensions])

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.parentElement?.getBoundingClientRect()
        if (rect) {
          // Make it fully responsive with proper aspect ratio
          const width = Math.max(rect.width - 32, 400) // Account for padding
          const height = Math.max(width * 0.6, 400) // 3:2 aspect ratio with minimum height
          setDimensions({ width, height })
        }
      }
    }

    window.addEventListener('resize', handleResize)
    // Add a small delay to ensure parent container is rendered
    setTimeout(handleResize, 100)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      {/* Filters */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Topology Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>View Type</Label>
              <Select value={filters.view} onValueChange={(value: 'logical' | 'security' | 'connectivity') => setFilters(prev => ({ ...prev, view: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="logical">Logical View</SelectItem>
                  <SelectItem value="security">Security View</SelectItem>
                  <SelectItem value="connectivity">Connectivity View</SelectItem>
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
                  {filterOptions.manufacturers.map(manufacturer => (
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
                  {filterOptions.categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Entity</Label>
              <Select value={filters.entity} onValueChange={(value) => setFilters(prev => ({ ...prev, entity: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {filterOptions.entities.map(entity => (
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
                view: 'logical',
                phiLevel: 'all',
                networkStatus: 'all',
                manufacturer: 'all',
                category: 'all',
                entity: 'all'
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
              {networkData.nodes.length} devices, {networkData.links.length} connections
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

        {/* Device Details Panel */}
        <Card className="bg-white/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Device Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedNode ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedNode.name}</h3>
                  <p className="text-sm text-gray-600">{selectedNode.entity}</p>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs font-medium text-gray-500">MANUFACTURER</Label>
                    <p className="text-sm">{selectedNode.manufacturer}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">MODEL</Label>
                    <p className="text-sm">{selectedNode.model}</p>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">CATEGORY</Label>
                    <Badge variant="secondary" className="text-xs">{selectedNode.category}</Badge>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-medium text-gray-500">CLASSIFICATION</Label>
                    <Badge variant="outline" className="text-xs">{selectedNode.classification}</Badge>
                  </div>
                  
                  {selectedNode.ipAddress && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500">IP ADDRESS</Label>
                      <p className="text-sm font-mono">{selectedNode.ipAddress}</p>
                    </div>
                  )}
                  
                  {selectedNode.macAddress && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500">MAC ADDRESS</Label>
                      <p className="text-sm font-mono">{selectedNode.macAddress}</p>
                    </div>
                  )}
                  
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
                  
                  {selectedNode.osManufacturer && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500">OPERATING SYSTEM</Label>
                      <p className="text-sm">{selectedNode.osManufacturer} {selectedNode.osVersion}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">Click on a device node to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card className="bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filters.view === 'security' && (
              <div>
                <h4 className="font-medium mb-2">PHI Risk Levels</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-600"></div>
                    <span className="text-sm">High PHI Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-600"></div>
                    <span className="text-sm">Medium PHI Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-600"></div>
                    <span className="text-sm">Low PHI Risk</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    <span className="text-sm">No PHI</span>
                  </div>
                </div>
              </div>
            )}
            
            {filters.view === 'connectivity' && (
              <div>
                <h4 className="font-medium mb-2">Network Status</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                    <span className="text-sm">Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-600"></div>
                    <span className="text-sm">Offline</span>
                  </div>
                </div>
              </div>
            )}
            
            {filters.view === 'logical' && (
              <div>
                <h4 className="font-medium mb-2">Manufacturers</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm">GE Healthcare</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm">Philips</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    <span className="text-sm">Siemens</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm">Medtronic</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-sm">Other</span>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="font-medium mb-2">Interactions</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Click nodes to view details</p>
                <p>• Hover for device information</p>
                <p>• Drag nodes to reposition</p>
                <p>• Zoom and pan to explore</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}