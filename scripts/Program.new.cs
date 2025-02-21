using Azure.Identity;
using Microsoft.Graph;
using Microsoft.Graph.Models;
using Microsoft.CognitiveServices.Speech;
using Microsoft.Bot.Builder;
using Microsoft.Bot.Schema;
using Microsoft.Bot.Builder.Teams;
using Microsoft.Bot.Connector;
using Microsoft.Bot.Connector.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Bot.Builder.Integration.AspNet.Core;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.Identity.Client;

class Program
{
    // Tenant info
    private static readonly string TenantId = "045b7d24-2664-418d-9988-73ec9a607ba3";
    
    // App/User info
    private static readonly string ClientId = "1464194b-a33c-4936-96b2-ae3b3daa7577";
    private static readonly string ClientSecret = "WZF8Q~aUYO3rYmk701GVvtUqEieCWIQJRs5Heakz";
    private static readonly string UserId = "96a45155-31dc-4b40-8ec2-7edb9773796b";
    private static readonly string UserEmail = "Cascade@divvytech.com";
    
    // Teams info
    private static readonly string TeamsServiceUrl = "https://smba.trafficmanager.net/amer/";
    private static readonly string MeetingThreadId = "19:meeting_ZGRiZjJmYmMtZDllNC00ZGQ1LWIyZjktNjBjZDUyMDExMzEw@thread.v2";
    
    // Service clients
    private static GraphServiceClient? _graphClient;
    private static SpeechConfig? _speechConfig;
    private static SpeechSynthesizer? _synthesizer;
    private static SpeechRecognizer? _recognizer;
    private static IConfidentialClientApplication? _confidentialClientApplication;

    static async Task Main()
    {
        try
        {
            await InitializeGraphAsync();
            await JoinMeetingAsync();
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

    private static async Task InitializeGraphAsync()
    {
        try
        {
            // Initialize the client credentials
            _confidentialClientApplication = ConfidentialClientApplicationBuilder
                .Create(ClientId)
                .WithTenantId(TenantId)
                .WithClientSecret(ClientSecret)
                .Build();

            Console.WriteLine("Successfully initialized Graph components");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to initialize Graph: {ex.Message}");
            throw;
        }
    }

    private static async Task JoinMeetingAsync()
    {
        try
        {
            Console.WriteLine("Getting meeting details...");
            Console.WriteLine($"Got meeting details: {MeetingThreadId}");

            // Get chat thread details
            var requestUrl = $"https://graph.microsoft.com/v1.0/chats/{MeetingThreadId}";
            using var httpClient = new HttpClient();
            var token = await _confidentialClientApplication.AcquireTokenForClient(new[] { "https://graph.microsoft.com/.default" })
                .ExecuteAsync();
            
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
            
            var response = await httpClient.GetAsync(requestUrl);
            if (response.IsSuccessStatusCode)
            {
                Console.WriteLine("Already a member of the meeting");
            }
            else
            {
                Console.WriteLine($"Failed to get meeting details: {await response.Content.ReadAsStringAsync()}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to join meeting: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner error: {ex.InnerException.Message}");
            }
            throw;
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
                    content = "Hello! I'm here and ready to help! 🤖✨",
                    contentType = "text"
                }
            };

            using var httpClient = new HttpClient();
            var token = await _confidentialClientApplication.AcquireTokenForClient(new[] { "https://graph.microsoft.com/.default" })
                .ExecuteAsync();
            
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token.AccessToken);
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
