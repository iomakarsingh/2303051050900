/**
 * React hook for using the logger in functional components
 * Provides an easy way to log events from React components
 * 
 * NOTE: React is an optional peer dependency for this middleware.
 * Only import this module if React is available in your project.
 */

import { useEffect, useRef } from 'react';
import type { Package, LogResponse } from './types';
import { getLogger } from './index';

/**
 * Hook to use the logger in React components
 * @returns An object with logging methods bound to the component
 */
export function useLogger() {
  const loggerRef = useRef(getLogger());

  const log = async (
    level: 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    pkg: Package,
    message: string
  ): Promise<LogResponse> => {
    return loggerRef.current.log('frontend', level, pkg, message);
  };

  return {
    debug: (pkg: Package, message: string) => log('debug', pkg, message),
    info: (pkg: Package, message: string) => log('info', pkg, message),
    warn: (pkg: Package, message: string) => log('warn', pkg, message),
    error: (pkg: Package, message: string) => log('error', pkg, message),
    fatal: (pkg: Package, message: string) => log('fatal', pkg, message),
  };
}

/**
 * Hook to log component lifecycle events
 * @param componentName - Name of the component for logging context
 */
export function useLogComponentLifecycle(componentName: string) {
  const logger = useRef(getLogger());

  useEffect(() => {
    // Log component mount
    logger.current.log(
      'frontend',
      'debug',
      'component',
      `${componentName} component mounted`
    ).catch((err: Error) => console.error('Failed to log mount:', err));

    return () => {
      // Log component unmount
      logger.current.log(
        'frontend',
        'debug',
        'component',
        `${componentName} component unmounted`
      ).catch((err: Error) => console.error('Failed to log unmount:', err));
    };
  }, []);
}
