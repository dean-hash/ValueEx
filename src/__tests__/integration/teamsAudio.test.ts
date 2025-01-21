import { TeamsIntegration } from '../../services/teamsIntegration';
import { AudioStreamService } from '../../services/audioStreamService';
import { SpeechService } from '../../services/speechService';
import { ResonanceFieldService } from '../../services/resonanceField';
import { DynamicsService } from '../../integrations/dynamics365';
import { BusinessCentralService } from '../../integrations/businessCentral';
import { AwinService } from '../../services/awinService';
import { ErrorHandler, ServiceError } from '../../utils/errorHandler';
import { 
  MockTeamsClient, 
  MockSpeechService, 
  MockAudioService,
  MockMediaStream
} from '../mocks/services';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup/testEnv';

// Mock implementations
jest.mock('../../services/resonanceField');
jest.mock('../../integrations/dynamics365');
jest.mock('../../integrations/businessCentral');
jest.mock('../../services/awinService');

describe('Teams Audio Integration', () => {
  let teamsIntegration: TeamsIntegration;
  let audioService: AudioStreamService;
  let speechService: SpeechService;
  let resonanceField: ResonanceFieldService;
  let dynamicsService: DynamicsService;
  let bcService: BusinessCentralService;
  let awinService: AwinService;
  let activeStreams: MockMediaStream[] = [];

  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  beforeEach(() => {
    teamsIntegration = new TeamsIntegration();
    audioService = new AudioStreamService();
    speechService = new SpeechService();
    resonanceField = new ResonanceFieldService();
    dynamicsService = new DynamicsService();
    bcService = new BusinessCentralService();
    awinService = new AwinService();
    activeStreams = [];
  });

  afterEach(async () => {
    // Cleanup any active streams
    activeStreams.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    activeStreams = [];

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Teams Authentication', () => {
    it('should initialize Teams connection', async () => {
      await expect(teamsIntegration.initialize()).resolves.not.toThrow();
    });

    it('should create a test meeting', async () => {
      const meeting = await teamsIntegration.startMeeting('Test Meeting');
      expect(meeting.joinUrl).toMatch(/^https:\/\/teams\.microsoft\.com/);
      expect(meeting.threadId).toBeDefined();
    });
  });

  describe('Audio Streaming', () => {
    it('should start audio stream', async () => {
      const stream = await audioService.startAudioStream();
      activeStreams.push(stream as MockMediaStream);
      
      expect(stream).toBeDefined();
      expect(stream.active).toBe(true);
      
      const audioTracks = stream.getAudioTracks();
      expect(audioTracks.length).toBe(1);
      
      const settings = audioTracks[0].getSettings();
      expect(settings.channelCount).toBe(2);
      expect(settings.sampleRate).toBe(48000);
    });

    it('should properly cleanup stream on stop', async () => {
      const stream = await audioService.startAudioStream();
      activeStreams.push(stream as MockMediaStream);
      
      await audioService.stopAudioStream();
      
      const tracks = stream.getAudioTracks();
      tracks.forEach(track => {
        expect(track.readyState).toBe('ended');
      });
    });
  });

  describe('Speech Services', () => {
    let audioStream: MediaStream;

    beforeEach(async () => {
      audioStream = await audioService.startAudioStream();
      activeStreams.push(audioStream as MockMediaStream);
    });

    afterEach(async () => {
      await audioService.stopAudioStream();
    });

    it('should convert text to speech', async () => {
      const testText = 'Testing speech synthesis';
      const audioData = await speechService.textToSpeech(testText);
      expect(audioData).toBeInstanceOf(ArrayBuffer);
      expect(audioData.byteLength).toBeGreaterThan(0);
    });

    it('should convert speech to text', async () => {
      const audioConfig = {
        stream: audioStream
      };
      const recognizedText = await speechService.speechToText(audioConfig);
      expect(recognizedText).toBeDefined();
    });
  });

  describe('Value Creation Processing', () => {
    it('should process real-time value metrics', async () => {
      const testProduct = {
        id: 'test-product',
        name: 'Test Product',
        price: 100,
        category: 'test'
      };

      const testPattern = {
        id: 'test-pattern',
        signals: [],
        confidence: 0.9
      };

      const metrics = await resonanceField.measureValueCreation(testProduct, testPattern);
      expect(metrics.realTimeMetrics).toBeDefined();
      expect(metrics.realTimeMetrics.revenue).toBeGreaterThanOrEqual(0);
      expect(metrics.realTimeMetrics.profitMargin).toBeLessThanOrEqual(1);
    });
  });

  describe('Error Recovery', () => {
    it('should handle authentication errors', async () => {
      const error = new ServiceError(
        'Authentication failed',
        'AUTH_FAILED',
        'Teams',
        true
      );
      await expect(ErrorHandler.handleError(error)).resolves.not.toThrow();
    });

    it('should handle network errors', async () => {
      const error = new ServiceError(
        'Network connection lost',
        'CONNECTION_LOST',
        'Communication',
        true
      );
      await expect(ErrorHandler.handleError(error)).resolves.not.toThrow();
    });

    it('should handle service errors', async () => {
      const error = new ServiceError(
        'Service unavailable',
        'SERVICE_DOWN',
        'Speech',
        true
      );
      await expect(ErrorHandler.handleError(error)).resolves.not.toThrow();
    });

    it('should cleanup resources after error', async () => {
      const stream = await audioService.startAudioStream();
      activeStreams.push(stream as MockMediaStream);

      const error = new ServiceError(
        'Stream error',
        'STREAM_ERROR',
        'Audio',
        true
      );

      await ErrorHandler.handleError(error);
      await audioService.stopAudioStream();

      const tracks = stream.getAudioTracks();
      tracks.forEach(track => {
        expect(track.readyState).toBe('ended');
      });
    });
  });
});
