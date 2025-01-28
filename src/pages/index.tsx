import React from 'react';
import { useState, useEffect } from 'react';
import Head from 'next/head';

interface RevenueStats {
  totalClicks: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number;
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<RevenueStats | null>(null);

  // Fetch stats every 15 seconds
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userId = `user_${Math.random().toString(36).substring(7)}`;
      const response = await fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to find matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError('Error finding AI tools. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAffiliateClick = async (affiliateUrl: string) => {
    window.open(affiliateUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>ValueEx - Find Your Perfect AI Tool</title>
        <meta name="description" content="Discover the best AI tools for your needs" />
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css"
          rel="stylesheet"
        />
      </Head>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Clicks</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.totalClicks}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Total Sales</h3>
              <p className="text-2xl font-bold text-green-600">{stats.totalSales}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Revenue</h3>
              <p className="text-2xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold text-gray-700">Conversion Rate</h3>
              <p className="text-2xl font-bold text-purple-600">
                {(stats.conversionRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        )}

        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Find Your Perfect AI Tool
        </h1>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What kind of AI tool are you looking for? (e.g., writing, image generation)"
              className="flex-1 p-4 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !query}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Find Tools'}
            </button>
          </div>
        </form>

        {error && <div className="p-4 mb-6 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <div className="grid gap-6">
          {matches.map((match: any) => (
            <div key={match.id} className="p-6 bg-white rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-2">{match.name}</h2>
              <p className="text-gray-600 mb-4">{match.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">
                  {match.price ? `Starting at $${match.price}/month` : 'Custom Pricing'}
                </span>
                <button
                  onClick={() => handleAffiliateClick(match.affiliateUrl)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>

        {matches.length === 0 && !loading && query && (
          <p className="text-center text-gray-600">
            No matches found. Try a different search term.
          </p>
        )}

        <div id="revenue-flow" className="mt-8 h-96 bg-white rounded-lg shadow-md"></div>
      </main>
    </div>
  );
}
