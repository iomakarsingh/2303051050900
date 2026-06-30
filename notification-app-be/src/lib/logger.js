import { initializeLogger, Log } from 'logging-middleware';

let initialized = false;

export function bootstrapLogger() {
  if (initialized) {
    return;
  }

  const clientID     = process.env.LOGGING_CLIENT_ID;
  const clientSecret = process.env.LOGGING_CLIENT_SECRET;
  const email        = process.env.LOGGING_EMAIL;
  const name         = process.env.LOGGING_NAME;
  const rollNo       = process.env.LOGGING_ROLL_NO;
  const accessCode   = process.env.LOGGING_ACCESS_CODE;

  if (!clientID || !clientSecret || !email || !name || !rollNo || !accessCode) {
    console.warn('[logger] Missing one or more LOGGING_* env vars — logging disabled.');
    return;
  }

  initializeLogger({
    clientID,
    clientSecret,
    email,
    name,
    rollNo,
    accessCode,
    testServerUrl: process.env.LOGGING_SERVER_URL,
  });

  initialized = true;
}

export async function logEvent(stack, level, pkg, message) {
  if (!initialized) {
    return null;
  }

  try {
    return await Log(stack, level, pkg, message);
  } catch {
    return null;
  }
}
