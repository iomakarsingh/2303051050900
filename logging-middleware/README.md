# Logging Middleware

A TypeScript-based logging middleware for the Campus Evaluation Full Stack application. This module captures the complete lifecycle of significant events in your application and sends them to a centralized test server for monitoring and debugging.

## Features

- **Reusable Log Function**: `Log(stack, level, package, message)` - the core logging interface
- **Type-safe**: Full TypeScript support with strict typing for all parameters
- **Level-based Logging**: Support for debug, info, warn, error, and fatal levels
- **Stack Awareness**: Distinguish logs from backend and frontend
- **React Integration**: Custom hooks for seamless integration with React components
- **Test Server Integration**: Automatically sends logs to the evaluation service

## Installation

```bash
npm install ../logging-middleware
# or
yarn add ../logging-middleware
```

## Setup

### 1. Register with Test Server

First, register with the test server to obtain your `clientID` and `clientSecret`.

**Registration Endpoint:**
```
POST http://4.224.186.213/evaluation-service/register
```

**Request Body:**
```json
{
  "email": "your.email@university.edu",
  "name": "Your Name",
  "mobileNo": "9999999999",
  "gitHubUsername": "your-github-username",
  "rollNo": "your-roll-number",
  "accessCode": "provided-access-code"
}
```

**Response:**
```json
{
  "email": "your.email@university.edu",
  "name": "Your Name",
  "rollNo": "your-roll-number",
  "accessCode": "provided-access-code",
  "clientID": "unique-client-id",
  "clientSecret": "unique-client-secret"
}
```

### 2. Initialize the Logger

In your application's entry point (e.g., `main.jsx` or `app.ts`):

```typescript
import { initializeLogger } from 'logging-middleware';

// Initialize with your credentials
initializeLogger({
  clientID: 'your-client-id',
  clientSecret: 'your-client-secret',
  // testServerUrl: 'custom-url' (optional, defaults to test server)
});
```

## Usage

### Basic Usage

```typescript
import { Log } from 'logging-middleware';

// Log an event
await Log('frontend', 'info', 'api', 'Successfully fetched user notifications');

// Log an error
await Log('backend', 'error', 'db', 'Failed to connect to database: connection timeout');

// Log a warning
await Log('frontend', 'warn', 'component', 'Deprecated prop usage in NotificationFilter component');
```

### In React Components

#### Using the `useLogger` Hook

```typescript
import { useLogger } from 'logging-middleware/react';

export function NotificationsPage() {
  const { info, error, warn } = useLogger();

  async function handleFetchNotifications() {
    try {
      await info('api', 'Fetching notifications for user');
      const notifications = await fetchNotifications();
      await info('api', `Successfully fetched ${notifications.length} notifications`);
    } catch (err) {
      await error('api', `Failed to fetch notifications: ${err.message}`);
    }
  }

  return (
    // component JSX
  );
}
```

#### Logging Component Lifecycle

```typescript
import { useLogComponentLifecycle } from 'logging-middleware/react';

export function NotificationFilter() {
  useLogComponentLifecycle('NotificationFilter');
  
  // component code
}
```

### Backend Usage

```typescript
import { Log } from 'logging-middleware';

// In route handlers
app.post('/notifications', async (req, res) => {
  try {
    await Log('backend', 'info', 'route', 'POST /notifications request received');
    
    const result = await notificationService.create(req.body);
    
    await Log('backend', 'info', 'service', 'Notification created successfully');
    res.json(result);
  } catch (error) {
    await Log('backend', 'error', 'handler', `Error creating notification: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// In services
async function fetchUserData(userId) {
  try {
    await Log('backend', 'debug', 'service', `Fetching user data for ID: ${userId}`);
    const user = await db.users.findById(userId);
    
    if (!user) {
      await Log('backend', 'warn', 'service', `User not found for ID: ${userId}`);
    }
    
    return user;
  } catch (error) {
    await Log('backend', 'error', 'db', `Database error fetching user: ${error.message}`);
    throw error;
  }
}
```

## Log Levels

- **debug**: Detailed information for diagnosing problems
- **info**: Informational messages about normal operations
- **warn**: Warning messages indicating potential issues
- **error**: Error messages for recoverable issues
- **fatal**: Critical errors requiring immediate attention

## Valid Packages

### Used in Both Frontend and Backend
- `auth` - Authentication and authorization
- `config` - Configuration management
- `middleware` - Middleware and interceptors
- `utils` - Utility functions

### Backend Only
- `cache` - Caching layer
- `controller` - Route controllers
- `cron_job` - Scheduled jobs
- `db` - Database operations
- `domain` - Domain logic
- `handler` - Error and request handlers
- `repository` - Data access layer
- `route` - Route definitions
- `service` - Business logic services

### Frontend Only
- `api` - API client and communication
- `component` - React components
- `hook` - Custom React hooks
- `page` - Page components
- `state` - State management

## API Response

Every log call returns:

```json
{
  "logID": "unique-log-identifier",
  "message": "log created successfully"
}
```

## Best Practices

1. **Be Descriptive**: Include specific context about what's happening
   ```typescript
   // Good
   await Log('frontend', 'info', 'api', `Fetched ${notifications.length} notifications for user ${userId}`);
   
   // Avoid
   await Log('frontend', 'info', 'api', 'Fetch completed');
   ```

2. **Include Error Details**: Capture meaningful error information
   ```typescript
   await Log('backend', 'error', 'db', `Connection failed: ${error.code} - ${error.message}`);
   ```

3. **Log State Changes**: Track important application state transitions
   ```typescript
   await Log('frontend', 'info', 'state', `User authentication state changed: ${previousState} → ${newState}`);
   ```

4. **Strategic Placement**: Log at key decision points, error boundaries, and critical paths
   ```typescript
   // Before expensive operations
   await Log('backend', 'debug', 'service', `Starting bulk user import: ${userCount} users`);
   
   // After successful operations
   await Log('backend', 'info', 'service', `Bulk import completed: ${successCount} imported, ${failureCount} failed`);
   ```

## Error Handling

Logs are sent asynchronously. If logging fails:
- An error is logged to the browser/server console
- The application continues operating normally
- The original operation is not affected

```typescript
try {
  await Log('frontend', 'info', 'api', 'User action completed');
} catch (loggingError) {
  // Logging failed, but the application should continue
  console.error('Logging failed:', loggingError);
}
```

## Building

```bash
npm run build
# or
npm run dev  # for watch mode
```

Output goes to `dist/` directory with TypeScript declarations included.
