import type { LogRequest, LogResponse, LoggerConfig, AuthResponse, Stack, Level, Package } from './types';

const DEFAULT_TEST_SERVER_URL = 'http://4.224.186.213/evaluation-service/logs';
const DEFAULT_AUTH_SERVER_URL = 'http://4.224.186.213/evaluation-service/auth';

/**
 * Logger class for sending logs to the test server
 * Handles authentication and API communication
 */
class Logger {
  private clientID: string;
  private clientSecret: string;
  private email: string;
  private name: string;
  private rollNo: string;
  private accessCode: string;
  private testServerUrl: string;
  private authServerUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: LoggerConfig) {
    this.clientID = config.clientID;
    this.clientSecret = config.clientSecret;
    this.email = config.email;
    this.name = config.name;
    this.rollNo = config.rollNo;
    this.accessCode = config.accessCode;
    this.testServerUrl = config.testServerUrl || DEFAULT_TEST_SERVER_URL;
    this.authServerUrl = config.authServerUrl || DEFAULT_AUTH_SERVER_URL;
  }

  /**
   * Validate that stack, level, and package parameters are in lowercase
   */
  private validateParameters(stack: string, level: string, pkg: string): void {
    if (stack !== stack.toLowerCase()) {
      throw new Error(`Stack parameter must be lowercase. Received: ${stack}`);
    }
    if (level !== level.toLowerCase()) {
      throw new Error(`Level parameter must be lowercase. Received: ${level}`);
    }
    if (pkg !== pkg.toLowerCase()) {
      throw new Error(`Package parameter must be lowercase. Received: ${pkg}`);
    }
  }

  /**
   * Get a cached access token, refreshing it if expired.
   * Calls POST /evaluation-service/auth with all required credentials.
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid (with 30s buffer)
    const now = Math.floor(Date.now() / 1000);
    if (this.accessToken && this.tokenExpiry > now + 30) {
      return this.accessToken;
    }

    try {
      const response = await fetch(this.authServerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:        this.email,
          name:         this.name,
          rollNo:       this.rollNo,
          accessCode:   this.accessCode,
          clientID:     this.clientID,
          clientSecret: this.clientSecret,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Auth failed [${response.status}]: ${errorText}`);
      }

      const data: AuthResponse = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = data.expires_in; // Unix timestamp
      return this.accessToken;
    } catch (error) {
      console.error('Failed to obtain access token:', error);
      throw new Error('Authentication failed');
    }
  }

  /**
   * Send a log entry to the test server
   * @param stack - 'backend' or 'frontend'
   * @param level - Log level: 'debug', 'info', 'warn', 'error', 'fatal'
   * @param pkg - Package/module name (must be lowercase)
   * @param message - Descriptive log message
   * @returns LogResponse with logID and message
   */
  async log(
    stack: Stack,
    level: Level,
    pkg: Package,
    message: string
  ): Promise<LogResponse> {
    // Validate parameters are lowercase
    this.validateParameters(stack, level, pkg);

    if (!message || message.trim().length === 0) {
      throw new Error('Log message cannot be empty');
    }

    const logPayload: LogRequest = {
      stack,
      level,
      package: pkg,
      message,
    };

    try {
      // Get fresh token for this request
      const token = await this.getAccessToken();

      // Make API call to test server
      const response = await fetch(this.testServerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'X-Client-ID': this.clientID,
        },
        body: JSON.stringify(logPayload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`Log API error [${response.status}]:`, errorData);
        throw new Error(`Failed to send log: ${response.statusText}`);
      }

      const result: LogResponse = await response.json();
      return result;
    } catch (error) {
      // Log errors to console as fallback
      console.error(`[${stack}:${level}:${pkg}] ${message}`, error);
      
      // Still throw the error so caller knows it failed
      throw error;
    }
  }

  /**
   * Helper methods for different log levels
   */
  async debug(pkg: Package, message: string, stack: Stack = 'frontend'): Promise<LogResponse> {
    return this.log(stack, 'debug', pkg, message);
  }

  async info(pkg: Package, message: string, stack: Stack = 'frontend'): Promise<LogResponse> {
    return this.log(stack, 'info', pkg, message);
  }

  async warn(pkg: Package, message: string, stack: Stack = 'frontend'): Promise<LogResponse> {
    return this.log(stack, 'warn', pkg, message);
  }

  async error(pkg: Package, message: string, stack: Stack = 'frontend'): Promise<LogResponse> {
    return this.log(stack, 'error', pkg, message);
  }

  async fatal(pkg: Package, message: string, stack: Stack = 'frontend'): Promise<LogResponse> {
    return this.log(stack, 'fatal', pkg, message);
  }
}

/**
 * Singleton instance for global logging
 */
let globalLogger: Logger | null = null;

/**
 * Initialize the global logger with client credentials
 * @param config - Logger configuration with clientID and clientSecret
 */
export function initializeLogger(config: LoggerConfig): void {
  globalLogger = new Logger(config);
}

/**
 * Get the global logger instance
 * Throws error if logger hasn't been initialized
 */
export function getLogger(): Logger {
  if (!globalLogger) {
    throw new Error('Logger not initialized. Call initializeLogger() first.');
  }
  return globalLogger;
}

/**
 * Main Log function - reusable across the application
 * @param stack - 'backend' or 'frontend'
 * @param level - Log level: 'debug', 'info', 'warn', 'error', 'fatal'
 * @param pkg - Package/module name
 * @param message - Descriptive log message with context
 */
export async function Log(
  stack: Stack,
  level: Level,
  pkg: Package,
  message: string
): Promise<LogResponse> {
  const logger = getLogger();
  return logger.log(stack, level, pkg, message);
}

export { Logger };
export type { LogRequest, LogResponse, LoggerConfig };
