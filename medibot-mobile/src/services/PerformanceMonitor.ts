/**
 * PERFORMANCE MONITORING SERVICE
 * Tracks screen load times, navigation performance, and API response times
 * Helps identify bottlenecks and optimization opportunities
 */

import { createLogger } from './Logger';

const logger = createLogger('PerformanceMonitor');

interface PerformanceMetric {
  id: string;
  type: 'screen_load' | 'navigation' | 'api_call' | 'render' | 'action';
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  timestamp: Date;
}

interface PerformanceStats {
  totalMetrics: number;
  averageScreenLoad: number;
  averageNavigation: number;
  averageApiCall: number;
  slowestOperations: PerformanceMetric[];
  recentMetrics: PerformanceMetric[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private activeTimers: Map<string, number> = new Map();
  private maxMetrics = 500; // Keep last 500 metrics
  private enabled = true; // Can disable in production if needed

  private constructor() {
    logger.info('Performance Monitor initialized');
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start tracking a performance metric
   */
  startTracking(
    id: string,
    type: PerformanceMetric['type'],
    name: string,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    const startTime = performance.now();
    this.activeTimers.set(id, startTime);

    const metric: PerformanceMetric = {
      id,
      type,
      name,
      startTime,
      metadata,
      timestamp: new Date(),
    };

    logger.info('Started tracking', { name, id, type });
  }

  /**
   * Stop tracking and record the metric
   */
  stopTracking(id: string, additionalMetadata?: Record<string, any>): number | null {
    if (!this.enabled) return null;

    const startTime = this.activeTimers.get(id);
    if (!startTime) {
      logger.warn('No active timer found', { id });
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Find and update the metric
    const metricIndex = this.metrics.findIndex(m => m.id === id && !m.endTime);
    if (metricIndex === -1) {
      // Create new metric if not found
      const existingMetric = this.metrics.find(m => m.id === id);
      if (existingMetric) {
        existingMetric.endTime = endTime;
        existingMetric.duration = duration;
        if (additionalMetadata) {
          existingMetric.metadata = { ...existingMetric.metadata, ...additionalMetadata };
        }
      }
    } else {
      this.metrics[metricIndex].endTime = endTime;
      this.metrics[metricIndex].duration = duration;
      if (additionalMetadata) {
        this.metrics[metricIndex].metadata = {
          ...this.metrics[metricIndex].metadata,
          ...additionalMetadata,
        };
      }
    }

    this.activeTimers.delete(id);

    // Log if slow
    if (duration > 1000) {
      logger.warn('Slow operation detected', { id, duration: duration.toFixed(2) });
    } else {
      logger.info('Completed tracking', { id, duration: duration.toFixed(2) });
    }

    // Keep metrics list manageable
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    return duration;
  }

  /**
   * Track a screen load
   */
  trackScreenLoad(screenName: string): string {
    const id = `screen_${screenName}_${Date.now()}`;
    this.startTracking(id, 'screen_load', screenName, { screen: screenName });
    return id;
  }

  /**
   * Track navigation
   */
  trackNavigation(from: string, to: string): string {
    const id = `nav_${from}_to_${to}_${Date.now()}`;
    this.startTracking(id, 'navigation', `${from} → ${to}`, { from, to });
    return id;
  }

  /**
   * Track API call
   */
  trackApiCall(endpoint: string, method: string = 'GET'): string {
    const id = `api_${method}_${endpoint}_${Date.now()}`;
    this.startTracking(id, 'api_call', `${method} ${endpoint}`, { endpoint, method });
    return id;
  }

  /**
   * Track a custom action
   */
  trackAction(actionName: string, metadata?: Record<string, any>): string {
    const id = `action_${actionName}_${Date.now()}`;
    this.startTracking(id, 'action', actionName, metadata);
    return id;
  }

  /**
   * Record a metric without tracking (for instant operations)
   */
  recordMetric(
    type: PerformanceMetric['type'],
    name: string,
    duration: number,
    metadata?: Record<string, any>
  ): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      id: `instant_${Date.now()}`,
      type,
      name,
      startTime: performance.now(),
      endTime: performance.now() + duration,
      duration,
      metadata,
      timestamp: new Date(),
    };

    this.metrics.push(metric);

    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const completed = this.metrics.filter(m => m.duration !== undefined);

    const screenLoads = completed.filter(m => m.type === 'screen_load');
    const navigations = completed.filter(m => m.type === 'navigation');
    const apiCalls = completed.filter(m => m.type === 'api_call');

    const avgScreenLoad = screenLoads.length > 0
      ? screenLoads.reduce((sum, m) => sum + (m.duration || 0), 0) / screenLoads.length
      : 0;

    const avgNavigation = navigations.length > 0
      ? navigations.reduce((sum, m) => sum + (m.duration || 0), 0) / navigations.length
      : 0;

    const avgApiCall = apiCalls.length > 0
      ? apiCalls.reduce((sum, m) => sum + (m.duration || 0), 0) / apiCalls.length
      : 0;

    const slowest = [...completed]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    const recent = [...completed].slice(-20);

    return {
      totalMetrics: completed.length,
      averageScreenLoad: avgScreenLoad,
      averageNavigation: avgNavigation,
      averageApiCall: avgApiCall,
      slowestOperations: slowest,
      recentMetrics: recent,
    };
  }

  /**
   * Get metrics by type
   */
  getMetricsByType(type: PerformanceMetric['type']): PerformanceMetric[] {
    return this.metrics.filter(m => m.type === type && m.duration !== undefined);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Print performance report to console
   */
  printReport(): void {
    const stats = this.getStats();

    logger.info('Performance Report', {
      totalMetrics: stats.totalMetrics,
      averageScreenLoad: stats.averageScreenLoad.toFixed(2),
      averageNavigation: stats.averageNavigation.toFixed(2),
      averageApiCall: stats.averageApiCall.toFixed(2),
      slowestOperations: stats.slowestOperations.slice(0, 5).map((metric, index) => ({
        rank: index + 1,
        name: metric.name,
        duration: metric.duration?.toFixed(2)
      }))
    });
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
    this.activeTimers.clear();
    logger.info('Performance metrics cleared');
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Performance monitoring ${enabled ? 'enabled' : 'disabled'}`, { enabled });
  }

  /**
   * Check if monitoring is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    const stats = this.getStats();
    return JSON.stringify({
      stats,
      allMetrics: this.metrics,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}

export default PerformanceMonitor;

/**
 * USAGE EXAMPLES:
 * 
 * // Track screen load
 * const monitor = PerformanceMonitor.getInstance();
 * const trackId = monitor.trackScreenLoad('ChatScreen');
 * // ... screen loads ...
 * monitor.stopTracking(trackId);
 * 
 * // Track navigation
 * const navId = monitor.trackNavigation('Home', 'Profile');
 * // ... navigation happens ...
 * monitor.stopTracking(navId);
 * 
 * // Track API call
 * const apiId = monitor.trackApiCall('/api/cases', 'GET');
 * // ... API call ...
 * monitor.stopTracking(apiId, { status: 200, responseSize: 1024 });
 * 
 * // Get performance report
 * monitor.printReport();
 * 
 * // Export metrics
 * const json = monitor.exportMetrics();
 */
