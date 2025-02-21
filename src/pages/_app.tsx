import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { NetworkGraph } from '../visualization/NetworkGraph';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Initialize revenue flow visualization
    const container = document.getElementById('revenue-flow');
    if (container) {
      const graph = new NetworkGraph('revenue-flow', container.clientWidth, container.clientHeight);

      // Sample data - replace with real revenue flow
      const nodes = [
        { id: 'user', label: 'User', type: 'user' },
        { id: 'valueex', label: 'ValueEx', type: 'platform' },
        { id: 'jasper', label: 'Jasper', type: 'affiliate' },
        { id: 'midjourney', label: 'Midjourney', type: 'affiliate' },
        { id: 'anthropic', label: 'Anthropic', type: 'affiliate' },
      ];

      const links = [
        { source: 'user', target: 'valueex', type: 'click' },
        { source: 'valueex', target: 'jasper', type: 'conversion' },
        { source: 'valueex', target: 'midjourney', type: 'conversion' },
        { source: 'valueex', target: 'anthropic', type: 'conversion' },
      ];

      graph.updateData(nodes, links);

      // Update every 30 seconds
      const interval = setInterval(() => {
        graph.updateData(nodes, links);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  return <Component {...pageProps} />;
}
