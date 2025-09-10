import { query } from "./_generated/server";
import { v } from "convex/values";

// THREAT_WEIGHTS should be defined here since it's used in calculateThreatScores
const THREAT_WEIGHTS = {
  critical: 50,
  high: 30,
  medium: 15,
  low: 5
} as const;

// Legacy OS patterns for detection
const LEGACY_OS_PATTERNS = [
  'windows xp', 'windows 7', 'windows vista', 'windows 2000',
  'unsupported', 'legacy', 'end of life', 'eol'
];

const detectAlerts = (devices: any[]) => {
  const alerts: any[] = [];
  
  devices.forEach((device, index) => {
    // Critical PHI on Network
    if (device.customerPHICategory === 'Critical' && device.deviceOnNetwork === true) {
      alerts.push({
        id: `critical-phi-${device._id}-${Date.now()}`,
        type: 'critical_phi_on_network',
        severity: 'critical',
        title: 'Critical PHI Device on Network',
        description: 'Device with Critical PHI category is connected to network',
        deviceId: device._id,
        deviceName: device.deviceName,
        technician: device.technician,
        hospital: device.hospital,
        timestamp: new Date().toISOString(),
        isResolved: false,
        metadata: { threatScore: 50 }
      });
    }

    // Unsupported OS
    const osVersion = device.osVersion?.toLowerCase() || '';
    if (LEGACY_OS_PATTERNS.some(pattern => osVersion.includes(pattern))) {
      alerts.push({
        id: `unsupported-os-${device._id}-${Date.now()}`,
        type: 'unsupported_os',
        severity: 'high',
        title: 'Unsupported Operating System',
        description: `Device running unsupported OS: ${device.osVersion}`,
        deviceId: device._id,
        deviceName: device.deviceName,
        technician: device.technician,
        hospital: device.hospital,
        timestamp: new Date().toISOString(),
        isResolved: false,
        metadata: { threatScore: 30, osVersion: device.osVersion }
      });
    }

    // Duplicate IP addresses
    const duplicateIPs = devices.filter(d => 
      d.ipAddress && d.ipAddress === device.ipAddress && d._id !== device._id
    );
    if (duplicateIPs.length > 0 && device.ipAddress) {
      alerts.push({
        id: `duplicate-ip-${device._id}-${Date.now()}`,
        type: 'duplicate_ip',
        severity: 'medium',
        title: 'Duplicate IP Address',
        description: `Multiple devices sharing IP: ${device.ipAddress}`,
        deviceId: device._id,
        deviceName: device.deviceName,
        technician: device.technician,
        hospital: device.hospital,
        timestamp: new Date().toISOString(),
        isResolved: false,
        metadata: { threatScore: 15, ipAddress: device.ipAddress, duplicateCount: duplicateIPs.length }
      });
    }

    // Missing critical device information
    const missingFields = [];
    if (!device.deviceName) missingFields.push('Device Name');
    if (!device.manufacturer) missingFields.push('Manufacturer');
    if (!device.model) missingFields.push('Model');
    if (!device.osVersion) missingFields.push('OS Version');
    
    if (missingFields.length > 0) {
      alerts.push({
        id: `missing-info-${device._id}-${Date.now()}`,
        type: 'missing_device_info',
        severity: 'low',
        title: 'Incomplete Device Information',
        description: `Missing: ${missingFields.join(', ')}`,
        deviceId: device._id,
        deviceName: device.deviceName || 'Unknown Device',
        technician: device.technician,
        hospital: device.hospital,
        timestamp: new Date().toISOString(),
        isResolved: false,
        metadata: { threatScore: 5, missingFields }
      });
    }
  });

  return alerts;
};

const calculateThreatScores = (alerts: any[]) => {
  const deviceScores = new Map();
  const technicianScores = new Map();
  const hospitalScores = new Map();

  alerts.forEach(alert => {
    const weight = THREAT_WEIGHTS[alert.severity as keyof typeof THREAT_WEIGHTS] || 0;
    
    // Device scores
    if (alert.deviceId) {
      const current = deviceScores.get(alert.deviceId) || 0;
      deviceScores.set(alert.deviceId, current + weight);
    }
    
    // Technician scores
    if (alert.technician) {
      const current = technicianScores.get(alert.technician) || 0;
      technicianScores.set(alert.technician, current + weight);
    }
    
    // Hospital scores
    if (alert.hospital) {
      const current = hospitalScores.get(alert.hospital) || 0;
      hospitalScores.set(alert.hospital, current + weight);
    }
  });

  // Convert to arrays and sort
  const deviceScoresArray = Array.from(deviceScores.entries())
    .map(([deviceId, score]) => ({ deviceId, score }))
    .sort((a, b) => b.score - a.score);

  const technicianScoresArray = Array.from(technicianScores.entries())
    .map(([technician, score]) => ({ technician, score }))
    .sort((a, b) => b.score - a.score);

  const hospitalScoresArray = Array.from(hospitalScores.entries())
    .map(([hospital, score]) => ({ hospital, score }))
    .sort((a, b) => b.score - a.score);

  const totalScore = alerts.reduce((sum, alert) => {
    return sum + (THREAT_WEIGHTS[alert.severity as keyof typeof THREAT_WEIGHTS] || 0);
  }, 0);

  return {
    deviceScores: deviceScoresArray,
    technicianScores: technicianScoresArray,
    hospitalScores: hospitalScoresArray,
    globalScore: totalScore
  };
};

export const getAlertsAndThreats = query({
  args: { organizationId: v.id("organizations") },
  handler: async (ctx, { organizationId }) => {
    try {
      const devices = await ctx.db
        .query("medicalDevices")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();

      // Generate alerts from device data
      const alerts = detectAlerts(devices);
      const threatScores = calculateThreatScores(alerts);

      // Generate trend data (mock for now)
      const trendData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count: Math.floor(Math.random() * 10) + alerts.length * 0.1
        };
      });

      const summary = {
        totalAlerts: alerts.length,
        newAlertsToday: alerts.filter(a => {
          const today = new Date();
          const alertDate = new Date(a.timestamp);
          return alertDate.toDateString() === today.toDateString();
        }).length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
        lowAlerts: alerts.filter(a => a.severity === 'low').length,
        unresolvedAlerts: alerts.filter(a => !a.isResolved).length,
        devicesAffected: new Set(alerts.map(a => a.deviceId)).size,
        hospitalsAffected: new Set(alerts.map(a => a.hospital)).size,
        techniciansAffected: new Set(alerts.map(a => a.technician)).size,
        averageResolutionTime: 4.2, // Mock value
        trendData
      };

      return {
        alerts,
        threatScores,
        summary
      };
    } catch (error) {
      console.error('Error in getAlertsAndThreats:', error);
      // Return empty data structure to prevent crashes
      return {
        alerts: [],
        threatScores: {
          deviceScores: [],
          technicianScores: [],
          hospitalScores: [],
          globalScore: 0
        },
        summary: {
          totalAlerts: 0,
          newAlertsToday: 0,
          criticalAlerts: 0,
          highAlerts: 0,
          mediumAlerts: 0,
          lowAlerts: 0,
          unresolvedAlerts: 0,
          devicesAffected: 0,
          hospitalsAffected: 0,
          techniciansAffected: 0,
          averageResolutionTime: 0,
          trendData: []
        }
      };
    }
  },
});