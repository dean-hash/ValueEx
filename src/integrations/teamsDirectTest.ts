import * as microsoftTeams from '@microsoft/teams-js';

async function testTeamsConnection() {
  try {
    // Initialize the Teams SDK
    await microsoftTeams.initialize();

    // Get the current context
    const context = await microsoftTeams.app.getContext();

    console.log('Teams connection successful!');
    console.log('Context:', context);

    return true;
  } catch (error) {
    console.error('Teams connection failed:', error);
    return false;
  }
}

testTeamsConnection();
