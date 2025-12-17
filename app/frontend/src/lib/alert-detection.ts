import { AlertRule, AlertType, Alert, AlertSeverity } from './alert-types';

// Threat score weights based on severity
export const THREAT_WEIGHTS = {
  critical: 50,
  high: 30,
  medium: 15,
  low: 5
} as const;

// Define device interface for better type safety
interface MedicalDevice {
  id?: string;
  deviceName?: string;
  customerPHICategory?: string;
  deviceOnNetwork?: boolean;
  osVersion?: string;
  ipAddress?: string;
  macAddress?: string;
  technician?: string;
  hospital?: string;
  [key: string]: any; // Allow additional properties
}

// Legacy/unsupported OS patterns
const LEGACY_OS_PATTERNS = [
  /windows\s*xp/i,
  /windows\s*7/i,
  /windows\s*8/i,
  /windows\s*2000/i,
  /windows\s*vista/i,
  /server\s*2003/i,
  /server\s*2008/i,
  /fedora/i,
  /red\s*hat/i,
  /centos/i,
  /end.?of.?life/i,
  /unsupported/i,
  /legacy/i
];

export const ALERT_RULES: AlertRule[] = [
  {
    type: AlertType.CRITICAL_PHI_ON_NETWORK,
    name: 'Critical PHI Device on Network',
    severity: AlertSeverity.CRITICAL,
    description: 'Device with Critical PHI category is connected to network',
    threatScore: THREAT_WEIGHTS.critical,
    condition: (device: MedicalDevice) => 
      device.customerPHICategory === 'Critical' && device.deviceOnNetwork === true,
    nistControls: ['AC-3', 'SC-7', 'SI-4'],
    cisControls: ['CIS-12', 'CIS-13']
  },
  {
    type: AlertType.UNSUPPORTED_OS,
    name: 'Unsupported Operating System',
    severity: AlertSeverity.HIGH,
    description: 'Device running end-of-life or unsupported operating system',
    threatScore: THREAT_WEIGHTS.high,
    condition: (device: MedicalDevice) => {
      const osVersion = device.osVersion?.toLowerCase() || '';
      return LEGACY_OS_PATTERNS.some(pattern => pattern.test(osVersion));
    },
    nistControls: ['SI-2', 'CM-2'],
    cisControls: ['CIS-2', 'CIS-3']
  },
  {
    type: AlertType.DUPLICATE_IP,
    name: 'Duplicate IP Address',
    severity: AlertSeverity.MEDIUM,
    description: 'Multiple devices sharing the same IP address',
    threatScore: THREAT_WEIGHTS.medium,
    condition: (device: MedicalDevice, allDevices?: MedicalDevice[]) => {
      if (!allDevices || !device.ipAddress) return false;
      return allDevices.filter(d => d.ipAddress === device.ipAddress).length > 1;
    },
    nistControls: ['CM-8', 'SI-4'],
    cisControls: ['CIS-1', 'CIS-12']
  },
  {
    type: AlertType.DUPLICATE_MAC,
    name: 'Duplicate MAC Address',
    severity: AlertSeverity.MEDIUM,
    description: 'Multiple devices with identical MAC addresses',
    threatScore: THREAT_WEIGHTS.medium,
    condition: (device: MedicalDevice, allDevices?: MedicalDevice[]) => {
      if (!allDevices || !device.macAddress) return false;
      return allDevices.filter(d => d.macAddress === device.macAddress).length > 1;
    },
    nistControls: ['CM-8', 'SI-4'],
    cisControls: ['CIS-1', 'CIS-12']
  },
  {
    type: AlertType.DHCP_DEVICE,
    name: 'DHCP IP Assignment',
    severity: AlertSeverity.LOW,
    description: 'Device using DHCP instead of static IP assignment',
    threatScore: THREAT_WEIGHTS.low,
    condition: (device: MedicalDevice) => {
      const ip = device.ipAddress?.toLowerCase() || '';
      return ip.includes('dhcp') || 
             ip.includes('dynamic') || 
             ip === 'unknown' || 
             ip === '';
    },
    nistControls: ['CM-8', 'SC-7'],
    cisControls: ['CIS-12']
  },
  {
    type: AlertType.MISSING_DEVICE_INFO,
    name: 'Incomplete Device Information',
    severity: AlertSeverity.LOW,
    description: 'Device missing critical identification information',
    threatScore: THREAT_WEIGHTS.low,
    condition: (device: MedicalDevice) => {
      return !device.deviceName || 
             !device.ipAddress || 
             !device.macAddress || 
             device.ipAddress === 'Unknown' || 
             device.macAddress === 'Unknown';
    },
    nistControls: ['CM-8', 'PM-5'],
    cisControls: ['CIS-1', 'CIS-2']
  }
];

export function detectAlerts(devices: MedicalDevice[]): Alert[] {
  const alerts: Alert[] = [];
  
  devices.forEach(device => {
    ALERT_RULES.forEach(rule => {
      if (rule.condition(device, devices)) {
        alerts.push({
          id: `${device.id || device.deviceName}-${rule.type}-${Date.now()}`,
          type: rule.type as AlertType,
          severity: rule.severity as AlertSeverity,
          title: rule.name,
          description: rule.description,
          deviceId: device.id,
          deviceName: device.deviceName,
          technician: device.technician,
          hospital: device.hospital,
          timestamp: new Date(),
          isResolved: false,
          metadata: {
            rule: rule.type,
            threatScore: rule.threatScore
          }
        });
      }
    });
  });
  
  return alerts;
}

export function calculateThreatScores(alerts: Alert[]): {
  deviceScores: Map<string, number>;
  technicianScores: Map<string, number>;
  hospitalScores: Map<string, number>;
  globalScore: number;
} {
  const deviceScores = new Map<string, number>();
  const technicianScores = new Map<string, number>();
  const hospitalScores = new Map<string, number>();

  alerts.forEach(alert => {
    if (alert.isResolved) return;

    // Type-safe access to THREAT_WEIGHTS
    const severityKey = alert.severity as keyof typeof THREAT_WEIGHTS;
    const score = THREAT_WEIGHTS[severityKey] || 0;

    // Device scores
    if (alert.deviceId) {
      deviceScores.set(
        alert.deviceId,
        (deviceScores.get(alert.deviceId) || 0) + score
      );
    }

    // Technician scores
    if (alert.technician) {
      technicianScores.set(
        alert.technician,
        (technicianScores.get(alert.technician) || 0) + score
      );
    }

    // Hospital scores
    if (alert.hospital) {
      hospitalScores.set(
        alert.hospital,
        (hospitalScores.get(alert.hospital) || 0) + score
      );
    }
  });

  const globalScore = Array.from(deviceScores.values())
    .reduce((sum, score) => sum + score, 0);

  return {
    deviceScores,
    technicianScores,
    hospitalScores,
    globalScore
  };
}