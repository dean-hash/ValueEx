import { describe, expect, beforeEach, it, jest } from '@jest/globals';
import { TeamsService, MeetingInfo } from '../../services/minimal';
import { setupMinimalTestEnv } from '../setup/minimal';

// Set up test environment
setupMinimalTestEnv();

// Create a mock class that extends TeamsService
class MockTeamsService extends TeamsService {
  protected override async makeApiCall(_endpoint: string, data: any): Promise<any> {
    return Promise.resolve(data);
  }

  protected override async authenticate(): Promise<void> {
    return Promise.resolve();
  }
}

// Mock the module
jest.mock('../../services/minimal', () => {
  return {
    TeamsService: jest.fn().mockImplementation(() => {
      return new MockTeamsService();
    })
  };
});

describe('Teams Integration Tests', () => {
  let teamsService: MockTeamsService;

  beforeEach(() => {
    teamsService = new MockTeamsService();
    jest.clearAllMocks();
  });

  describe('Meeting Management', () => {
    it('should create a new meeting with valid parameters', async () => {
      const subject = 'Value Analysis Session';
      const mockMeeting: MeetingInfo = {
        subject,
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/test',
        threadId: 'test-thread-id'
      };

      jest.spyOn(teamsService as any, 'makeApiCall').mockResolvedValueOnce(mockMeeting);
      const meeting = await teamsService.startMeeting(subject);

      expect(meeting).toBeDefined();
      expect(meeting.subject).toBe(subject);
      expect(meeting.joinUrl).toMatch(/^https:\/\/teams\.microsoft\.com\/l\/meetup-join/);
      expect(meeting.threadId).toBeDefined();
    });

    it('should handle empty subject gracefully', async () => {
      const subject = '';
      await expect(teamsService.startMeeting(subject))
        .rejects
        .toThrow('Meeting subject is required');
    });

    it('should handle special characters in subject', async () => {
      const subject = 'Value Analysis & Strategy (2025) - €£¥';
      const mockMeeting: MeetingInfo = {
        subject,
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/test',
        threadId: 'test-thread-id'
      };

      jest.spyOn(teamsService as any, 'makeApiCall').mockResolvedValueOnce(mockMeeting);
      const meeting = await teamsService.startMeeting(subject);
      
      expect(meeting.subject).toBe(subject);
      expect(meeting.joinUrl).toMatch(/^https:\/\/teams\.microsoft\.com\/l\/meetup-join/);
    });
  });

  describe('Audio Stream Management', () => {
    it('should initialize audio stream', async () => {
      const mockMeeting: MeetingInfo = {
        subject: 'Audio Test',
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/test',
        threadId: 'test-thread-id'
      };

      jest.spyOn(teamsService as any, 'makeApiCall').mockResolvedValueOnce(mockMeeting);
      const meeting = await teamsService.startMeeting('Audio Test');
      const stream = await teamsService.initializeAudioStream(meeting.threadId);
      
      expect(stream).toBeDefined();
      expect(stream.status).toBe('active');
      expect(stream.sampleRate).toBeGreaterThan(0);
    });

    it('should handle audio stream errors gracefully', async () => {
      await expect(teamsService.initializeAudioStream('invalid-thread'))
        .rejects
        .toThrow('Invalid thread ID');
    });
  });

  describe('Speech-to-Text Integration', () => {
    it('should transcribe audio in real-time', async () => {
      const mockMeeting: MeetingInfo = {
        subject: 'Transcription Test',
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/test',
        threadId: 'test-thread-id'
      };

      jest.spyOn(teamsService as any, 'makeApiCall').mockResolvedValueOnce(mockMeeting);
      const meeting = await teamsService.startMeeting('Transcription Test');
      const stream = await teamsService.initializeAudioStream(meeting.threadId);
      
      const audioData = Buffer.from('mock audio data');
      const transcription = await teamsService.transcribeAudio(audioData);
      
      expect(transcription).toBeDefined();
      expect(transcription.text).toBeDefined();
      expect(transcription.confidence).toBeGreaterThanOrEqual(0);
      expect(transcription.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle silence or low-quality audio', async () => {
      const emptyAudio = Buffer.alloc(0);
      const transcription = await teamsService.transcribeAudio(emptyAudio);
      
      expect(transcription.text).toBe('');
      expect(transcription.confidence).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle network interruptions', async () => {
      jest.spyOn(teamsService as any, 'makeApiCall').mockRejectedValueOnce(new Error('Network error'));

      await expect(teamsService.startMeeting('Test Meeting'))
        .rejects
        .toThrow('Network error');
    });

    it('should handle authentication failures', async () => {
      jest.spyOn(teamsService as any, 'authenticate').mockRejectedValueOnce(new Error('Authentication failed'));

      await expect(teamsService.initialize())
        .rejects
        .toThrow('Authentication failed');
    });

    it('should retry failed operations', async () => {
      const mockMeeting: MeetingInfo = {
        subject: 'Retry Test',
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/test',
        threadId: 'test-thread-id'
      };

      const spy = jest.spyOn(teamsService as any, 'makeApiCall')
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce(mockMeeting);

      const meeting = await teamsService.startMeeting('Retry Test');
      expect(meeting).toBeDefined();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Resource Management', () => {
    it('should clean up resources after meeting ends', async () => {
      const mockMeeting: MeetingInfo = {
        subject: 'Cleanup Test',
        joinUrl: 'https://teams.microsoft.com/l/meetup-join/test',
        threadId: 'test-thread-id'
      };

      jest.spyOn(teamsService as any, 'makeApiCall').mockResolvedValueOnce(mockMeeting);
      const meeting = await teamsService.startMeeting('Cleanup Test');
      const stream = await teamsService.initializeAudioStream(meeting.threadId);
      
      await teamsService.endMeeting(meeting.threadId);
      
      await expect(teamsService.getStreamStatus(meeting.threadId))
        .rejects
        .toThrow('Meeting has ended');
    });

    it('should handle concurrent meetings', async () => {
      const mockMeetings: MeetingInfo[] = [
        {
          subject: 'Meeting 1',
          joinUrl: 'https://teams.microsoft.com/l/meetup-join/test1',
          threadId: 'thread-1'
        },
        {
          subject: 'Meeting 2',
          joinUrl: 'https://teams.microsoft.com/l/meetup-join/test2',
          threadId: 'thread-2'
        },
        {
          subject: 'Meeting 3',
          joinUrl: 'https://teams.microsoft.com/l/meetup-join/test3',
          threadId: 'thread-3'
        }
      ];

      const spy = jest.spyOn(teamsService as any, 'makeApiCall')
        .mockResolvedValueOnce(mockMeetings[0])
        .mockResolvedValueOnce(mockMeetings[1])
        .mockResolvedValueOnce(mockMeetings[2]);

      const meetings = await Promise.all([
        teamsService.startMeeting('Meeting 1'),
        teamsService.startMeeting('Meeting 2'),
        teamsService.startMeeting('Meeting 3')
      ]);

      expect(meetings).toHaveLength(3);
      meetings.forEach(meeting => {
        expect(meeting.joinUrl).toBeDefined();
        expect(meeting.threadId).toBeDefined();
      });
      expect(spy).toHaveBeenCalledTimes(3);
    });
  });
});
