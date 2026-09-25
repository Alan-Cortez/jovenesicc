import { relations } from "drizzle-orm/relations";
import { groups, users, readingPlans, readingPlanDays, planAssignments, readingProgress, devotionals, devotionalReactions, tasks, taskSubmissions, xpLog, userBadges, badges, streakHistory, prayerRequests, events, eventAttendance, announcements, notifications } from "./schema";

export const usersRelations = relations(users, ({one, many}) => ({
	group: one(groups, {
		fields: [users.groupId],
		references: [groups.id]
	}),
	readingPlans: many(readingPlans),
	planAssignments: many(planAssignments),
	readingProgresses: many(readingProgress),
	devotionals: many(devotionals),
	devotionalReactions: many(devotionalReactions),
	tasks_createdBy: many(tasks, {
		relationName: "tasks_createdBy_users_id"
	}),
	tasks_userId: many(tasks, {
		relationName: "tasks_userId_users_id"
	}),
	taskSubmissions_reviewedBy: many(taskSubmissions, {
		relationName: "taskSubmissions_reviewedBy_users_id"
	}),
	taskSubmissions_userId: many(taskSubmissions, {
		relationName: "taskSubmissions_userId_users_id"
	}),
	xpLogs_grantedBy: many(xpLog, {
		relationName: "xpLog_grantedBy_users_id"
	}),
	xpLogs_userId: many(xpLog, {
		relationName: "xpLog_userId_users_id"
	}),
	userBadges_grantedBy: many(userBadges, {
		relationName: "userBadges_grantedBy_users_id"
	}),
	userBadges_userId: many(userBadges, {
		relationName: "userBadges_userId_users_id"
	}),
	streakHistories: many(streakHistory),
	prayerRequests: many(prayerRequests),
	events: many(events),
	eventAttendances: many(eventAttendance),
	announcements: many(announcements),
	notifications: many(notifications),
}));

export const groupsRelations = relations(groups, ({many}) => ({
	users: many(users),
	planAssignments: many(planAssignments),
	tasks: many(tasks),
}));

export const readingPlansRelations = relations(readingPlans, ({one, many}) => ({
	user: one(users, {
		fields: [readingPlans.createdBy],
		references: [users.id]
	}),
	readingPlanDays: many(readingPlanDays),
	planAssignments: many(planAssignments),
	readingProgresses: many(readingProgress),
}));

export const readingPlanDaysRelations = relations(readingPlanDays, ({one, many}) => ({
	readingPlan: one(readingPlans, {
		fields: [readingPlanDays.planId],
		references: [readingPlans.id]
	}),
	readingProgresses: many(readingProgress),
	devotionals: many(devotionals),
}));

export const planAssignmentsRelations = relations(planAssignments, ({one}) => ({
	user: one(users, {
		fields: [planAssignments.userId],
		references: [users.id]
	}),
	group: one(groups, {
		fields: [planAssignments.groupId],
		references: [groups.id]
	}),
	readingPlan: one(readingPlans, {
		fields: [planAssignments.planId],
		references: [readingPlans.id]
	}),
}));

export const readingProgressRelations = relations(readingProgress, ({one}) => ({
	readingPlanDay: one(readingPlanDays, {
		fields: [readingProgress.planDayId],
		references: [readingPlanDays.id]
	}),
	readingPlan: one(readingPlans, {
		fields: [readingProgress.planId],
		references: [readingPlans.id]
	}),
	user: one(users, {
		fields: [readingProgress.userId],
		references: [users.id]
	}),
}));

export const devotionalsRelations = relations(devotionals, ({one, many}) => ({
	readingPlanDay: one(readingPlanDays, {
		fields: [devotionals.planDayId],
		references: [readingPlanDays.id]
	}),
	user: one(users, {
		fields: [devotionals.userId],
		references: [users.id]
	}),
	devotionalReactions: many(devotionalReactions),
}));

export const devotionalReactionsRelations = relations(devotionalReactions, ({one}) => ({
	user: one(users, {
		fields: [devotionalReactions.userId],
		references: [users.id]
	}),
	devotional: one(devotionals, {
		fields: [devotionalReactions.devotionalId],
		references: [devotionals.id]
	}),
}));

export const tasksRelations = relations(tasks, ({one, many}) => ({
	user_createdBy: one(users, {
		fields: [tasks.createdBy],
		references: [users.id],
		relationName: "tasks_createdBy_users_id"
	}),
	user_userId: one(users, {
		fields: [tasks.userId],
		references: [users.id],
		relationName: "tasks_userId_users_id"
	}),
	group: one(groups, {
		fields: [tasks.groupId],
		references: [groups.id]
	}),
	taskSubmissions: many(taskSubmissions),
}));

export const taskSubmissionsRelations = relations(taskSubmissions, ({one}) => ({
	user_reviewedBy: one(users, {
		fields: [taskSubmissions.reviewedBy],
		references: [users.id],
		relationName: "taskSubmissions_reviewedBy_users_id"
	}),
	user_userId: one(users, {
		fields: [taskSubmissions.userId],
		references: [users.id],
		relationName: "taskSubmissions_userId_users_id"
	}),
	task: one(tasks, {
		fields: [taskSubmissions.taskId],
		references: [tasks.id]
	}),
}));

export const xpLogRelations = relations(xpLog, ({one}) => ({
	user_grantedBy: one(users, {
		fields: [xpLog.grantedBy],
		references: [users.id],
		relationName: "xpLog_grantedBy_users_id"
	}),
	user_userId: one(users, {
		fields: [xpLog.userId],
		references: [users.id],
		relationName: "xpLog_userId_users_id"
	}),
}));

export const userBadgesRelations = relations(userBadges, ({one}) => ({
	user_grantedBy: one(users, {
		fields: [userBadges.grantedBy],
		references: [users.id],
		relationName: "userBadges_grantedBy_users_id"
	}),
	badge: one(badges, {
		fields: [userBadges.badgeId],
		references: [badges.id]
	}),
	user_userId: one(users, {
		fields: [userBadges.userId],
		references: [users.id],
		relationName: "userBadges_userId_users_id"
	}),
}));

export const badgesRelations = relations(badges, ({many}) => ({
	userBadges: many(userBadges),
}));

export const streakHistoryRelations = relations(streakHistory, ({one}) => ({
	user: one(users, {
		fields: [streakHistory.userId],
		references: [users.id]
	}),
}));

export const prayerRequestsRelations = relations(prayerRequests, ({one}) => ({
	user: one(users, {
		fields: [prayerRequests.userId],
		references: [users.id]
	}),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	user: one(users, {
		fields: [events.createdBy],
		references: [users.id]
	}),
	eventAttendances: many(eventAttendance),
}));

export const eventAttendanceRelations = relations(eventAttendance, ({one}) => ({
	user: one(users, {
		fields: [eventAttendance.userId],
		references: [users.id]
	}),
	event: one(events, {
		fields: [eventAttendance.eventId],
		references: [events.id]
	}),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	user: one(users, {
		fields: [announcements.authorId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));