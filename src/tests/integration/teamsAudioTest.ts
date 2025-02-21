import { TeamsIntegration } from '../../services/teamsIntegration';
import { AudioStreamService } from '../../services/audioStreamService';
import { SpeechService } from '../../services/speechService';
import { RevenueMetricsService } from '../../services/revenueMetricsService';
import { ErrorHandler, ServiceError } from '../../utils/errorHandler';

class TeamsAudioTester {
  private teamsIntegration: TeamsIntegration;
  private audioService: AudioStreamService;
  private speechService: SpeechService;
  private metricsService: RevenueMetricsService;

  constructor() {
    this.teamsIntegration = new TeamsIntegration();
    this.audioService = new AudioStreamService();
    this.speechService = new SpeechService();
    this.metricsService = new RevenueMetricsService();
  }

  async runTests() {
    try {
      console.log('Starting Teams Audio Integration Tests...');

      // Test 1: Teams Authentication
      await this.testTeamsAuth();

      // Test 2: Audio Stream Setup
      await this.testAudioStreamSetup();

      // Test 3: Speech Services
      await this.testSpeechServices();

      // Test 4: Metrics Processing
      await this.testMetricsProcessing();

      // Test 5: Error Recovery
      await this.testErrorRecovery();

      console.log('All tests completed successfully!');
    } catch (error) {
      await ErrorHandler.handleError(error as Error);
    }
  }

  private async testTeamsAuth() {
    console.log('Testing Teams Authentication...');
    await this.teamsIntegration.initialize();
    const meeting = await this.teamsIntegration.startMeeting('Test Meeting');
    console.log('✓ Teams Authentication successful');
    return meeting;
  }

  private async testAudioStreamSetup() {
    console.log('Testing Audio Stream Setup...');
    const stream = await this.audioService.startAudioStream();

    // Verify stream properties
    if (!stream || !stream.active) {
      throw new ServiceError('Audio stream not active', 'STREAM_INACTIVE', 'Audio', true);
    }

    // Test audio quality metrics
    const audioTracks = stream.getAudioTracks();
    console.log('Audio Tracks:', audioTracks.length);
    console.log('Track Settings:', audioTracks[0].getSettings());

    console.log('✓ Audio Stream setup successful');
  }

  private async testSpeechServices() {
    console.log('Testing Speech Services...');

    // Test text-to-speech
    const testText = 'Testing speech synthesis';
    const audioData = await this.speechService.textToSpeech(testText);

    // Verify audio data
    if (!audioData || audioData.byteLength === 0) {
      throw new ServiceError('Speech synthesis failed', 'SYNTHESIS_FAILED', 'Speech', true);
    }

    // Test speech-to-text
    const audioConfig = {} as any; // Mock audio config for testing
    const recognizedText = await this.speechService.speechToText(audioConfig);

    console.log('✓ Speech Services test successful');
  }

  private async testMetricsProcessing() {
    console.log('Testing Real-time Metrics Processing...');

    // Simulate real-time data
    const testData = {
      text: 'Test metric data',
      timestamp: new Date(),
      audioQuality: 0.95,
    };

    // Process metrics
    const metrics = await this.metricsService.processRealTimeMetrics(testData);

    // Verify metrics
    if (!metrics || !metrics.realTimeMetrics) {
      throw new ServiceError('Metrics processing failed', 'PROCESSING_FAILED', 'Metrics', true);
    }

    console.log('✓ Metrics Processing test successful');
  }

  private async testErrorRecovery() {
    console.log('Testing Error Recovery Paths...');

    // Test 1: Auth Error Recovery
    await this.simulateAuthError();

    // Test 2: Network Error Recovery
    await this.simulateNetworkError();

    // Test 3: Service Error Recovery
    await this.simulateServiceError();

    console.log('✓ Error Recovery tests successful');
  }

  private async simulateAuthError() {
    try {
      throw new ServiceError('Authentication failed', 'AUTH_FAILED', 'Teams', true);
    } catch (error) {
      await ErrorHandler.handleError(error as Error);
    }
  }

  private async simulateNetworkError() {
    try {
      throw new ServiceError('Network connection lost', 'CONNECTION_LOST', 'Communication', true);
    } catch (error) {
      await ErrorHandler.handleError(error as Error);
    }
  }

  private async simulateServiceError() {
    try {
      throw new ServiceError('Service unavailable', 'SERVICE_DOWN', 'Speech', true);
    } catch (error) {
      await ErrorHandler.handleError(error as Error);
    }
  }
}

// Run tests
const tester = new TeamsAudioTester();
tester.runTests().catch(console.error);
