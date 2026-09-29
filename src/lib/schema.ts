import { sqliteTable, AnySQLiteColumn, check, integer, text, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const groups = sqliteTable("groups", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	description: text(),
	leaderId: integer("leader_id").notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const users = sqliteTable("users", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	email: text(),
	matricula: text(),
	bio: text(),
	passwordHash: text("password_hash").notNull(),
	role: text().default("joven").notNull(),
	avatar: text(),
	groupId: integer("group_id").references(() => groups.id),
	xp: integer().default(0).notNull(),
	level: integer().default(1).notNull(),
	streakCurrent: integer("streak_current").default(0).notNull(),
	streakBest: integer("streak_best").default(0).notNull(),
	lastReadDate: text("last_read_date"),
	shareDevotionals: integer("share_devotionals").default(0).notNull(),
	isActive: integer("is_active").default(1).notNull(),
	joinedAt: text("joined_at").default("sql`(datetime('now'))`").notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
	phone: text("phone"),
	birthDate: text("birth_date"),
	updatedAt: text("updated_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const readingPlans = sqliteTable("reading_plans", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	description: text(),
	imageUrl: text("image_url"),
	totalDays: integer("total_days").default(0).notNull(),
	createdBy: integer("created_by").notNull().references(() => users.id),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const readingPlanDays = sqliteTable("reading_plan_days", {
	id: integer().primaryKey({ autoIncrement: true }),
	planId: integer("plan_id").notNull().references(() => readingPlans.id),
	dayNumber: integer("day_number").notNull(),
	title: text(),
	content: text(),
	bibleRefs: text("bible_refs").notNull(),
	xpReward: integer("xp_reward").default(10).notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const planAssignments = sqliteTable("plan_assignments", {
	id: integer().primaryKey({ autoIncrement: true }),
	planId: integer("plan_id").notNull().references(() => readingPlans.id),
	assignedTo: text("assigned_to").notNull(),
	groupId: integer("group_id").references(() => groups.id),
	userId: integer("user_id").references(() => users.id),
	startDate: text("start_date").notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const readingProgress = sqliteTable("reading_progress", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	planId: integer("plan_id").notNull().references(() => readingPlans.id),
	planDayId: integer("plan_day_id").notNull().references(() => readingPlanDays.id),
	status: text().default("locked").notNull(),
	completedAt: text("completed_at"),
	isCatchUp: integer("is_catch_up").default(0).notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const devotionals = sqliteTable("devotionals", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	planDayId: integer("plan_day_id").notNull().references(() => readingPlanDays.id),
	whatIRead: text("what_i_read").notNull(),
	whatIUnderstood: text("what_i_understood").notNull(),
	whatGodToldMe: text("what_god_told_me").notNull(),
	whatIPractice: text("what_i_practice").notNull(),
	status: text().default("draft").notNull(),
	isPublic: integer("is_public").default(0).notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
	updatedAt: text("updated_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const devotionalReactions = sqliteTable("devotional_reactions", {
	id: integer().primaryKey({ autoIncrement: true }),
	devotionalId: integer("devotional_id").notNull().references(() => devotionals.id),
	userId: integer("user_id").notNull().references(() => users.id),
	type: text().notNull(),
	comment: text(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const tasks = sqliteTable("tasks", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	description: text(),
	assignedTo: text("assigned_to").notNull(),
	groupId: integer("group_id").references(() => groups.id),
	userId: integer("user_id").references(() => users.id),
	evidenceType: text("evidence_type").default("none").notNull(),
	xpReward: integer("xp_reward").default(20).notNull(),
	deadline: text(),
	createdBy: integer("created_by").notNull().references(() => users.id),
	isActive: integer("is_active").default(1).notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const taskSubmissions = sqliteTable("task_submissions", {
	id: integer().primaryKey({ autoIncrement: true }),
	taskId: integer("task_id").notNull().references(() => tasks.id),
	userId: integer("user_id").notNull().references(() => users.id),
	evidence: text(),
	status: text().default("pending").notNull(),
	reviewNote: text("review_note"),
	reviewedBy: integer("reviewed_by").references(() => users.id),
	reviewedAt: text("reviewed_at"),
	submittedAt: text("submitted_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const xpLog = sqliteTable("xp_log", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	amount: integer().notNull(),
	reason: text().notNull(),
	sourceType: text("source_type").notNull(),
	sourceId: integer("source_id"),
	grantedBy: integer("granted_by").references(() => users.id),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const badges = sqliteTable("badges", {
	id: integer().primaryKey({ autoIncrement: true }),
	name: text().notNull(),
	description: text(),
	icon: text().notNull(),
	color: text().default("#C8F135").notNull(),
	triggerType: text("trigger_type").default("manual").notNull(),
	triggerCondition: text("trigger_condition"),
	isActive: integer("is_active").default(1).notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const userBadges = sqliteTable("user_badges", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	badgeId: integer("badge_id").notNull().references(() => badges.id),
	grantedBy: integer("granted_by").references(() => users.id),
	grantedAt: text("granted_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const streakHistory = sqliteTable("streak_history", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	date: text().notNull(),
	completed: integer().default(0).notNull(),
	isCatchUp: integer("is_catch_up").default(0).notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const prayerRequests = sqliteTable("prayer_requests", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	content: text().notNull(),
	isPublic: integer("is_public").default(0).notNull(),
	isAnonymous: integer("is_anonymous").default(0).notNull(),
	status: text().default("praying").notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
	answeredAt: text("answered_at"),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const events = sqliteTable("events", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	description: text(),
	location: text(),
	startAt: text("start_at").notNull(),
	endAt: text("end_at"),
	isRecurring: integer("is_recurring").default(0).notNull(),
	recurrenceRule: text("recurrence_rule"),
	createdBy: integer("created_by").notNull().references(() => users.id),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const eventAttendance = sqliteTable("event_attendance", {
	id: integer().primaryKey({ autoIncrement: true }),
	eventId: integer("event_id").notNull().references(() => events.id),
	userId: integer("user_id").notNull().references(() => users.id),
	status: text().default("confirmed").notNull(),
	confirmedAt: text("confirmed_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const announcements = sqliteTable("announcements", {
	id: integer().primaryKey({ autoIncrement: true }),
	title: text().notNull(),
	content: text().notNull(),
	authorId: integer("author_id").notNull().references(() => users.id),
	isPinned: integer("is_pinned").default(0).notNull(),
	publishedAt: text("published_at").default("sql`(datetime('now'))`").notNull(),
	expiresAt: text("expires_at"),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const notifications = sqliteTable("notifications", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	actorId: integer("actor_id").references(() => users.id), // Who performed the action
	type: text().notNull(),
	title: text().notNull().default(''),
	body: text(),
	content: text().notNull(), // text of the notification
	link: text(), // where to navigate when clicked
	isRead: integer("is_read").default(0).notNull(), // 0 for false, 1 for true
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
},
(table) => [
	check("users_check_1", sql`role IN ('joven','lider','admin'))`),
	check("plan_assignments_check_2", sql`assigned_to IN ('all','group','individual'))`),
	check("reading_progress_check_3", sql`status IN ('available','completed','late','locked'))`),
	check("devotionals_check_4", sql`status IN ('draft','submitted','reviewed'))`),
	check("devotional_reactions_check_5", sql`type IN ('like','fire','heart','pray'))`),
	check("tasks_check_6", sql`assigned_to IN ('all','group','individual'))`),
	check("tasks_check_7", sql`evidence_type IN ('none','text','media','file'))`),
	check("task_submissions_check_8", sql`status IN ('pending','submitted','approved','rejected'))`),
	check("xp_log_check_9", sql`source_type IN ('reading','devotional','task','badge','manual','reversal'))`),
	check("badges_check_10", sql`trigger_type IN ('auto','manual'))`),
	check("prayer_requests_check_11", sql`status IN ('praying','answered'))`),
	check("event_attendance_check_12", sql`status IN ('confirmed','attended','absent'))`),
]);

export const groupMeetings = sqliteTable("group_meetings", {
	id: integer().primaryKey({ autoIncrement: true }),
	groupId: integer("group_id").notNull().references(() => groups.id),
	date: text().notNull(), // ISO Date of the meeting
	perfectAttendanceBonus: integer("perfect_attendance_bonus").default(0).notNull(),
	perfectPunctualityBonus: integer("perfect_punctuality_bonus").default(0).notNull(),
	guestsPoints: integer("guests_points").default(0).notNull(),
	totalPoints: integer("total_points").default(0).notNull(), // Aggregate sum for this meeting
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
});

export const groupMeetingAttendance = sqliteTable("group_meeting_attendance", {
	id: integer().primaryKey({ autoIncrement: true }),
	meetingId: integer("meeting_id").notNull().references(() => groupMeetings.id),
	userId: integer("user_id").notNull().references(() => users.id),
	tematica: integer().default(0).notNull(), // 0 or 5
	puntualidad: integer().default(0).notNull(), // 0, 3, or 5
	bibliaCuaderno: integer("biblia_cuaderno").default(0).notNull(), // 0, 3, or 5
	totalPoints: integer("total_points").default(0).notNull(), // Sum of the 3 above
});

export const groupGuests = sqliteTable("group_guests", {
	id: integer().primaryKey({ autoIncrement: true }),
	groupId: integer("group_id").notNull().references(() => groups.id),
	invitedBy: integer("invited_by").references(() => users.id),
	name: text().notNull(),
	visitsCount: integer("visits_count").default(1).notNull(),
	lastVisit: text("last_visit").default("sql`(datetime('now'))`").notNull(),
});
export const posts = sqliteTable("posts", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	content: text().notNull(),
	imageUrl: text("image_url"), // Store base64 or external url
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
	updatedAt: text("updated_at").default("sql`(datetime('now'))`").notNull(),
});

export const postReactions = sqliteTable("post_reactions", {
	id: integer().primaryKey({ autoIncrement: true }),
	postId: integer("post_id").notNull().references(() => posts.id),
	userId: integer("user_id").notNull().references(() => users.id),
	type: text().default('heart').notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
});

export const postComments = sqliteTable("post_comments", {
	id: integer().primaryKey({ autoIncrement: true }),
	postId: integer("post_id").notNull().references(() => posts.id),
	userId: integer("user_id").notNull().references(() => users.id),
	content: text().notNull(),
	parentId: integer("parent_id"), // Para respuestas a comentarios
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
});

export const commentReactions = sqliteTable("comment_reactions", {
	id: integer().primaryKey({ autoIncrement: true }),
	commentId: integer("comment_id").notNull().references(() => postComments.id),
	userId: integer("user_id").notNull().references(() => users.id),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
});

export const songSuggestions = sqliteTable("song_suggestions", {
	id: integer().primaryKey({ autoIncrement: true }),
	userId: integer("user_id").notNull().references(() => users.id),
	spotifyUrl: text("spotify_url").notNull(),
	trackId: text("track_id").notNull(),
	createdAt: text("created_at").default("sql`(datetime('now'))`").notNull(),
});
