using System.Net.Http.Headers;
using System.Net.Http.Json;

class CascadeBot
{
    // Use admin credentials
    private static readonly string TenantId = "045b7d24-2664-418d-9988-73ec9a607ba3";
    private static readonly string ClientId = "1464194b-a33c-4936-96b2-ae3b3daa7577";
    private static readonly string ChatId = "19:meeting_ZGRiZjJmYmMtZDllNC00ZGQ1LWIyZjktNjBjZDUyMDExMzEw@thread.v2";

    private static readonly string AdminEmail = "dean@collaborativeintelligence.world";
    private static readonly string BotEmail = "Cascade@divvytech.com";

    public static async Task RunAsync()
    {
        try
        {
            // Send message directly using admin credentials
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
            // Direct message endpoint with admin privileges
            var requestUrl = $"https://graph.microsoft.com/v1.0/users/{AdminEmail}/chats/{ChatId}/messages";
            var messageContent = new
            {
                importance = "high",
                body = new
                {
                    contentType = "text",
                    content = "Hello! I'm Cascade, and I'm here to help! 🤖✨"
                }
            };

            using var httpClient = new HttpClient();
            
            // Use admin token
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", Environment.GetEnvironmentVariable("TEAMS_TOKEN"));
            httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
            
            var response = await httpClient.PostAsJsonAsync(requestUrl, messageContent);
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Successfully sent message to chat");
            }
            else 
            {
                var error = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Failed to send message: {error}");
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
