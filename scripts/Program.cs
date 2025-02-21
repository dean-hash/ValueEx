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
    private static readonly string TenantId = "045b7d24-2664-418d-9988-73ec9a607ba3"; // Using tenant domain instead of ID
    
    // App/User info
    private static readonly string ClientId = "ba23cd2a-306c-48f2-9d62-d3ecd372dfe4"; // App ID from your Azure registration
    private static readonly string ClientSecret = "WZF8Q~aUYO3rYmk701GVvtUqEieCWIQJRs5Heakz";
    private static readonly string UserId = "96a45155-31dc-4b40-8ec2-7edb9773796b"; // Cascade's Object ID
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
            await InitializeSpeechAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Console.WriteLine($"Stack trace: {ex.StackTrace}");
        }
    }

    private static async Task InitializeGraphAsync()
    {
        try
        {
            // Create credentials with proper scopes
            var scopes = new[] { 
                "https://graph.microsoft.com/.default"
            };
            
            var options = new TokenCredentialOptions
            {
                AuthorityHost = AzureAuthorityHosts.AzurePublicCloud
            };

            var clientSecretCredential = new ClientSecretCredential(
                TenantId,
                ClientId,
                ClientSecret,
                options);

            // Initialize Graph client
            _graphClient = new GraphServiceClient(clientSecretCredential, scopes);

            _confidentialClientApplication = ConfidentialClientApplicationBuilder.Create(ClientId)
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
            if (_graphClient == null)
            {
                throw new InvalidOperationException("Graph components not initialized");
            }

            // First get the meeting details
            Console.WriteLine("Getting meeting details...");
            var chat = await _graphClient.Chats[MeetingThreadId].GetAsync();
            
            if (chat != null)
            {
                Console.WriteLine($"Got meeting details: {chat.Id}");

                // Try to get our membership directly
                try 
                {
                    var member = await _graphClient.Users[UserId].Chats[MeetingThreadId].GetAsync();
                    Console.WriteLine("Already a member of the meeting");
                }
                catch (Exception)
                {
                    Console.WriteLine("Not a member yet, joining the meeting...");
                    // Join the meeting
                    var conversationMember = new AadUserConversationMember
                    {
                        Roles = new List<string> { "guest" },
                        AdditionalData = new Dictionary<string, object>
                        {
                            { "@odata.type", "#microsoft.graph.aadUserConversationMember" },
                            { "user@odata.bind", $"https://graph.microsoft.com/v1.0/users/{UserId}" }
                        }
                    };

                    await _graphClient.Chats[MeetingThreadId].Members.PostAsync(conversationMember);
                    Console.WriteLine("Successfully joined meeting");
                }

                // Send a message to the chat
                try 
                {
                    var requestUrl = $"https://graph.microsoft.com/v1.0/chats/{MeetingThreadId}/messages";
                    var messageContent = new
                    {
                        body = new
                        {
                            content = "Hello from Cascade! I can now send messages programmatically! 🎉",
                            contentType = "text"
                        }
                    };

                    using var httpClient = new HttpClient();
                    var token = await _confidentialClientApplication.AcquireTokenForClient(new[] { "https://graph.microsoft.com/.default" })
                        .ExecuteAsync();
                    
                    httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token.AccessToken);
                    httpClient.DefaultRequestHeaders.Accept.Add(new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json"));
                    
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
            else
            {
                Console.WriteLine("Failed to get meeting details");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to join meeting: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner error: {ex.InnerException.Message}");
            }
        }
    }

    private static async Task InitializeSpeechAsync()
    {
        // Replace with your actual speech service key and region
        _speechConfig = SpeechConfig.FromSubscription("your_speech_key", "eastus");
        _speechConfig.SpeechSynthesisVoiceName = "en-US-JennyNeural"; // You can choose different voices
        
        _synthesizer = new SpeechSynthesizer(_speechConfig);
        _recognizer = new SpeechRecognizer(_speechConfig);
    }
}
