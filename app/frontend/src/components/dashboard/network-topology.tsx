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
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { useOrganization } from '@/contexts/organization-context'
import * as d3 from 'd3'
import { Progress } from '@/components/ui/progress'
import { useCachedQuery } from '@/hooks/use-cached-query'

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
  view: 'overview' | 'subnet' | 'tree' | 'treemap'
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
    view: 'overview',
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
  const treeSvgRef = useRef<SVGSVGElement>(null)
  const treemapSvgRef = useRef<SVGSVGElement>(null)
  const [drillLevel, setDrillLevel] = useState<0 | 1 | 2>(0)
  const [selectedHospitalName, setSelectedHospitalName] = useState<string | null>(null)
  const [selectedSubnetName, setSelectedSubnetName] = useState<string | null>(null)
  const [showAllSubnets, setShowAllSubnets] = useState(false)
  const [showAllDevices, setShowAllDevices] = useState(false)

  const allDevicesLive = useQuery(
    api.medicalDevices.getAllMedicalDevices,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  )
  const { data: allDevices, invalidate } = useCachedQuery(
    currentOrganization ? `devices:${currentOrganization._id}` : 'devices:none',
    allDevicesLive
  )

  const riskDataLive = useQuery(
    api.medicalDevices.getRiskAssessmentData,
    currentOrganization ? { organizationId: currentOrganization._id } : "skip"
  )
  const { data: riskData } = useCachedQuery(
    currentOrganization ? `risk:${currentOrganization._id}` : 'risk:none',
    riskDataLive
  )

  const RISK_COLORS = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#D97706',
    low: '#65A30D'
  }

  const getDeviceRiskLevel = (device: any): 'critical' | 'high' | 'medium' | 'low' => {
    const os = device.osVersion?.toLowerCase() || ''
    const hasLegacyOS = os.includes('xp') || os.includes('2000') || os.includes('vista') || os.includes('windows 7') || os.includes('windows 8')
    const phi = device.customerPHICategory?.toLowerCase() || ''
    const hasCriticalPHI = device.hasPHI && phi.includes('critical')
    const hasHighPHI = device.hasPHI && phi.includes('high')
    const isNetworkExposed = device.deviceOnNetwork && device.hasPHI
    if (hasLegacyOS || hasCriticalPHI || isNetworkExposed) return 'critical'
    if (hasHighPHI || (device.deviceOnNetwork && !device.osVersion)) return 'high'
    if (device.hasPHI || device.deviceOnNetwork) return 'medium'
    return 'low'
  }

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

  // Create network data for visualization (subnet graph only)
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

        // Add device nodes connected to subnet (limit per subnet for clarity)
        const devicesToShow = subnetInfo.devices
          .filter(device => filteredDevices.some(d => d._id === device.id))
          .slice(0, 30)

        devicesToShow.forEach(device => {
          nodes.push(device)
          links.push({
            source: device.id,
            target: `subnet-${subnet}`,
            value: 1,
            type: 'subnet-connection'
          })
        })
      })
    }

    return { nodes, links }
  }, [filteredDevices, filters.view, subnetAnalysis])

  type TreeDatum = {
    name: string
    type: 'root' | 'entity' | 'subnet' | 'device'
    node?: NetworkNode
    children?: TreeDatum[]
  }

  const treeDatum = useMemo<TreeDatum | null>(() => {
    if (!filteredDevices || filteredDevices.length === 0) return null

    const root: TreeDatum = { name: 'Organization', type: 'root', children: [] }
    const byEntity = new Map<string, Map<string, NetworkNode[]>>()

    filteredDevices.forEach(device => {
      const entity = device.entity || 'Unknown'
      const ipParts = device.ipAddress ? device.ipAddress.split('.') : []
      const subnet = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24` : 'No Network'
      const lastOctet = ipParts.length === 4 ? parseInt(ipParts[3]) : NaN
      const isDHCP = ipParts.length === 4 && (
        (lastOctet >= 100 && lastOctet <= 199) ||
        (lastOctet >= 20 && lastOctet <= 99) ||
        device.ipAddress!.includes('dhcp') ||
        (lastOctet > 50 && lastOctet < 200 && lastOctet !== 1 && lastOctet !== 254)
      )

      if (!byEntity.has(entity)) byEntity.set(entity, new Map())
      const subnetsMap = byEntity.get(entity)!
      if (!subnetsMap.has(subnet)) subnetsMap.set(subnet, [])

      const node: NetworkNode = {
        id: device._id,
        name: device.name,
        group: subnet,
        size: isDHCP ? 8 : 6,
        color: isDHCP ? '#3B82F6' : '#EF4444',
        entity: entity,
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
      }

      subnetsMap.get(subnet)!.push(node)
    })

    byEntity.forEach((subnetsMap, entity) => {
      const entityNode: TreeDatum = { name: entity, type: 'entity', children: [] }
      subnetsMap.forEach((nodes, subnet) => {
        const subnetNode: TreeDatum = { name: subnet, type: 'subnet', children: [] }
        nodes.forEach(n => {
          subnetNode.children!.push({ name: n.name, type: 'device', node: n })
        })
        entityNode.children!.push(subnetNode)
      })
      root.children!.push(entityNode)
    })

    return root
  }, [filteredDevices])

  const treeStats = useMemo(() => {
    const entities = new Set(filteredDevices.map(d => d.entity || 'Unknown')).size
    const subnets = new Set(filteredDevices.map(d => {
      const ipParts = d.ipAddress ? d.ipAddress.split('.') : []
      return ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24` : 'No Network'
    })).size
    const devices = filteredDevices.length
    return { entities, subnets, devices }
  }, [filteredDevices])

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!allDevices) return { manufacturers: [], categories: [], entities: [], subnets: [] }

    const manufacturers = [...new Set(allDevices.map(d => d.manufacturer).filter(Boolean))]
    const categories = [...new Set(allDevices.map(d => d.category).filter(Boolean))]
    const entities = [...new Set(allDevices.map(d => d.entity).filter(Boolean))]
    const subnets = Array.from(subnetAnalysis.subnets.keys())

    return { manufacturers, categories, entities, subnets }
  }, [allDevices, subnetAnalysis])

  const hospitalBoxes = useMemo(() => {
    const list = (riskData?.hospitalRiskHeatmap || []).map(h => {
      const worst = h.critical > 0 ? 'critical' : h.high > 0 ? 'high' : h.medium > 0 ? 'medium' : 'low'
      return {
        hospital: h.hospital,
        total: h.total,
        critical: h.critical,
        high: h.high,
        medium: h.medium,
        low: h.low,
        worst: worst as 'critical' | 'high' | 'medium' | 'low'
      }
    })
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    return list
      .sort((a, b) => severityOrder[b.worst] - severityOrder[a.worst] || b.total - a.total)
      .slice(0, 5)
  }, [riskData?.hospitalRiskHeatmap])

  const subnetBoxes = useMemo(() => {
    if (!selectedHospitalName || !allDevices) return [] as Array<{ subnet: string, count: number, worst: 'critical' | 'high' | 'medium' | 'low', critical: number, high: number, medium: number, low: number }>
    const groups = new Map<string, { count: number, critical: number, high: number, medium: number, low: number }>()
    allDevices.forEach(d => {
      if ((d.entity || 'Unknown') !== selectedHospitalName) return
      const ipParts = d.ipAddress ? d.ipAddress.split('.') : []
      const subnet = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24` : 'No Network'
      if (!groups.has(subnet)) groups.set(subnet, { count: 0, critical: 0, high: 0, medium: 0, low: 0 })
      const g = groups.get(subnet)!
      g.count++
      const lvl = getDeviceRiskLevel(d)
      g[lvl]++
    })
    const arr = Array.from(groups.entries()).map(([subnet, g]) => {
      const worst = g.critical > 0 ? 'critical' : g.high > 0 ? 'high' : g.medium > 0 ? 'medium' : 'low'
      return { subnet, count: g.count, worst, critical: g.critical, high: g.high, medium: g.medium, low: g.low }
    })
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    const sorted = arr.sort((a, b) => severityOrder[b.worst] - severityOrder[a.worst] || b.count - a.count)
    return showAllSubnets ? sorted : sorted.slice(0, 50)
  }, [allDevices, selectedHospitalName, showAllSubnets])

  const devicesInSelectedSubnet = useMemo(() => {
    if (!selectedHospitalName || !selectedSubnetName || !allDevices) return [] as any[]
    const list = allDevices.filter(d => {
      const entity = d.entity || 'Unknown'
      if (entity !== selectedHospitalName) return false
      const ipParts = d.ipAddress ? d.ipAddress.split('.') : []
      const subnet = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24` : 'No Network'
      return subnet === selectedSubnetName
    })
    const severityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 }
    const sorted = list.sort((a, b) => severityOrder[getDeviceRiskLevel(b)] - severityOrder[getDeviceRiskLevel(a)])
    return showAllDevices ? sorted : sorted.slice(0, 50)
  }, [allDevices, selectedHospitalName, selectedSubnetName, showAllDevices])

  // D3 visualization effect (only in subnet view)
  useEffect(() => {
    if (filters.view !== 'subnet') return
    if (!svgRef.current || networkData.nodes.length === 0) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const container = svg.append('g')

    // Zoom & pan
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on('zoom', (event) => {
        container.attr('transform', event.transform.toString())
      })
    svg.call(zoom as any)

    // Create simulation
    const simulation = d3.forceSimulation(networkData.nodes as any)
      .force('link', d3.forceLink(networkData.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5))

    // Add links
    const link = container.append('g')
      .selectAll('line')
      .data(networkData.links)
      .enter().append('line')
      .attr('stroke', 'var(--border)')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-width', 2)

    // Add nodes
    const node = container.append('g')
      .selectAll('circle')
      .data(networkData.nodes)
      .enter().append('circle')
      .attr('r', (d: any) => d.size)
      .attr('fill', (d: any) => d.color)
      .attr('stroke', 'var(--card)')
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
      .attr('dy', (d: any) => d.size + 12)
      .attr('fill', 'var(--muted-foreground)')
      .style('opacity', (d: any) => d.group === 'subnet' ? 0.9 : 0.3)

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
  }, [networkData, dimensions, subnetAnalysis, filters.view])

  useEffect(() => {
    if (filters.view !== 'treemap') return
    if (!treemapSvgRef.current) return

    const svg = d3.select(treemapSvgRef.current)
    svg.selectAll('*').remove()

    const width = dimensions.width
    const height = dimensions.height

    if (drillLevel === 0) {
      const data = { name: 'root', children: hospitalBoxes.map(h => ({ name: h.hospital, value: h.total, worst: h.worst })) }
      const root = d3.hierarchy<any>(data).sum((d: any) => d.value)
      d3.treemap<any>().size([width, height]).padding(6)(root)
      const nodes = root.leaves()
      const g = svg.append('g')
      nodes.forEach((n: any) => {
        const color = (n.data.worst && RISK_COLORS[n.data.worst as keyof typeof RISK_COLORS]) || 'var(--card)'
        const group = g.append('g').attr('transform', `translate(${n.x0},${n.y0})`).style('cursor', 'pointer')
        group.append('rect').attr('width', n.x1 - n.x0).attr('height', n.y1 - n.y0).attr('fill', color).attr('rx', 8).attr('ry', 8)
        group.append('text').attr('x', 10).attr('y', 18).attr('fill', 'white').attr('font-size', '12px').text(n.data.name)
        group.on('click', () => {
          setSelectedHospitalName(n.data.name)
          setDrillLevel(1)
          setSelectedSubnetName(null)
          setSelectedSubnet(null)
          setSelectedNode(null)
        })
      })
    } else if (drillLevel === 1 && selectedHospitalName) {
      const data = { name: selectedHospitalName, children: subnetBoxes.map(s => ({ name: s.subnet, value: s.count, worst: s.worst })) }
      const root = d3.hierarchy<any>(data).sum((d: any) => d.value)
      d3.treemap<any>().size([width, height]).padding(4)(root)
      const nodes = root.leaves()
      const g = svg.append('g')
      nodes.forEach((n: any) => {
        const color = (n.data.worst && RISK_COLORS[n.data.worst as keyof typeof RISK_COLORS]) || 'var(--card)'
        const group = g.append('g').attr('transform', `translate(${n.x0},${n.y0})`).style('cursor', 'pointer')
        group.append('rect').attr('width', n.x1 - n.x0).attr('height', n.y1 - n.y0).attr('fill', color).attr('rx', 6).attr('ry', 6)
        group.append('text').attr('x', 8).attr('y', 16).attr('fill', 'white').attr('font-size', '11px').text(n.data.name)
        group.on('click', () => {
          setSelectedSubnetName(n.data.name)
          setDrillLevel(2)
          const info = subnetAnalysis.subnets.get(n.data.name)
          if (info) setSelectedSubnet(info)
          else setSelectedSubnet(null)
          setSelectedNode(null)
        })
      })
    }
  }, [filters.view, drillLevel, hospitalBoxes, subnetBoxes, dimensions, selectedHospitalName, subnetAnalysis])

  useEffect(() => {
    if (filters.view !== 'tree') return
    if (!treeSvgRef.current || !treeDatum) return

    const svg = d3.select(treeSvgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 40, bottom: 20, left: 60 }
    const width = dimensions.width
    const height = dimensions.height

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    const root = d3.hierarchy(treeDatum)
    const treeLayout = d3.tree<TreeDatum>().size([height - margin.top - margin.bottom, width - margin.left - margin.right])
    treeLayout(root)

    g.selectAll('path')
      .data(root.links())
      .enter()
      .append('path')
      .attr('fill', 'none')
      .attr('stroke', 'var(--border)')
      .attr('stroke-width', 1.5)
      .attr('d', d3.linkHorizontal<any, any>()
        .x((d: any) => d.y)
        .y((d: any) => d.x))

    const nodeG = g.selectAll('g')
      .data(root.descendants())
      .enter()
      .append('g')
      .attr('transform', (d: any) => `translate(${d.y},${d.x})`)
      .style('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        const data = d.data as TreeDatum
        if (data.type === 'device' && data.node) {
          setSelectedNode(data.node)
          setSelectedSubnet(null)
        } else if (data.type === 'subnet') {
          const s = subnetAnalysis.subnets.get(data.name)
          setSelectedSubnet(s || null)
          setSelectedNode(null)
        } else {
          setSelectedNode(null)
          setSelectedSubnet(null)
        }
      })

    nodeG.append('circle')
      .attr('r', (d: any) => {
        const t = (d.data as TreeDatum).type
        if (t === 'entity') return 8
        if (t === 'subnet') return 7
        if (t === 'device') return 5
        return 9
      })
      .attr('fill', (d: any) => {
        const data = d.data as TreeDatum
        if (data.type === 'device' && data.node) return data.node.color
        if (data.type === 'subnet') return '#10B981'
        if (data.type === 'entity') return '#6366F1'
        return 'var(--card)'
      })
      .attr('stroke', 'var(--card)')
      .attr('stroke-width', 2)

    nodeG.append('text')
      .text((d: any) => {
        const n = d.data as TreeDatum
        const label = n.type === 'device' ? n.name : n.name
        return label.length > 18 ? label.substring(0, 18) + '…' : label
      })
      .attr('font-size', '10px')
      .attr('font-family', 'Arial')
      .attr('text-anchor', 'start')
      .attr('dx', 10)
      .attr('dy', 3)
      .attr('fill', 'var(--muted-foreground)')
  }, [treeDatum, dimensions, filters.view, subnetAnalysis])

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
      <div className="flex justify-end">
        <Button variant="outline" onClick={() => invalidate()}>Refresh Data</Button>
      </div>
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
              <Select value={filters.view} onValueChange={(value: 'overview' | 'subnet' | 'tree' | 'treemap') => {
                setFilters(prev => ({ ...prev, view: value }))
                if (value === 'treemap') { setDrillLevel(0); setSelectedHospitalName(null); setSelectedSubnetName(null); setSelectedSubnet(null); setSelectedNode(null); setShowAllSubnets(false); setShowAllDevices(false) }
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="subnet">Subnet Graph</SelectItem>
                  <SelectItem value="tree">Tree View</SelectItem>
                  <SelectItem value="treemap">Risk Treemap</SelectItem>
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
              {filters.view === 'subnet' ? 'Network Topology - Subnet Graph' : filters.view === 'tree' ? 'Network Topology - Tree' : filters.view === 'treemap' ? (drillLevel === 0 ? 'Risk Treemap - Hospitals' : drillLevel === 1 ? 'Risk Treemap - Subnets' : 'Devices in Subnet') : 'Connectivity Overview'}
            </CardTitle>
            <CardDescription>
              {filters.view === 'subnet' ? `${networkData.nodes.length} nodes, ${networkData.links.length} connections` : filters.view === 'tree' ? `${treeStats.devices} devices • ${treeStats.entities} hospitals • ${treeStats.subnets} subnets` : filters.view === 'treemap' ? (drillLevel === 0 ? `${hospitalBoxes.length} hospitals` : drillLevel === 1 ? `${subnetBoxes.length} subnets` : `${devicesInSelectedSubnet.length} devices`) : 'Aggregated connectivity by subnet'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filters.view === 'subnet' ? (
              <div className="border rounded-lg overflow-hidden bg-gray-50 w-full">
                <svg
                  ref={svgRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  style={{ background: '#f9fafb', display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            ) : filters.view === 'tree' ? (
              <div className="border rounded-lg overflow-hidden bg-gray-50 w-full">
                <svg
                  ref={treeSvgRef}
                  width={dimensions.width}
                  height={dimensions.height}
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  style={{ background: '#f9fafb', display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            ) : filters.view === 'treemap' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {currentOrganization?.name || 'Organization'}
                    {selectedHospitalName ? ` > ${selectedHospitalName}` : ''}
                    {selectedSubnetName ? ` > ${selectedSubnetName}` : ''}
                  </div>
                  <div className="flex items-center gap-2">
                    {drillLevel > 0 && (
                      <Button size="sm" variant="outline" onClick={() => {
                        if (drillLevel === 2) { setDrillLevel(1); setSelectedNode(null); }
                        else { setDrillLevel(0); setSelectedHospitalName(null); setSelectedSubnetName(null); setSelectedSubnet(null); setSelectedNode(null); setShowAllSubnets(false); }
                      }}>Back</Button>
                    )}
                  </div>
                </div>
                {drillLevel < 2 ? (
                  <div className="border rounded-lg overflow-hidden bg-gray-50 w-full">
                    <svg
                      ref={treemapSvgRef}
                      width={dimensions.width}
                      height={dimensions.height}
                      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                      style={{ background: '#f9fafb', display: 'block', width: '100%', height: 'auto' }}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Devices in {selectedSubnetName}</div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setShowAllDevices(v => !v)}>
                          {showAllDevices ? 'Show Top 50' : 'Show All'}
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {devicesInSelectedSubnet.map((d: any) => (
                        <div key={d._id} className="p-3 rounded-lg border bg-white/60 hover:bg-white cursor-pointer" onClick={() => {
                          const ipParts = d.ipAddress ? d.ipAddress.split('.') : []
                          const subnet = ipParts.length === 4 ? `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}.0/24` : 'No Network'
                          const isDHCP = (() => {
                            const lastOctet = ipParts.length === 4 ? parseInt(ipParts[3]) : NaN
                            return ipParts.length === 4 && (
                              (lastOctet >= 100 && lastOctet <= 199) ||
                              (lastOctet >= 20 && lastOctet <= 99) ||
                              d.ipAddress!.includes('dhcp') ||
                              (lastOctet > 50 && lastOctet < 200 && lastOctet !== 1 && lastOctet !== 254)
                            )
                          })()
                          const node: NetworkNode = {
                            id: d._id,
                            name: d.name,
                            group: subnet,
                            size: 8,
                            color: RISK_COLORS[getDeviceRiskLevel(d)],
                            entity: d.entity || 'Unknown',
                            manufacturer: d.manufacturer || 'Unknown',
                            model: d.model || 'Unknown',
                            category: d.category || 'Unknown',
                            classification: d.classification || 'Unknown',
                            ipAddress: d.ipAddress,
                            macAddress: d.macAddress,
                            osManufacturer: d.osManufacturer,
                            osVersion: d.osVersion,
                            deviceOnNetwork: d.deviceOnNetwork || false,
                            hasPHI: d.hasPHI || false,
                            customerPHICategory: d.customerPHICategory,
                            subnet,
                            isDHCP
                          }
                          setSelectedNode(node)
                        }}>
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm truncate">{d.name}</div>
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: RISK_COLORS[getDeviceRiskLevel(d)] }}></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{d.ipAddress || 'N/A'} • {d.osVersion || 'Unknown OS'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {drillLevel === 1 && (
                  <div className="flex items-center justify-end mt-2">
                    <Button size="sm" variant="outline" onClick={() => setShowAllSubnets(v => !v)}>
                      {showAllSubnets ? 'Show Top 50' : 'Show All'}
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Array.from(subnetAnalysis.subnets.values()).slice(0, 12).map(s => ({
                    subnet: s.subnet,
                    connected: s.devices.filter(d => d.deviceOnNetwork).length,
                    offline: s.devices.filter(d => !d.deviceOnNetwork).length
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="subnet" tick={{ fill: 'var(--muted-foreground)' }} angle={-45} textAnchor="end" height={80} />
                    <YAxis tick={{ fill: 'var(--muted-foreground)' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', color: 'var(--popover-foreground)', borderRadius: 12 }} />
                    <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
                    <Bar dataKey="connected" stackId="status" fill="var(--chart-1)" radius={[10, 10, 0, 0]} />
                    <Bar dataKey="offline" stackId="status" fill="var(--destructive)" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
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
