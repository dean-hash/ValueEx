import { AudioConfig, SpeechRecognizer } from 'microsoft-cognitiveservices-speech-sdk';
export declare class SpeechService {
    private speechConfig;
    constructor();
    private configure;
    textToSpeech(text: string): Promise<ArrayBuffer>;
    speechToText(audioStream: AudioConfig): Promise<string>;
    startContinuousRecognition(audioStream: AudioConfig, onResult: (text: string) => void): Promise<SpeechRecognizer>;
    stopContinuousRecognition(recognizer: SpeechRecognizer): Promise<void>;
}
