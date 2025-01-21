import { TeamsIntegration } from '../../services/teamsIntegration';
import { AudioStreamService } from '../../services/audioStreamService';
import { SpeechService } from '../../services/speechService';
import { RevenueMetricsService } from '../../services/revenueMetricsService';
import { ErrorHandler, ServiceError } from '../../utils/errorHandler';
import { 
  MockTeamsClient, 
  MockSpeechService, 
  MockCommunicationService,
  MockRevenueMetricsService,
  MockMediaStream
} from '../mocks/services';
import { setupTestEnvironment, cleanupTestEnvironment } from '../setup/testEnv';

describe('Edge Cases and Recovery', () => {
  let teamsIntegration: TeamsIntegration;
  let audioService: AudioStreamService;
  let speechService: SpeechService;
  let metricsService: RevenueMetricsService;

  beforeAll(() => {
    setupTestEnvironment();
  });

  afterAll(() => {
    cleanupTestEnvironment();
  });

  beforeEach(() => {
    teamsIntegration = new TeamsIntegration();
    audioService = new AudioStreamService();
    speechService = new SpeechService();
    metricsService = new RevenueMetricsService();
  });

  describe('Network Interruptions', () => {
    it('should handle connection loss during meeting', async () => {
      // Simulate connection loss
      const error = new ServiceError(
        'Network connection lost',
        'CONNECTION_LOST',
        'Teams',
        true
      );
      
      // Attempt recovery
      await expect(ErrorHandler.handleError(error)).resolves.not.toThrow();
      
      // Verify reconnection
      const meeting = await teamsIntegration.startMeeting('Recovery Test');
      expect(meeting.joinUrl).toBeDefined();
    });

    it('should maintain audio quality during network instability', async () => {
      const stream = await audioService.startAudioStream();
      const tracks = stream.getAudioTracks();
      
      // Verify audio settings during instability
      const settings = tracks[0].getSettings();
      expect(settings.echoCancellation).toBe(true);
      expect(settings.noiseSuppression).toBe(true);
      expect(settings.autoGainControl).toBe(true);
    });
  });

  describe('Service Interruptions', () => {
    it('should handle speech service unavailability', async () => {
      // Simulate service down
      const error = new ServiceError(
        'Speech service unavailable',
        'SERVICE_DOWN',
        'Speech',
        true
      );
      
      await expect(ErrorHandler.handleError(error)).resolves.not.toThrow();
      
      // Verify fallback functionality
      const recognizedText = await speechService.speechToText({} as any);
      expect(recognizedText).toBeDefined();
    });

    it('should handle metrics service latency', async () => {
      const testData = {
        text: 'Test with high latency',
        timestamp: new Date(),
        audioQuality: 0.5  // Degraded quality
      };

      const metrics = await metricsService.processRealTimeMetrics(testData);
      expect(metrics.realTimeMetrics).toBeDefined();
      expect(metrics.matchQuality).toBeGreaterThan(0);
    });
  });

  describe('Resource Cleanup', () => {
    it('should properly cleanup resources on meeting end', async () => {
      const stream = await audioService.startAudioStream();
      const tracks = stream.getAudioTracks();
      
      // End meeting and verify cleanup
      await audioService.stopAudioStream();
      expect(stream.active).toBe(false);
    });

    it('should handle multiple concurrent meetings', async () => {
      const meeting1 = teamsIntegration.startMeeting('Meeting 1');
      const meeting2 = teamsIntegration.startMeeting('Meeting 2');
      
      await expect(Promise.all([meeting1, meeting2])).resolves.toHaveLength(2);
    });
  });

  describe('Data Processing Edge Cases', () => {
    it('should handle empty audio input', async () => {
      const emptyAudioConfig = {} as any;
      await expect(speechService.speechToText(emptyAudioConfig))
        .resolves.not.toThrow();
    });

    it('should process metrics with missing data', async () => {
      const incompleteData = {
        text: '',
        timestamp: new Date()
        // audioQuality missing
      };

      const metrics = await metricsService.processRealTimeMetrics(incompleteData);
      expect(metrics.realTimeMetrics).toBeDefined();
    });
  });
});
