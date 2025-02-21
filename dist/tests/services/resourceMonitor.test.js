import { ResourceMonitor } from '../../services/monitoring/resourceMonitor';
jest.mock('os');
jest.mock('fs');
describe('ResourceMonitor Tests', () => {
    let monitor;
    let mockMetrics;
    let alertCallback;
    beforeEach(() => {
        // Mock MetricsCollector
        mockMetrics = {
            recordResourceMetric: jest.fn(),
            recordApiMetrics: jest.fn(),
            getAverageMetric: jest.fn(),
            clearMetrics: jest.fn(),
            on: jest.fn(),
            emit: jest.fn(),
        };
        monitor = new ResourceMonitor(mockMetrics);
        // Mock process.memoryUsage
        const mockMemoryUsage = jest.fn().mockReturnValue({
            rss: 1024 * 1024, // 1MB in bytes
            heapTotal: 512 * 1024,
            heapUsed: 256 * 1024,
            external: 0,
            arrayBuffers: 0,
        });
        process.memoryUsage = mockMemoryUsage;
        // Mock os module
        const os = require('os');
        os.cpus = jest.fn().mockReturnValue([
            {
                model: 'Intel(R) Core(TM) i7',
                speed: 2800,
                times: {
                    user: 1000,
                    nice: 0,
                    sys: 500,
                    idle: 8500,
                    irq: 0,
                },
            },
        ]);
        os.totalmem = jest.fn().mockReturnValue(8 * 1024 * 1024 * 1024); // 8GB
        os.freemem = jest.fn().mockReturnValue(4 * 1024 * 1024 * 1024); // 4GB
        os.loadavg = jest.fn().mockReturnValue([1.5, 1.2, 1.0]);
        os.networkInterfaces = jest.fn().mockReturnValue({
            eth0: [
                {
                    address: '192.168.1.1',
                    netmask: '255.255.255.0',
                    family: 'IPv4',
                    mac: '00:00:00:00:00:00',
                    internal: false,
                    cidr: '192.168.1.1/24',
                    bytes: {
                        received: 1000,
                        sent: 2000,
                    },
                },
            ],
        });
        // Mock fs module
        const fs = require('fs');
        fs.statfs = (path, callback) => {
            callback(null, {
                type: 0x65735546,
                bsize: 4096,
                blocks: 1000000,
                bfree: 500000,
                bavail: 400000,
                files: 1000000,
                ffree: 500000,
            });
        };
        alertCallback = jest.fn();
        monitor.on('alert', alertCallback);
    });
    afterEach(() => {
        monitor.stopMonitoring();
        jest.clearAllMocks();
    });
    describe('Basic Functionality', () => {
        it('should start monitoring resources', async () => {
            monitor.startMonitoring(1000);
            await new Promise((resolve) => setTimeout(resolve, 1100));
            expect(mockMetrics.recordResourceMetric).toHaveBeenCalled();
        });
        it('should stop monitoring when requested', () => {
            monitor.startMonitoring(1000);
            monitor.stopMonitoring();
            expect(monitor.isMonitoring()).toBeFalsy();
        });
        it('should capture resource snapshots', async () => {
            const snapshot = await monitor.captureSnapshot();
            expect(snapshot).toHaveProperty('timestamp');
            expect(snapshot).toHaveProperty('cpu');
            expect(snapshot).toHaveProperty('memory');
            expect(snapshot).toHaveProperty('disk');
            expect(snapshot).toHaveProperty('network');
        });
    });
    describe('Memory Monitoring', () => {
        it('should track memory usage correctly', async () => {
            const memoryUsage = await monitor.getMemoryUsage();
            expect(memoryUsage).toHaveProperty('total');
            expect(memoryUsage).toHaveProperty('used');
            expect(memoryUsage).toHaveProperty('free');
            expect(memoryUsage.total).toBeGreaterThan(memoryUsage.used);
        });
        it('should detect high memory usage', async () => {
            // Mock high memory usage
            const mockHighMemUsage = jest.fn().mockReturnValue({
                rss: 7 * 1024 * 1024 * 1024, // 7GB of 8GB total
                heapTotal: 6 * 1024 * 1024 * 1024,
                heapUsed: 5.5 * 1024 * 1024 * 1024,
                external: 0,
                arrayBuffers: 0,
            });
            process.memoryUsage = mockHighMemUsage;
            await monitor.captureSnapshot();
            expect(alertCallback).toHaveBeenCalledWith(expect.objectContaining({
                type: 'memory',
                severity: 'warning',
            }));
        });
    });
    describe('Network Monitoring', () => {
        it('should track network metrics', async () => {
            const networkMetrics = await monitor.getNetworkMetrics();
            expect(networkMetrics).toHaveProperty('latency');
            expect(networkMetrics).toHaveProperty('bytesIn');
            expect(networkMetrics).toHaveProperty('bytesOut');
        });
        it('should handle network errors gracefully', async () => {
            const os = require('os');
            os.networkInterfaces = jest.fn().mockImplementation(() => {
                throw new Error('Network error');
            });
            const metrics = await monitor.getNetworkMetrics();
            expect(metrics).toEqual({
                latency: 0,
                bytesIn: 0,
                bytesOut: 0,
            });
        });
    });
    describe('Resource History', () => {
        it('should maintain snapshot history within limits', async () => {
            monitor.startMonitoring(100);
            await new Promise((resolve) => setTimeout(resolve, 550));
            const snapshots = monitor.getSnapshots();
            expect(snapshots.length).toBeLessThanOrEqual(monitor['MAX_SNAPSHOTS']);
        });
        it('should clear history when requested', () => {
            monitor.clearHistory();
            expect(monitor.getSnapshots()).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=resourceMonitor.test.js.map