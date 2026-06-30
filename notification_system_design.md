# Stage 1

## Notification Platform API Design

The notification platform needs a small, predictable REST contract that supports listing notifications, filtering by type, and paging through a user-specific feed. The design below assumes the UI consumes a protected API that returns only the authenticated user's notifications.

### Core Resources

- `notifications`: the primary feed of Event, Result, and Placement items
- `notification-types`: a logical category field used for filtering and ranking
- `priority-notifications`: a derived subset for the top 10 view in Stage 6

### Proposed REST Endpoints

#### `GET /notifications`
Returns paginated notifications for the current user.

Query parameters:
- `limit`: number of records per page
- `page`: page number starting from 1
- `notification_type`: optional filter using `Event`, `Result`, or `Placement`

Request headers:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

Example response:
```json
{
  "notifications": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Result",
      "message": "mid-sem",
      "timestamp": "2026-04-22 17:51:30",
      "read": false,
      "priorityScore": 72
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 245,
  "totalPages": 25
}
```

#### `GET /notifications/:id`
Returns a single notification item.

#### `PATCH /notifications/:id/read`
Marks a notification as read.

#### `POST /notifications/read-all`
Marks the current page or filtered set as read.

#### `GET /notifications/priority`
Returns the current top 10 priority notifications for the user.

### JSON Contract Guidelines

Each notification should contain the minimum fields needed for rendering and prioritization:
- `id`
- `type`
- `message`
- `timestamp`
- `read`
- `priorityScore`
- `source`
- `metadata` for optional context such as placement company or result category

### Response Semantics

- `200 OK`: successful fetch
- `204 No Content`: no notifications available
- `400 Bad Request`: invalid pagination or invalid filter value
- `401 Unauthorized`: protected route access without valid credentials
- `500 Internal Server Error`: unexpected server failure

### Real-Time Notifications

For real-time delivery, the platform should support one of the following:
- Server-Sent Events for lightweight one-way updates
- WebSockets for bidirectional updates
- Periodic polling as a fallback when the push channel is unavailable

The recommended order is: WebSocket or SSE first, polling as a fallback.

## Design Principles

- Keep endpoints user-scoped and predictable.
- Support filtering and paging in the API, not in the client.
- Keep the response shape stable so the frontend can render without translation layers.
- Include a scoring field so Stage 6 can sort priority notifications efficiently.

# Stage 2

## Storage Choice

Use **PostgreSQL** as the primary datastore.

### Why PostgreSQL
- Strong relational integrity for users, notifications, and read-state mapping
- Good indexing support for large notification tables
- Flexible query capabilities for pagination, filtering, and analytics
- Reliable support for transactions, which matters when updating delivery status and read status together

## Suggested Schema

### `users`
- `id` UUID primary key
- `roll_no` unique
- `email` unique
- `name`
- `created_at`

### `notifications`
- `id` UUID primary key
- `user_id` foreign key
- `type` enum(`Event`, `Result`, `Placement`)
- `message` text
- `timestamp` timestamp
- `priority_score` integer
- `source` text
- `metadata` JSONB
- `created_at`

### `notification_reads`
- `id` UUID primary key
- `notification_id` foreign key
- `user_id` foreign key
- `read_at` timestamp
- unique(`notification_id`, `user_id`)

### `notification_delivery_jobs`
- `id` UUID primary key
- `notification_id` foreign key
- `channel` enum(`email`, `in_app`)
- `status` enum(`pending`, `sent`, `failed`)
- `retry_count`
- `last_error`
- `created_at`

## Scaling Concerns

As the volume grows, the main issues are:
- large scans on unread notifications
- slow pagination on unindexed timestamp columns
- write contention when many notifications are inserted at once
- read-after-write lag if delivery and persistence are coupled too tightly

## Mitigations

- index `(user_id, timestamp DESC)` for feed access
- index `(user_id, read_at)` or derive unread from a read-mapping table
- partition the notifications table by time if the dataset grows sharply
- keep payload metadata in JSONB rather than adding many sparse columns
- use asynchronous job processing for fan-out delivery

## Example SQL Queries

### Fetch user notifications
```sql
SELECT n.id, n.type, n.message, n.timestamp, n.priority_score, n.metadata
FROM notifications n
WHERE n.user_id = $1
ORDER BY n.timestamp DESC
LIMIT $2 OFFSET $3;
```

