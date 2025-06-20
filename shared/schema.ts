import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").notNull().default("contributor"), // contributor or approver
  designation: varchar("designation"),
  department: varchar("department"),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activity categories table
export const activityCategories = pgTable("activity_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  points: integer("points").notNull(),
  monetaryValue: integer("monetary_value"), // in rupees
  description: text("description"),
});

// Activity submissions table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  categoryId: integer("category_id").notNull().references(() => activityCategories.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  activityDate: timestamp("activity_date").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  attachmentUrl: text("attachment_url"),
  filePath: text("file_path"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Encashment requests table
export const encashmentRequests = pgTable("encashment_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  pointsRequested: integer("points_requested").notNull(),
  monetaryValue: integer("monetary_value").notNull(),
  status: varchar("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  paymentDetails: text("payment_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profileChangeRequests = pgTable("profile_change_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  requestedFirstName: varchar("requested_first_name").notNull(),
  requestedLastName: varchar("requested_last_name").notNull(),
  requestedDesignation: varchar("requested_designation").notNull(),
  currentFirstName: varchar("current_first_name"),
  currentLastName: varchar("current_last_name"),
  currentDesignation: varchar("current_designation"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  activities: many(activities),
  approvedActivities: many(activities, { relationName: "approver" }),
  encashmentRequests: many(encashmentRequests),
  approvedEncashmentRequests: many(encashmentRequests, { relationName: "encashmentApprover" }),
  profileChangeRequests: many(profileChangeRequests),
  approvedProfileChangeRequests: many(profileChangeRequests, { relationName: "profileChangeApprover" }),
  approvedUsers: many(users, { relationName: "userApprover" }),
  approver: one(users, {
    fields: [users.approvedBy],
    references: [users.id],
    relationName: "userApprover",
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  category: one(activityCategories, {
    fields: [activities.categoryId],
    references: [activityCategories.id],
  }),
  approver: one(users, {
    fields: [activities.approvedBy],
    references: [users.id],
    relationName: "approver",
  }),
}));

export const activityCategoriesRelations = relations(activityCategories, ({ many }) => ({
  activities: many(activities),
}));

export const encashmentRequestsRelations = relations(encashmentRequests, ({ one }) => ({
  user: one(users, {
    fields: [encashmentRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [encashmentRequests.approvedBy],
    references: [users.id],
    relationName: "encashmentApprover",
  }),
}));

export const profileChangeRequestsRelations = relations(profileChangeRequests, ({ one }) => ({
  user: one(users, {
    fields: [profileChangeRequests.userId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [profileChangeRequests.approvedBy],
    references: [users.id],
    relationName: "profileChangeApprover",
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  activityDate: z.coerce.date(),
});

export const insertActivityCategorySchema = createInsertSchema(activityCategories).omit({
  id: true,
});

export const approveActivitySchema = z.object({
  id: z.number(),
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

export const insertEncashmentRequestSchema = createInsertSchema(encashmentRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const approveEncashmentRequestSchema = z.object({
  id: z.number(),
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
  paymentDetails: z.string().optional(),
});

export const insertProfileChangeRequestSchema = createInsertSchema(profileChangeRequests).omit({
  id: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
});

export const approveProfileChangeRequestSchema = z.object({
  id: z.number(),
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().optional(),
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ActivityCategory = typeof activityCategories.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type InsertActivityCategory = z.infer<typeof insertActivityCategorySchema>;
export type ApproveActivity = z.infer<typeof approveActivitySchema>;
export type EncashmentRequest = typeof encashmentRequests.$inferSelect;
export type InsertEncashmentRequest = z.infer<typeof insertEncashmentRequestSchema>;
export type ApproveEncashmentRequest = z.infer<typeof approveEncashmentRequestSchema>;
export type ProfileChangeRequest = typeof profileChangeRequests.$inferSelect;
export type InsertProfileChangeRequest = z.infer<typeof insertProfileChangeRequestSchema>;
export type ApproveProfileChangeRequest = z.infer<typeof approveProfileChangeRequestSchema>;

// Activity with relations
export type ActivityWithDetails = Activity & {
  user: User;
  category: ActivityCategory;
  approver?: User;
};

// Encashment request with relations
export type EncashmentRequestWithDetails = EncashmentRequest & {
  user: User;
  approver?: User;
};

export type ProfileChangeRequestWithDetails = ProfileChangeRequest & {
  user: User;
  approver?: User;
};

// User stats type
export type UserStats = {
  totalPoints: number;
  totalEarnings: number;
  totalPointsEarned: number;
  totalEarningsEarned: number;
  redeemedPoints: number;
  redeemedValue: number;
  monthlyPoints: number;
  monthlyEarnings: number;
  pendingPoints: number;
  pendingEarnings: number;
  pendingActivities: number;
  ranking: number;
  totalMembers: number;
};
