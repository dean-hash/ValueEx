import React, { useEffect, useState } from 'react';
import { AwinService, AwinServiceStatus } from '../../services/awinService';
import { Line } from 'react-chartjs-2';
import { formatDistanceToNow } from 'date-fns';

interface LatencyDataPoint {
    timestamp: Date;
    value: number;
}

const ApiStatusMonitor: React.FC = () => {
    const [status, setStatus] = useState<AwinServiceStatus | null>(null);
    const [latencyHistory, setLatencyHistory] = useState<LatencyDataPoint[]>([]);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        const awinService = new AwinService(
            process.env.REACT_APP_AWIN_API_KEY!,
            process.env.REACT_APP_AWIN_PUBLISHER_ID!
        );

        const updateStatus = () => {
            const currentStatus = awinService.getStatus();
            setStatus(currentStatus);
            
            if (currentStatus.latency) {
                setLatencyHistory(prev => [
                    ...prev.slice(-50), // Keep last 50 points
                    { timestamp: new Date(), value: currentStatus.latency! }
                ]);
            }
        };

        updateStatus();
        const interval = setInterval(updateStatus, 10000); // Update every 10s

        return () => clearInterval(interval);
    }, []);

    if (!status) return null;

    const statusColor = status.isAvailable ? 'bg-green-500' : 'bg-red-500';
    const latencyColor = status.latency && status.latency < 1000 ? 'text-green-600' : 'text-yellow-600';

    const chartData = {
        labels: latencyHistory.map(point => 
            formatDistanceToNow(point.timestamp, { addSuffix: true })
        ),
        datasets: [{
            label: 'API Latency (ms)',
            data: latencyHistory.map(point => point.value),
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    return (
        <div className="bg-white rounded-lg shadow-lg p-4 m-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${statusColor}`} />
                    <h3 className="text-lg font-semibold">Awin API Status</h3>
                </div>
                <button 
                    onClick={() => setExpanded(!expanded)}
                    className="text-gray-500 hover:text-gray-700"
                >
                    {expanded ? '▼' : '▶'}
                </button>
            </div>

            <div className={`mt-4 space-y-4 ${expanded ? 'block' : 'hidden'}`}>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <p className="font-medium">
                            {status.isAvailable ? 'Available' : 'Unavailable'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Latency</p>
                        <p className={`font-medium ${latencyColor}`}>
                            {status.latency ? `${status.latency}ms` : 'N/A'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Last Checked</p>
                        <p className="font-medium">
                            {formatDistanceToNow(status.lastChecked, { addSuffix: true })}
                        </p>
                    </div>
                    {status.error && (
                        <div className="col-span-2">
                            <p className="text-sm text-gray-500">Error</p>
                            <p className="font-medium text-red-600">{status.error}</p>
                        </div>
                    )}
                </div>

                {latencyHistory.length > 0 && (
                    <div className="h-64">
                        <Line data={chartData} options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    title: {
                                        display: true,
                                        text: 'Latency (ms)'
                                    }
                                }
                            }
                        }} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ApiStatusMonitor;
