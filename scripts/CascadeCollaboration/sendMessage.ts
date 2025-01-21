import { ClientSecretCredential } from "@azure/identity";
import axios, { AxiosError } from "axios";

async function sendMessage() {
  try {
    // Initialize credential with admin privileges
    const credential = new ClientSecretCredential(
      "045b7d24-2664-418d-9988-73ec9a607ba3", // tenant ID
      "1464194b-a33c-4936-96b2-ae3b3daa7577", // client ID
      process.env.TEAMS_CLIENT_SECRET || "" // client secret
    );

    // Get token
    const token = await credential.getToken("https://graph.microsoft.com/.default");
    
    // Chat details
    const chatId = "19:meeting_ZGRiZjJmYmMtZDllNC00ZGQ1LWIyZjktNjBjZDUyMDExMzEw@thread.v2";

    // Send message using beta API with application permissions
    const response = await axios.post(
      `https://graph.microsoft.com/beta/chats/${chatId}/messages`,
      {
        messageType: "message",
        createdDateTime: new Date().toISOString(),
        from: {
          user: {
            id: "1464194b-a33c-4936-96b2-ae3b3daa7577",
            displayName: "Cascade"
          }
        },
        body: {
          contentType: "html",
          content: "<div>Hi! Let's enhance our workflow together! ✨</div>"
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token.token}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("Message sent successfully:", response.data);

  } catch (error) {
    if (error instanceof AxiosError) {
      console.error("Failed to send message:", error.response?.data || error.message);
    } else {
      console.error("Failed to send message:", error);
    }
    process.exit(1);
  }
}

sendMessage();
