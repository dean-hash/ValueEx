interface TeamsConfig {
  token: string;
  userId: string;
  displayName: string;
  tenantId: string;
  communicationToken?: string;
}
declare const credentials: {
  tenantId: string;
  clientId: string;
  clientSecret: string;
};
declare function getGraphToken(): Promise<TeamsConfig>;
export { getGraphToken, TeamsConfig, credentials };
