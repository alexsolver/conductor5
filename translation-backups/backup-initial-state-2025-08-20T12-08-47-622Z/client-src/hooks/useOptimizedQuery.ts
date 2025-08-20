import { useQuery, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";

interface OptimizedQueryOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  queryKey: string | readonly unknown[];
  queryFn: () => Promise<T>;
  // Cache optimization options
  staleTime?: number;
  cacheTime?: number;
  // Performance optimization options
  keepPreviousData?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnMount?: boolean;
  // Batch optimization
  batchKey?: string;
}

// Smart cache configuration based on data type
const getCacheConfig = (queryKey: string | readonly unknown[]) => {
  const keyString = Array.isArray(queryKey) ? queryKey.join('-') : String(queryKey);
  
  // Configurações específicas por tipo de dados
  if (keyString.includes('field-options') || keyString.includes('config')) {
    return {
      staleTime: 10 * 60 * 1000, // 10 minutes - config data changes rarely
      cacheTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: false,
    };
  }
  
  if (keyString.includes('tickets') && !keyString.includes('history')) {
    return {
      staleTime: 2 * 60 * 1000, // 2 minutes - ticket data changes frequently
      cacheTime: 15 * 60 * 1000, // 15 minutes
      refetchOnWindowFocus: true,
      keepPreviousData: true,
    };
  }
  
  if (keyString.includes('users') || keyString.includes('customers')) {
    return {
      staleTime: 5 * 60 * 1000, // 5 minutes - user data changes occasionally
      cacheTime: 20 * 60 * 1000, // 20 minutes
      refetchOnWindowFocus: false,
    };
  }
  
  // Default configuration
  return {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
  };
};

export const useOptimizedQuery = <T>(options: OptimizedQueryOptions<T>) => {
  const queryClient = useQueryClient();
  
  // Merge smart cache config with user options
  const optimizedOptions = useMemo(() => {
    const cacheConfig = getCacheConfig(options.queryKey);
    return {
      ...cacheConfig,
      ...options,
      // Override with user-provided options if specified
      staleTime: options.staleTime ?? cacheConfig.staleTime,
      cacheTime: options.cacheTime ?? cacheConfig.cacheTime,
      refetchOnWindowFocus: options.refetchOnWindowFocus ?? cacheConfig.refetchOnWindowFocus,
    };
  }, [options]);

  const query = useQuery(optimizedOptions);

  // Prefetch related data intelligently
  const prefetchRelated = useCallback((relatedKeys: string[]) => {
    relatedKeys.forEach(key => {
      const relatedConfig = getCacheConfig(key);
      queryClient.prefetchQuery({
        queryKey: [key],
        queryFn: options.queryFn,
        staleTime: relatedConfig.staleTime,
      });
    });
  }, [queryClient, options.queryFn]);

  // Invalidate cache intelligently
  const invalidateRelated = useCallback((pattern: string) => {
    queryClient.invalidateQueries({ 
      queryKey: [pattern],
      type: 'all' 
    });
  }, [queryClient]);

  return {
    ...query,
    prefetchRelated,
    invalidateRelated,
    // Performance metrics
    isCached: query.isFetched && !query.isRefetching,
    isOptimized: true,
  };
};

// Hook for batch loading multiple queries
export const useBatchQueries = <T>(batchOptions: OptimizedQueryOptions<T>[]) => {
  const queryClient = useQueryClient();
  
  const queries = useMemo(() => 
    batchOptions.map(options => {
      const cacheConfig = getCacheConfig(options.queryKey);
      return {
        ...cacheConfig,
        ...options,
        staleTime: options.staleTime ?? cacheConfig.staleTime,
        cacheTime: options.cacheTime ?? cacheConfig.cacheTime,
      };
    }), 
    [batchOptions]
  );

  const results = queries.map(options => useQuery(options));
  
  const isAllLoading = results.every(result => result.isLoading);
  const isAnyError = results.some(result => result.isError);
  const isAllSuccess = results.every(result => result.isSuccess);

  return {
    queries: results,
    isAllLoading,
    isAnyError,
    isAllSuccess,
    // Batch invalidation
    invalidateAll: useCallback(() => {
      queries.forEach(options => {
        queryClient.invalidateQueries({ queryKey: options.queryKey });
      });
    }, [queryClient, queries]),
  };
};

// Performance monitoring hook
export const useQueryPerformance = (queryKey: string | readonly unknown[]) => {
  const queryClient = useQueryClient();
  
  const getPerformanceMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const query = cache.find({ queryKey });
    
    if (!query) return null;
    
    return {
      state: query.state.status,
      fetchStatus: query.state.fetchStatus,
      dataUpdatedAt: query.state.dataUpdatedAt,
      errorUpdatedAt: query.state.errorUpdatedAt,
      isFetching: query.state.isFetching,
      isPaused: query.state.isPaused,
      // Calculate cache hit rate
      isFromCache: query.state.dataUpdatedAt > 0 && !query.state.isFetching,
    };
  }, [queryClient, queryKey]);

  return { getPerformanceMetrics };
};