### Fetch unread notifications
```sql
SELECT n.id, n.type, n.message, n.timestamp
FROM notifications n
LEFT JOIN notification_reads r
  ON r.notification_id = n.id
 AND r.user_id = n.user_id
WHERE n.user_id = $1
  AND r.notification_id IS NULL
ORDER BY n.timestamp DESC;
```

# Stage 3

## Query Analysis

Given:
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

### Is it accurate?
It is only partially accurate. It returns unread notifications for a student, but `ORDER BY createdAt ASC` gives the oldest unread notification first, which is usually not the desired feed behavior. Most notification UIs should show the newest notifications first.

### Why is it slow?
- `SELECT *` reads more data than necessary.
- Filtering on `studentID` and `isRead` without a supporting composite index can force extra scanning.
- Ordering by `createdAt` requires sorting if there is no suitable index.

### Likely computation cost
For a large table, the query can become expensive because it may need to scan many rows, then sort a large intermediate result set.

### About adding indexes on every column
That is not good advice.
- Every index speeds up some reads but slows down inserts, updates, and deletes.
- Indexes consume storage and maintenance overhead.
- The right approach is to add a few targeted composite indexes based on actual access patterns.

### Better index strategy
A strong index for the unread feed is:
```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications (studentID, isRead, createdAt DESC);
```

### Better query
```sql
SELECT id, studentID, message, createdAt
FROM notifications
WHERE studentID = 1042
  AND isRead = false
ORDER BY createdAt DESC;
```

## Placement notifications in the last 7 days

### PostgreSQL version
```sql
SELECT id, studentID, message, createdAt, notificationType
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL '7 days'
ORDER BY createdAt DESC;
```

### MySQL version
```sql
SELECT id, studentID, message, createdAt, notificationType
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL 7 DAY
ORDER BY createdAt DESC;
```

# Stage 4

## Performance Strategy for Page-Load Fetching

Fetching notifications on every page load can overwhelm the database and make the app feel slow.

### Recommended Approach
- cache recent notification pages in Redis
- use conditional requests with ETags or `If-Modified-Since`
- fetch only the first page on initial load
- lazy-load older pages when the user scrolls or paginates
- keep unread count as a lightweight aggregate endpoint

### Tradeoffs

#### Caching
Pros:
- reduces repeated DB hits
- improves response time

Cons:
- cache invalidation complexity
- stale data risk if writes are frequent

#### Conditional requests
Pros:
- avoids re-downloading unchanged payloads
- simple for clients

Cons:
- still requires server-side validation

#### Pagination and lazy loading
Pros:
- lowers payload size
- improves perceived responsiveness

Cons:
- more client-side state management

### Best Combined Strategy
Use a hybrid approach:
- cached first page for most users
- paginated fetches for older notifications
- realtime push or polling only for new items
- unread counts from a small summary endpoint

# Stage 5

## Problems in the `notify_all` Pseudocode

The pseudocode below is not reliable:
```text
function notify_all(student_ids: array, message: string):
  for student_id in student_ids:
    send_email(student_id, message)
    save_to_db(student_id, message)
    push_to_app(student_id, message)
```

### Shortcomings
- It performs all work synchronously in a single loop.
- A failure halfway through leaves the system in a partial state.
- Email, DB insert, and push delivery are tightly coupled.
- There is no retry, dead-letter handling, or idempotency.
- One slow recipient delays everyone else.

### Better Design
Use an outbox/job-queue pattern:
- create one durable notification record first
- enqueue delivery jobs for email and in-app channels
- process each channel independently
- retry failures with backoff
- mark each channel's status separately

### Revised Pseudocode
```text
function notify_all(student_ids, message):
  notification_id = save_notification(message)
  for student_id in student_ids:
    enqueue_job({ notification_id, student_id, channel: 'email' })
    enqueue_job({ notification_id, student_id, channel: 'in_app' })
```

Worker processing:
```text
function process_job(job):
  if job.channel == 'email':
    send_email(job.student_id, job.notification_id)
  if job.channel == 'in_app':
    push_to_app(job.student_id, job.notification_id)
  mark_job_success(job)
```

### Should saving to DB and sending email happen together?
No. They should be decoupled.
- Save the notification first so the system has a durable source of truth.
- Send email asynchronously so a transient mail failure does not roll back the entire notification.
- Use job tracking so failures can be retried safely.

### Reliability Improvements
- idempotency keys for repeated job execution
- retry with exponential backoff
- dead-letter queue for repeated failures
- per-channel status tracking
- transactional outbox for write safety
