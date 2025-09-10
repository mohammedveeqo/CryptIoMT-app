export enum AlertType {
  CRITICAL_PHI_ON_NETWORK = 'critical_phi_on_network',
  UNSUPPORTED_OS = 'unsupported_os',
  DUPLICATE_IP = 'duplicate_ip',
  DUPLICATE_MAC = 'duplicate_mac',
  DHCP_DEVICE = 'dhcp_device',
  MISSING_DEVICE_INFO = 'missing_device_info',
  HIGH_RISK_DEVICE = 'high_risk_device',
  NETWORK_SECURITY_VIOLATION = 'network_security_violation'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  deviceId?: string;
  deviceName?: string;
  technicianId?: string;
  technicianName?: string;
  technician?: string; // Add this for backward compatibility
  hospitalId?: string;
  hospitalName?: string;
  hospital?: string; // Add this for backward compatibility
  timestamp: Date;
  isResolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id?: string;
  type: AlertType | string; // Allow string for backward compatibility
  name: string;
  description: string;
  severity: AlertSeverity | string; // Allow string for backward compatibility
  condition: (device: any, allDevices?: any[]) => boolean;
  message?: (device: any) => string;
  threatScore: number; // Change from weight to threatScore to match usage
  enabled?: boolean;
  nistControls?: string[];
  cisControls?: string[];
}

export interface ThreatScore {
  deviceId: string;
  deviceName: string;
  score: number; // 0-100, higher is more threatening
  alerts: Alert[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: Date;
}

export interface TechnicianThreatSummary {
  technicianId: string;
  technicianName: string;
  averageThreatScore: number;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  devicesManaged: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface HospitalThreatSummary {
  hospitalId: string;
  hospitalName: string;
  averageThreatScore: number;
  totalAlerts: number;
  criticalAlerts: number;
  highAlerts: number;
  mediumAlerts: number;
  lowAlerts: number;
  totalDevices: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  topThreats: AlertType[];
}

export interface AlertSummary {
  totalAlerts: number;
  newAlertsToday: number;
  criticalAlerts: number;
  unresolvedAlerts: number;
  averageResolutionTime: number; // in hours
  topAlertTypes: { type: AlertType; count: number }[];
  trendData: { date: string; count: number }[];
}

// NIST/CIS Control Mapping
export interface ComplianceMapping {
  alertType: AlertType;
  nistControls: string[];
  cisControls: string[];
  description: string;
  remediation: string;
}

// Alert Detection Context
export interface DetectionContext {
  organizationId: string;
  devices: any[];
  technicians: string[];
  hospitals: string[];
  timestamp: Date;
}