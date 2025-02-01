export declare class AlertManager {
  private static instance;
  private alertStates;
  private alertConfigs;
  private constructor();
  static getInstance(): AlertManager;
  private startMonitoring;
  private checkAlerts;
  private triggerAlert;
  private resolveAlert;
  private sendUrgentNotification;
  private sendWarningNotification;
  private logNotification;
  checkMetrics(): Promise<void>;
}
