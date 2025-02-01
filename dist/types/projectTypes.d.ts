export interface ProjectMetric {
  name: string;
  value: number;
  unit?: string;
  timestamp: number;
}
export interface SessionContext {
  startTime: number;
  lastUpdated: number;
  activeUsers: string[];
  metrics: ProjectMetric[];
}
export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  latency: number;
}
export interface UsageMetrics {
  requests: number;
  errors: number;
  activeUsers: number;
}
export interface TimeMetrics {
  created: number;
  lastModified: number;
  lastAccessed: number;
}
export interface ProjectMetrics {
  performance: PerformanceMetrics;
  usage: UsageMetrics;
  timestamps: TimeMetrics;
}
export interface MonitoringThresholds {
  cpu: number;
  memory: number;
  latency: number;
}
export interface MonitoringSettings {
  enabled: boolean;
  interval: number;
  thresholds: MonitoringThresholds;
}
export interface RecoverySettings {
  enabled: boolean;
  backupInterval: number;
  maxBackups: number;
}
export interface SecuritySettings {
  encryption: boolean;
  accessControl: boolean;
  auditLog: boolean;
}
export interface ProjectSettings {
  monitoring: MonitoringSettings;
  recovery: RecoverySettings;
  security: SecuritySettings;
}
export interface ProjectMetadata {
  version: string;
  environment: string;
  lastDeployment?: number;
  tags: string[];
}
export interface ProjectState {
  id?: string;
  name?: string;
  description?: string;
  version?: string;
  sessionContext: SessionContext;
  settings: ProjectSettings;
  metadata: ProjectMetadata;
}
