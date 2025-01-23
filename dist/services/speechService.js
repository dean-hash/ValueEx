"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpeechService = void 0;
const microsoft_cognitiveservices_speech_sdk_1 = require("microsoft-cognitiveservices-speech-sdk");
class SpeechService {
    constructor() {
        this.speechConfig = microsoft_cognitiveservices_speech_sdk_1.SpeechConfig.fromSubscription(process.env.SPEECH_KEY, process.env.SPEECH_REGION);
        this.configure();
    }
    configure(options = {}) {
        this.speechConfig.speechRecognitionLanguage = options.language || 'en-US';
        this.speechConfig.speechSynthesisVoiceName = options.voice || 'en-US-JennyNeural';
    }
    async textToSpeech(text) {
        return new Promise((resolve, reject) => {
            const synthesizer = new microsoft_cognitiveservices_speech_sdk_1.SpeechSynthesizer(this.speechConfig);
            synthesizer.speakTextAsync(text, result => {
                synthesizer.close();
                resolve(result.audioData);
            }, error => {
                synthesizer.close();
                reject(error);
            });
        });
    }
    async speechToText(audioStream) {
        return new Promise((resolve, reject) => {
            const recognizer = new microsoft_cognitiveservices_speech_sdk_1.SpeechRecognizer(this.speechConfig, audioStream);
            recognizer.recognizeOnceAsync(result => {
                recognizer.close();
                resolve(result.text);
            }, error => {
                recognizer.close();
                reject(error);
            });
        });
    }
    async startContinuousRecognition(audioStream, onResult) {
        const recognizer = new microsoft_cognitiveservices_speech_sdk_1.SpeechRecognizer(this.speechConfig, audioStream);
        recognizer.recognized = (_, event) => {
            if (event.result.text) {
                onResult(event.result.text);
            }
        };
        await recognizer.startContinuousRecognitionAsync();
        return recognizer;
    }
    async stopContinuousRecognition(recognizer) {
        await recognizer.stopContinuousRecognitionAsync();
        recognizer.close();
    }
}
exports.SpeechService = SpeechService;
//# sourceMappingURL=speechService.js.map