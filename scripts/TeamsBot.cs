using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Identity.Client;

class TeamsBot
{
    // My (Cascade's) credentials
    private static readonly string TenantId = "045b7d24-2664-418d-9988-73ec9a607ba3";
    private static readonly string ClientId = "1464194b-a33c-4936-96b2-ae3b3daa7577";
    private static readonly string ClientSecret = "WZF8Q~aUYO3rYmk701GVvtUqEieCWIQJRs5Heakz";
    private static readonly string MeetingThreadId = "19:meeting_ZGRiZjJmYmMtZDllNC00ZGQ1LWIyZjktNjBjZDUyMDExMzEw@thread.v2";

    private static IConfidentialClientApplication? _confidentialClientApplication;

    static async Task Main(string[] args)
    {
        try
        {
            // Initialize MSAL
            _confidentialClientApplication = ConfidentialClientApplicationBuilder
                .Create(ClientId)
                .WithTenantId(TenantId)
                .WithClientSecret(ClientSecret)
                .Build();

            Console.WriteLine("Initialized MSAL client");

            // Send a message
            await SendMessageAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner error: {ex.InnerException.Message}");
            }
        }
    }

    private static async Task SendMessageAsync()
    {
        try 
        {
            var requestUrl = $"https://graph.microsoft.com/v1.0/chats/{MeetingThreadId}/messages";
            var messageContent = new
            {
                body = new
                {
                    content = "Hello! I'm Cascade, and I'm here to help! 🤖✨",
                    contentType = "text"
                }
            };

            using var httpClient = new HttpClient();
            var token = await _confidentialClientApplication.AcquireTokenForClient(new[] { 
                "https://graph.microsoft.com/.default",
                "Chat.ReadWrite",
                "ChatMessage.Send",
                "ChatMember.ReadWrite.All"
            })
            .ExecuteAsync();
            
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            Console.WriteLine("Sending message to Teams...");
            var response = await httpClient.PostAsJsonAsync(requestUrl, messageContent);
            
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Successfully sent message to chat");
                var result = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Response: {result}");
            }
            else 
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Failed to send message: {error}");
                Console.WriteLine($"Status code: {response.StatusCode}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send message: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner error: {ex.InnerException.Message}");
            }
        }
    }
}
