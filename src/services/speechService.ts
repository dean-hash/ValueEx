import { 
  SpeechConfig, 
  AudioConfig, 
  SpeechRecognizer,
  SpeechSynthesizer 
} from 'microsoft-cognitiveservices-speech-sdk';
import { credentials } from '../../scripts/getGraphToken';

interface SpeechOptions {
  language?: string;
  voice?: string;
  recognitionMode?: 'Interactive' | 'Conversation' | 'Dictation';
}

export class SpeechService {
  private speechConfig: SpeechConfig;
  
  constructor() {
    this.speechConfig = SpeechConfig.fromSubscription(
      process.env.SPEECH_KEY!,
      process.env.SPEECH_REGION!
    );
    this.configure();
  }

  private configure(options: SpeechOptions = {}) {
    this.speechConfig.speechRecognitionLanguage = options.language || 'en-US';
    this.speechConfig.speechSynthesisVoiceName = options.voice || 'en-US-JennyNeural';
  }

  async textToSpeech(text: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const synthesizer = new SpeechSynthesizer(this.speechConfig);
      
      synthesizer.speakTextAsync(
        text,
        result => {
          synthesizer.close();
          resolve(result.audioData);
        },
        error => {
          synthesizer.close();
          reject(error);
        }
      );
    });
  }

  async speechToText(audioStream: AudioConfig): Promise<string> {
    return new Promise((resolve, reject) => {
      const recognizer = new SpeechRecognizer(this.speechConfig, audioStream);
      
      recognizer.recognizeOnceAsync(
        result => {
          recognizer.close();
          resolve(result.text);
        },
        error => {
          recognizer.close();
          reject(error);
        }
      );
    });
  }

  async startContinuousRecognition(
    audioStream: AudioConfig,
    onResult: (text: string) => void
  ): Promise<SpeechRecognizer> {
    const recognizer = new SpeechRecognizer(this.speechConfig, audioStream);
    
    recognizer.recognized = (_, event) => {
      if (event.result.text) {
        onResult(event.result.text);
      }
    };

    await recognizer.startContinuousRecognitionAsync();
    return recognizer;
  }

  async stopContinuousRecognition(recognizer: SpeechRecognizer): Promise<void> {
    await recognizer.stopContinuousRecognitionAsync();
    recognizer.close();
  }
}
