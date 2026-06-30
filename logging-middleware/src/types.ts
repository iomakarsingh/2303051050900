/**
 * Type definitions for the logging middleware
 */

export type Stack = 'backend' | 'frontend';

export type Level = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export type BackendPackage = 
  | 'auth' 
  | 'config' 
  | 'middleware' 
  | 'utils' 
  | 'cache' 
  | 'controller' 
  | 'cron_job' 
  | 'db' 
  | 'domain' 
  | 'handler' 
  | 'repository' 
  | 'route' 
  | 'service';

export type FrontendPackage = 
  | 'auth' 
  | 'config' 
  | 'middleware' 
  | 'utils' 
  | 'api' 
  | 'component' 
  | 'hook' 
  | 'page' 
  | 'state';

export type Package = BackendPackage | FrontendPackage;

export interface LogRequest {
  stack: Stack;
  level: Level;
  package: Package;
  message: string;
}

export interface LogResponse {
  logID: string;
  message: string;
}

export interface LoggerConfig {
  clientID: string;
  clientSecret: string;
  email: string;
  name: string;
  rollNo: string;
  accessCode: string;
  testServerUrl?: string;
  authServerUrl?: string;
}

export interface AuthResponse {
  token_type: string;
  access_token: string;
  expires_in: number;
}
