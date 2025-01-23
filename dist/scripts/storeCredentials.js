"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const credentialsManager_1 = require("../config/credentialsManager");
async function storeInitialCredentials() {
    const manager = credentialsManager_1.CredentialsManager.getInstance();
    await manager.storeCredentials({
        service: 'godaddy',
        username: 'dean@divvytech.com',
        password: '142OsborneAve.',
    });
    console.log('Credentials stored successfully');
}
storeInitialCredentials();
//# sourceMappingURL=storeCredentials.js.map