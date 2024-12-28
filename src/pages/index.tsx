import { useState } from 'react';
import { DigitalIntelligence } from '../services/digitalIntelligence';
import { DemandValidator } from '../services/mvp/demandValidator';
import { logger } from '../utils/logger';

export default function Home() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const analyzeDemand = async () => {
    try {
      setLoading(true);
      
      // Get instances
      const intelligence = new DigitalIntelligence();
      const validator = DemandValidator.getInstance();

      // Analyze and validate demand
      const analysis = await intelligence.analyzeNeed(input);
      const validation = await validator.validateDemand(input);

      // Add to results
      setResults(prev => [{
        timestamp: new Date().toISOString(),
        input,
        analysis,
        validation,
      }, ...prev]);

      // Log for tracking
      logger.info('Demand analyzed:', {
        input,
        isValid: validation.isRealDemand,
        confidence: validation.confidence
      });

      setInput('');
    } catch (error) {
      logger.error('Error analyzing demand:', error);
      alert('Error analyzing demand. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-2xl font-bold mb-8">ValueEx Demand Analyzer</h2>
                
                {/* Input Section */}
                <div className="mb-8">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full p-4 border rounded-lg"
                    rows={4}
                    placeholder="Enter text to analyze demand (e.g., Reddit posts, comments, or any text containing potential demand signals)"
                  />
                  <button
                    onClick={analyzeDemand}
                    disabled={loading || !input.trim()}
                    className={`mt-4 w-full py-2 px-4 rounded ${
                      loading || !input.trim()
                        ? 'bg-gray-400'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white font-semibold`}
                  >
                    {loading ? 'Analyzing...' : 'Analyze Demand'}
                  </button>
                </div>

                {/* Results Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">Analysis Results</h3>
                  {results.map((result, index) => (
                    <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50">
                      <div className="text-sm text-gray-500 mb-2">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <strong>Input:</strong> {result.input}
                      </div>
                      <div className="mb-2">
                        <strong>Is Real Demand:</strong>{' '}
                        <span
                          className={`px-2 py-1 rounded ${
                            result.validation.isRealDemand
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {result.validation.isRealDemand ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="mb-2">
                        <strong>Confidence:</strong>{' '}
                        {(result.validation.confidence * 100).toFixed(1)}%
                      </div>
                      {result.validation.signals.length > 0 && (
                        <div>
                          <strong>Signals:</strong>
                          <ul className="list-disc pl-5 mt-2">
                            {result.validation.signals.map((signal: any, i: number) => (
                              <li key={i} className="mb-1">
                                {signal.type} (Strength: {(signal.strength * 100).toFixed(1)}%)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
