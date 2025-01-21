import { OpenAIClient } from '../../clients/openai';

describe('OpenAI Integration', () => {
  let client: OpenAIClient;

  beforeAll(() => {
    client = OpenAIClient.getInstance();
  });

  it('should successfully connect to OpenAI and get a response', async () => {
    // Test with a simple, deterministic prompt
    const response = await client.createChatCompletion([
      {
        role: 'system',
        content: 'You are a test assistant. Always respond with "Test successful"',
      },
      {
        role: 'user',
        content: 'Confirm test',
      },
    ]);

    expect(response.choices[0].message.content).toBeDefined();
    expect(response.model).toContain('gpt-4');
  }, 30000); // Allow 30 seconds for API response

  it('should handle JSON completions correctly', async () => {
    const response = await client.createJSONCompletion<{ test: string }>([
      {
        role: 'system',
        content: 'You are a test assistant. Always respond with JSON: {"test": "successful"}',
      },
      {
        role: 'user',
        content: 'Provide test response',
      },
    ]);

    expect(response).toBeDefined();
    expect(response).toHaveProperty('test', 'successful');
  }, 30000);

  it('should handle API errors gracefully', async () => {
    try {
      // Intentionally cause an error by using an invalid model
      await client.createChatCompletion(
        [
          {
            role: 'user',
            content: 'Test',
          },
        ],
        {
          model: 'invalid-model',
        }
      );
      fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeDefined();
    }
  }, 30000);
});
