import { useState } from 'react';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [subreddit, setSubreddit] = useState('');
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');

  const analyzeDemandForProduct = async () => {
    try {
      setLoading(true);

      const response = await fetch('/api/analyze-product-demand', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: Date.now().toString(), // temporary ID for testing
          productName,
          productCategory,
          subreddit: subreddit || 'all',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze product demand');
      }

      const result = await response.json();
      setResults((prev) => [result, ...prev]);

      // Clear inputs after successful analysis
      setProductName('');
      setProductCategory('');
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message || 'Error analyzing product demand');
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
                <h2 className="text-2xl font-bold mb-8">ValueEx Product Demand Analyzer</h2>

                {/* Product Input Section */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">1. Enter Product Details</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Product Name</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., iPhone 15, Nike Air Max, etc."
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <input
                      type="text"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="e.g., Electronics, Shoes, etc."
                    />
                  </div>
                </div>

                {/* Subreddit Filter */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold mb-4">2. Filter Demand Sources</h3>
                  <label className="block text-sm font-medium text-gray-700">Subreddit</label>
                  <input
                    type="text"
                    value={subreddit}
                    onChange={(e) => setSubreddit(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 'all' or specific subreddit"
                  />
                </div>

                {/* Analyze Button */}
                <button
                  onClick={analyzeDemandForProduct}
                  disabled={loading || !productName.trim()}
                  className={`w-full py-2 px-4 rounded ${
                    loading || !productName.trim() ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
                  } text-white font-semibold`}
                >
                  {loading ? 'Analyzing...' : 'Analyze Demand'}
                </button>

                {/* Results Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-semibold mb-4">3. Demand Analysis Results</h3>
                  {results.map((result, index) => (
                    <div key={index} className="mb-6 p-4 border rounded-lg bg-gray-50">
                      <div className="text-sm text-gray-500 mb-2">
                        {new Date(result.timestamp).toLocaleString()}
                      </div>
                      <div className="mb-2">
                        <strong>Product:</strong> {result.productName}
                      </div>
                      <div className="mb-2">
                        <strong>Category:</strong> {result.productCategory}
                      </div>
                      <div className="mb-2">
                        <strong>Demand Score:</strong>{' '}
                        <span
                          className={`px-2 py-1 rounded ${
                            result.demandScore > 0.7
                              ? 'bg-green-100 text-green-800'
                              : result.demandScore > 0.4
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {(result.demandScore * 100).toFixed(1)}%
                        </span>
                      </div>
                      {result.signals?.map((signal: any, sigIndex: number) => (
                        <div key={sigIndex} className="mt-4 p-3 bg-white rounded border">
                          <div>
                            <strong>Source:</strong> {signal.source}
                          </div>
                          <div>
                            <strong>Relevance:</strong> {(signal.relevance * 100).toFixed(1)}%
                          </div>
                          <div className="mt-2">
                            <strong>Key Points:</strong>
                            <ul className="list-disc pl-5">
                              {signal.keyPoints?.map((point: string, i: number) => (
                                <li key={i}>{point}</li>
                              ))}
                            </ul>
                          </div>
                          {signal.pricePoints && signal.pricePoints.length > 0 && (
                            <div className="mt-2">
                              <strong>Price Points Mentioned:</strong>
                              <ul className="list-disc pl-5">
                                {signal.pricePoints.map((price: any, i: number) => (
                                  <li key={i}>
                                    ${price.value} ({price.context})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
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
