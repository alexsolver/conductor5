
export class QueryPerformanceAnalyzer {
  private static slowQueries = new Map<string, number>();

  static logSlowQuery(query: string, duration: number, threshold = 1000) {
    if (duration > threshold) {
      const count = this.slowQueries.get(query) || 0;
      this.slowQueries.set(query, count + 1);
      
      console.warn(`[QueryPerformance] Slow query detected (${duration}ms):`, {
        query: query.substring(0, 100) + '...',
        duration,
        occurrences: count + 1
      });
    }
  }

  static getSlowQueryReport() {
    return Array.from(this.slowQueries.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({
        query: query.substring(0, 200) + '...',
        occurrences: count
      }));
  }
}
