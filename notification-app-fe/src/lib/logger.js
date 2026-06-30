import { initializeLogger, Log } from 'logging-middleware';

const loggerConfig = {
  clientID:     import.meta.env.VITE_LOGGING_CLIENT_ID,
  clientSecret: import.meta.env.VITE_LOGGING_CLIENT_SECRET,
  email:        import.meta.env.VITE_LOGGING_EMAIL,
  name:         import.meta.env.VITE_LOGGING_NAME,
  rollNo:       import.meta.env.VITE_LOGGING_ROLL_NO,
  accessCode:   import.meta.env.VITE_LOGGING_ACCESS_CODE,
  testServerUrl: import.meta.env.VITE_LOGGING_SERVER_URL,
};

let isInitialized = false;

export function bootstrapLogger() {
  if (isInitialized) {
    return;
  }

  if (!loggerConfig.clientID || !loggerConfig.clientSecret ||
      !loggerConfig.email || !loggerConfig.rollNo || !loggerConfig.accessCode) {
    return;
  }

  initializeLogger(loggerConfig);
  isInitialized = true;
}

export async function logEvent(stack, level, pkg, message) {
  if (!isInitialized) {
    return null;
  }

  try {
    return await Log(stack, level, pkg, message);
  } catch {
    return null;
  }
}
