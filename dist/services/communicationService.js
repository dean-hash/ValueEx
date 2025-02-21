"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationService = void 0;
const communication_identity_1 = require("@azure/communication-identity");
const communication_common_1 = require("@azure/communication-common");
class CommunicationService {
    constructor() {
        this.identityClient = new communication_identity_1.CommunicationIdentityClient(process.env.COMMUNICATION_CONNECTION_STRING);
    }
    async createUserAndToken() {
        const user = await this.identityClient.createUser();
        const tokenResponse = await this.identityClient.getToken(user, ["voip", "chat"]);
        return {
            user,
            token: tokenResponse.token,
            expiresOn: tokenResponse.expiresOn
        };
    }
    async getTokenCredential(token) {
        return new communication_common_1.AzureCommunicationTokenCredential(token);
    }
    async refreshToken(user) {
        return await this.identityClient.getToken(user, ["voip", "chat"]);
    }
    async revokeTokens(user) {
        await this.identityClient.revokeTokens(user);
    }
    async deleteUser(user) {
        await this.identityClient.deleteUser(user);
    }
}
exports.CommunicationService = CommunicationService;
//# sourceMappingURL=communicationService.js.map