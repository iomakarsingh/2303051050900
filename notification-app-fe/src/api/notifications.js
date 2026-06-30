import { logEvent } from "../lib/logger";
import { normalizeNotification } from "../utils/notifications";

const DEFAULT_NOTIFICATION_URL =
	import.meta.env.VITE_NOTIFICATION_API_URL ??
	"/evaluation-service/notifications";

const USE_MOCK_FALLBACK = import.meta.env.VITE_USE_MOCK_NOTIFICATIONS !== "false";

const MOCK_NOTIFICATIONS = [
	{
		id: "mock-001",
		type: "Placement",
		message: "Infosys hiring drive opens for final-year students",
		timestamp: "2026-06-28T09:15:00Z",
		read: false,
		priorityScore: 3988,
		source: "mock-feed",
	},
	{
		id: "mock-002",
		type: "Result",
		message: "Mid-semester results published for Data Structures",
		timestamp: "2026-06-27T11:00:00Z",
		read: false,
		priorityScore: 2977,
		source: "mock-feed",
	},
	{
		id: "mock-003",
		type: "Event",
		message: "Hackathon registration closes tonight at 11:59 PM",
		timestamp: "2026-06-29T16:30:00Z",
		read: true,
		priorityScore: 1985,
		source: "mock-feed",
	},
	{
		id: "mock-004",
		type: "Placement",
		message: "TCS aptitude test schedule released for shortlisted students",
		timestamp: "2026-06-26T08:45:00Z",
		read: false,
		priorityScore: 3992,
		source: "mock-feed",
	},
	{
		id: "mock-005",
		type: "Result",
		message: "Project review scores updated in the portal",
		timestamp: "2026-06-25T13:20:00Z",
		read: true,
		priorityScore: 2961,
		source: "mock-feed",
	},
	{
		id: "mock-006",
		type: "Event",
		message: "Guest lecture on system design starts at 2 PM tomorrow",
		timestamp: "2026-06-30T07:10:00Z",
		read: false,
		priorityScore: 1994,
		source: "mock-feed",
	},
	{
		id: "mock-007",
		type: "Placement",
		message: "Final round interview list released for product roles",
		timestamp: "2026-06-24T18:00:00Z",
		read: false,
		priorityScore: 3979,
		source: "mock-feed",
	},
	{
		id: "mock-008",
		type: "Event",
		message: "Library access timings updated for exam week",
		timestamp: "2026-06-23T10:00:00Z",
		read: true,
		priorityScore: 1974,
		source: "mock-feed",
	},
	{
		id: "mock-009",
		type: "Result",
		message: "Mentor feedback available for capstone submission",
		timestamp: "2026-06-22T15:45:00Z",
		read: false,
		priorityScore: 2959,
		source: "mock-feed",
	},
	{
		id: "mock-010",
		type: "Placement",
		message: "Company pre-placement talk scheduled for tomorrow",
		timestamp: "2026-06-21T12:00:00Z",
		read: true,
		priorityScore: 3962,
		source: "mock-feed",
	},
	{
		id: "mock-011",
		type: "Placement",
		message: "Amazon online assessment invite sent to eligible students",
		timestamp: "2026-06-20T14:20:00Z",
		read: false,
		priorityScore: 3980,
		source: "mock-feed",
	},
	{
		id: "mock-012",
		type: "Result",
		message: "Quiz results are now visible in the dashboard",
		timestamp: "2026-06-19T09:40:00Z",
		read: true,
		priorityScore: 2942,
		source: "mock-feed",
	},
];

function buildNotificationUrl({ page = 1, limit = 10, notificationType = "All" } = {}) {
	const url = DEFAULT_NOTIFICATION_URL.startsWith("http")
		? new URL(DEFAULT_NOTIFICATION_URL)
		: new URL(DEFAULT_NOTIFICATION_URL, window.location.origin);

	if (page) {
		url.searchParams.set("page", String(page));
	}

	if (limit) {
		url.searchParams.set("limit", String(limit));
	}

	if (notificationType && notificationType !== "All") {
		url.searchParams.set("notification_type", notificationType);
	}

	return url.toString();
}

function filterMockNotifications({ page = 1, limit = 10, notificationType = "All" } = {}) {
	const filtered = MOCK_NOTIFICATIONS.filter((notification) => {
		if (notificationType === "All") {
			return true;
		}

		return notification.type === notificationType;
	});

	const startIndex = (page - 1) * limit;
	const pagedNotifications = filtered.slice(startIndex, startIndex + limit).map(normalizeNotification);

	return {
		notifications: pagedNotifications,
		total: filtered.length,
		totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
		page,
		limit,
		source: "mock",
	};
}

export async function fetchNotifications(options = {}) {
	const { page = 1, limit = 10, notificationType = "All" } = options;
	const url = buildNotificationUrl({ page, limit, notificationType });
	const token = import.meta.env.VITE_NOTIFICATION_API_TOKEN;

	await logEvent(
		"frontend",
		"debug",
		"api",
		`Fetching notifications page=${page} limit=${limit} type=${notificationType}`
	);

	const response = await fetch(url, {
		headers: {
			"Content-Type": "application/json",
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});

	if (!response.ok) {
		const errorBody = await response.text();

		await logEvent(
			"frontend",
			"error",
			"api",
			`Notification fetch failed with status ${response.status}: ${errorBody}`
		);

		if (USE_MOCK_FALLBACK) {
			await logEvent(
				"frontend",
				"warn",
				"api",
				`Using mock notifications fallback after HTTP ${response.status}`
			);

			return filterMockNotifications({ page, limit, notificationType });
		}

		throw new Error(`Failed to fetch notifications (${response.status})`);
	}

	try {
		const payload = await response.json();
		const rawNotifications = Array.isArray(payload.notifications)
			? payload.notifications
			: Array.isArray(payload)
				? payload
				: [];

		const notifications = rawNotifications.map(normalizeNotification);
		const total = payload.total ?? notifications.length;
		const totalPages = payload.totalPages ?? Math.max(1, Math.ceil(total / limit));

		await logEvent(
			"frontend",
			"info",
			"api",
			`Loaded ${notifications.length} notifications for page ${page}`
		);

		return {
			notifications,
			total,
			totalPages,
			page: payload.page ?? page,
			limit: payload.limit ?? limit,
			source: "remote",
		};
	} catch (error) {
		await logEvent(
			"frontend",
			"error",
			"api",
			`Notification fetch threw an error: ${error instanceof Error ? error.message : String(error)}`
		);

		if (USE_MOCK_FALLBACK) {
			await logEvent(
				"frontend",
				"warn",
				"api",
				"Using mock notifications fallback after network failure"
			);

			return filterMockNotifications({ page, limit, notificationType });
		}

		throw error;
	}
}
