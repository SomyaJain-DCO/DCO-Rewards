import {
  users,
  activities,
  activityCategories,
  encashmentRequests,
  profileChangeRequests,
  type User,
  type UpsertUser,
  type Activity,
  type ActivityCategory,
  type EncashmentRequest,
  type InsertActivity,
  type InsertActivityCategory,
  type ApproveActivity,
  type InsertEncashmentRequest,
  type ApproveEncashmentRequest,
  type ProfileChangeRequest,
  type InsertProfileChangeRequest,
  type ApproveProfileChangeRequest,
  type ActivityWithDetails,
  type EncashmentRequestWithDetails,
  type ProfileChangeRequestWithDetails,
  type UserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, gte } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserDesignation(id: string, designation: string): Promise<User>;
  updateUserDesignationAndRole(id: string, designation: string, role: string): Promise<User>;
  
  // Activity category operations
  getActivityCategories(): Promise<ActivityCategory[]>;
  seedActivityCategories(): Promise<void>;
  
  // Activity operations
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByUser(userId: string): Promise<ActivityWithDetails[]>;
  getActivityById(id: number): Promise<Activity | undefined>;
  updateActivity(id: number, activity: InsertActivity): Promise<Activity>;
  getPendingActivities(): Promise<ActivityWithDetails[]>;
  approveActivity(approval: ApproveActivity, approverId: string): Promise<Activity>;
  
  // Dashboard operations
  getUserStats(userId: string): Promise<UserStats>;
  getLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>>;
  getMonthlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>>;
  getYearlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>>;
  getRecentActivities(limit?: number): Promise<ActivityWithDetails[]>;
  getAllActivities(): Promise<ActivityWithDetails[]>;
  
  // Team operations
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getActivitiesByUserId(userId: string): Promise<ActivityWithDetails[]>;
  getUserStatsById(userId: string): Promise<UserStats>;
  
  // Encashment operations
  createEncashmentRequest(request: InsertEncashmentRequest): Promise<EncashmentRequest>;
  getEncashmentRequestsByUser(userId: string): Promise<EncashmentRequestWithDetails[]>;
  getPendingEncashmentRequests(): Promise<EncashmentRequestWithDetails[]>;
  approveEncashmentRequest(approval: ApproveEncashmentRequest, approverId: string): Promise<EncashmentRequest>;
  
  // Profile change request operations
  createProfileChangeRequest(request: InsertProfileChangeRequest): Promise<ProfileChangeRequest>;
  getProfileChangeRequestsByUser(userId: string): Promise<ProfileChangeRequestWithDetails[]>;
  getPendingProfileChangeRequests(): Promise<ProfileChangeRequestWithDetails[]>;
  approveProfileChangeRequest(approval: ApproveProfileChangeRequest, approverId: string): Promise<ProfileChangeRequest>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserDesignation(id: string, designation: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        designation,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  async updateUserDesignationAndRole(id: string, designation: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        designation,
        role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning();
    
    if (!user) {
      throw new Error("User not found");
    }
    
    return user;
  }

  // Activity category operations
  async getActivityCategories(): Promise<ActivityCategory[]> {
    return await db.select().from(activityCategories).orderBy(activityCategories.id);
  }

  async seedActivityCategories(): Promise<void> {
    const categories = [
      { name: "Article published on third-party websites", points: 10, monetaryValue: 1000, description: "Articles published on external websites" },
      { name: "Articles published on LinkedIn", points: 8, monetaryValue: 800, description: "Professional articles shared on LinkedIn" },
      { name: "Article for Newsletter", points: 7, monetaryValue: 700, description: "Articles written for company newsletter" },
      { name: "Article in Journals (ICAI, BCAS, CTC etc)", points: 15, monetaryValue: 1500, description: "Articles published in professional journals" },
      { name: "Writing a Book", points: 100, monetaryValue: 10000, description: "Authoring a complete book" },
      { name: "Contribution other than Article in Newsletter (DCoD)", points: 3, monetaryValue: 300, description: "Other newsletter contributions" },
      { name: "Technical Contribution other than Article on LinkedIn", points: 1, monetaryValue: 100, description: "Technical posts and contributions on LinkedIn" },
      { name: "Taking Session in Office", points: 6, monetaryValue: 600, description: "Conducting internal training sessions" },
      { name: "Taking Session at ICAI/ICSI/ICWAI/other bodies (Virtual/Physical)", points: 10, monetaryValue: 1000, description: "Sessions at professional bodies" },
      { name: "Taking Session of clients - Virtual", points: 8, monetaryValue: 800, description: "Virtual client training sessions" },
      { name: "Monitoring/Mentoring Internal Training Sessions", points: 2, monetaryValue: 200, description: "Supervising internal training programs" },
      { name: "Attending RRC - Subject to sharing of summary & internal notes", points: 15, monetaryValue: 1500, description: "Regional Review Committee attendance with notes" },
      { name: "Attending Study Circle Meetings - Subject to sharing of summary & internal notes", points: 5, monetaryValue: 500, description: "Study circle participation with notes" },
      { name: "Attending Other Conferences - Subject to sharing of summary & internal notes", points: 5, monetaryValue: 500, description: "Conference attendance with notes" },
    ];

    // Check if categories already exist
    const existingCategories = await this.getActivityCategories();
    if (existingCategories.length === 0) {
      await db.insert(activityCategories).values(categories);
    }
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const [newActivity] = await db.insert(activities).values(activity).returning();
    return newActivity;
  }

  async getActivityById(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity;
  }

  async updateActivity(id: number, activityData: InsertActivity): Promise<Activity> {
    const [updatedActivity] = await db
      .update(activities)
      .set({
        ...activityData,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, id))
      .returning();
    return updatedActivity;
  }

  async getActivitiesByUser(userId: string): Promise<ActivityWithDetails[]> {
    return await db
      .select({
        id: activities.id,
        userId: activities.userId,
        categoryId: activities.categoryId,
        title: activities.title,
        description: activities.description,
        activityDate: activities.activityDate,
        status: activities.status,
        approvedBy: activities.approvedBy,
        approvedAt: activities.approvedAt,
        rejectionReason: activities.rejectionReason,
        attachmentUrl: activities.attachmentUrl,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: activityCategories.id,
          name: activityCategories.name,
          points: activityCategories.points,
          monetaryValue: activityCategories.monetaryValue,
          description: activityCategories.description,
        },
        approver: {
          id: sql`approver.id`,
          email: sql`approver.email`,
          firstName: sql`approver.first_name`,
          lastName: sql`approver.last_name`,
          profileImageUrl: sql`approver.profile_image_url`,
          role: sql`approver.role`,
          designation: sql`approver.designation`,
          department: sql`approver.department`,
          createdAt: sql`approver.created_at`,
          updatedAt: sql`approver.updated_at`,
        },
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .leftJoin(sql`users as approver`, sql`activities.approved_by = approver.id`)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt)) as ActivityWithDetails[];
  }

  async getPendingActivities(): Promise<ActivityWithDetails[]> {
    const results = await db
      .select({
        id: activities.id,
        userId: activities.userId,
        categoryId: activities.categoryId,
        title: activities.title,
        description: activities.description,
        activityDate: activities.activityDate,
        status: activities.status,
        approvedBy: activities.approvedBy,
        approvedAt: activities.approvedAt,
        rejectionReason: activities.rejectionReason,
        attachmentUrl: activities.attachmentUrl,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: activityCategories.id,
          name: activityCategories.name,
          points: activityCategories.points,
          monetaryValue: activityCategories.monetaryValue,
          description: activityCategories.description,
        },
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .where(eq(activities.status, "pending"))
      .orderBy(desc(activities.createdAt));
    
    return results.map(row => ({
      ...row,
      approver: undefined
    })) as ActivityWithDetails[];
  }

  async approveActivity(approval: ApproveActivity, approverId: string): Promise<Activity> {
    const [updatedActivity] = await db
      .update(activities)
      .set({
        status: approval.status,
        approvedBy: approverId,
        approvedAt: new Date(),
        rejectionReason: approval.rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(activities.id, approval.id))
      .returning();
    return updatedActivity;
  }

  // Dashboard operations
  async getUserStats(userId: string): Promise<UserStats> {
    // Get user's approved activities
    const approvedActivities = await db
      .select({
        points: activityCategories.points,
        monetaryValue: activityCategories.monetaryValue,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .where(and(eq(activities.userId, userId), eq(activities.status, "approved")));

    // Get pending activities
    const pendingActivities = await db
      .select({
        points: activityCategories.points,
        monetaryValue: activityCategories.monetaryValue,
      })
      .from(activities)
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .where(and(eq(activities.userId, userId), eq(activities.status, "pending")));

    // Get approved encashment requests to calculate redeemed points
    const approvedEncashments = await db
      .select({
        pointsRequested: encashmentRequests.pointsRequested,
        monetaryValue: encashmentRequests.monetaryValue,
      })
      .from(encashmentRequests)
      .where(and(eq(encashmentRequests.userId, userId), eq(encashmentRequests.status, "approved")));

    // Calculate totals
    const totalPointsEarned = approvedActivities.reduce((sum, activity) => sum + activity.points, 0);
    const totalEarnings = approvedActivities.reduce((sum, activity) => sum + (activity.monetaryValue || 0), 0);
    
    // Calculate redeemed points
    const redeemedPoints = approvedEncashments.reduce((sum, encashment) => sum + encashment.pointsRequested, 0);
    const redeemedValue = approvedEncashments.reduce((sum, encashment) => sum + encashment.monetaryValue, 0);
    
    // Calculate balance points
    const balancePoints = totalPointsEarned - redeemedPoints;
    const balanceValue = totalEarnings - redeemedValue;
    
    // Calculate monthly points (current month)
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyActivities = approvedActivities.filter(
      activity => activity.createdAt && activity.createdAt >= currentMonth
    );
    const monthlyPoints = monthlyActivities.reduce((sum, activity) => sum + activity.points, 0);
    const monthlyEarnings = monthlyActivities.reduce((sum, activity) => sum + (activity.monetaryValue || 0), 0);

    // Calculate pending points
    const pendingPoints = pendingActivities.reduce((sum, activity) => sum + activity.points, 0);
    const pendingEarnings = pendingActivities.reduce((sum, activity) => sum + (activity.monetaryValue || 0), 0);

    // Get ranking (based on balance points for fair comparison)
    const leaderboard = await this.getLeaderboard();
    const userRanking = leaderboard.findIndex(user => user.id === userId) + 1;

    // Get total members
    const [totalMembersResult] = await db
      .select({ count: count() })
      .from(users);

    return {
      totalPoints: balancePoints, // Changed to balance points for consistency
      totalEarnings: balanceValue, // Changed to balance value for consistency
      totalPointsEarned,
      totalEarningsEarned: totalEarnings,
      redeemedPoints,
      redeemedValue,
      monthlyPoints,
      monthlyEarnings,
      pendingPoints,
      pendingEarnings,
      pendingActivities: pendingActivities.length,
      ranking: userRanking || 0,
      totalMembers: totalMembersResult?.count || 0,
    };
  }

  async getLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    const leaderboard = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        designation: users.designation,
        department: users.department,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        totalPoints: sql<number>`COALESCE(SUM(${activityCategories.points}), 0)`,
        totalEarnings: sql<number>`COALESCE(SUM(${activityCategories.monetaryValue}), 0)`,
      })
      .from(users)
      .leftJoin(activities, and(eq(users.id, activities.userId), eq(activities.status, "approved")))
      .leftJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .groupBy(users.id)
      .orderBy(desc(sql`COALESCE(SUM(${activityCategories.points}), 0)`));

    return leaderboard;
  }

  async getMonthlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const leaderboard = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        designation: users.designation,
        department: users.department,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        totalPoints: sql<number>`COALESCE(SUM(${activityCategories.points}), 0)`,
        totalEarnings: sql<number>`COALESCE(SUM(${activityCategories.monetaryValue}), 0)`,
      })
      .from(users)
      .leftJoin(activities, and(
        eq(users.id, activities.userId), 
        eq(activities.status, "approved"),
        gte(activities.approvedAt, currentMonth)
      ))
      .leftJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .groupBy(users.id)
      .orderBy(desc(sql`COALESCE(SUM(${activityCategories.points}), 0)`));

    return leaderboard;
  }

  async getYearlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    const currentYear = new Date();
    currentYear.setMonth(0, 1);
    currentYear.setHours(0, 0, 0, 0);
    
    const leaderboard = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        profileImageUrl: users.profileImageUrl,
        role: users.role,
        designation: users.designation,
        department: users.department,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        totalPoints: sql<number>`COALESCE(SUM(${activityCategories.points}), 0)`,
        totalEarnings: sql<number>`COALESCE(SUM(${activityCategories.monetaryValue}), 0)`,
      })
      .from(users)
      .leftJoin(activities, and(
        eq(users.id, activities.userId), 
        eq(activities.status, "approved"),
        gte(activities.approvedAt, currentYear)
      ))
      .leftJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .groupBy(users.id)
      .orderBy(desc(sql`COALESCE(SUM(${activityCategories.points}), 0)`));

    return leaderboard;
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityWithDetails[]> {
    return await db
      .select({
        id: activities.id,
        userId: activities.userId,
        categoryId: activities.categoryId,
        title: activities.title,
        description: activities.description,
        activityDate: activities.activityDate,
        status: activities.status,
        approvedBy: activities.approvedBy,
        approvedAt: activities.approvedAt,
        rejectionReason: activities.rejectionReason,
        attachmentUrl: activities.attachmentUrl,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: activityCategories.id,
          name: activityCategories.name,
          points: activityCategories.points,
          monetaryValue: activityCategories.monetaryValue,
          description: activityCategories.description,
        },
        approver: {
          id: sql`approver.id`,
          email: sql`approver.email`,
          firstName: sql`approver.first_name`,
          lastName: sql`approver.last_name`,
          profileImageUrl: sql`approver.profile_image_url`,
          role: sql`approver.role`,
          designation: sql`approver.designation`,
          department: sql`approver.department`,
          createdAt: sql`approver.created_at`,
          updatedAt: sql`approver.updated_at`,
        },
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .leftJoin(sql`users as approver`, sql`activities.approved_by = approver.id`)
      .where(eq(activities.status, "approved"))
      .orderBy(desc(activities.approvedAt))
      .limit(limit) as ActivityWithDetails[];
  }

  async getAllActivities(): Promise<ActivityWithDetails[]> {
    return await db
      .select({
        id: activities.id,
        userId: activities.userId,
        categoryId: activities.categoryId,
        title: activities.title,
        description: activities.description,
        activityDate: activities.activityDate,
        status: activities.status,
        approvedBy: activities.approvedBy,
        approvedAt: activities.approvedAt,
        rejectionReason: activities.rejectionReason,
        attachmentUrl: activities.attachmentUrl,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: activityCategories.id,
          name: activityCategories.name,
          points: activityCategories.points,
          monetaryValue: activityCategories.monetaryValue,
          description: activityCategories.description,
        },
        approver: {
          id: sql`approver.id`,
          email: sql`approver.email`,
          firstName: sql`approver.first_name`,
          lastName: sql`approver.last_name`,
          profileImageUrl: sql`approver.profile_image_url`,
          role: sql`approver.role`,
          designation: sql`approver.designation`,
          department: sql`approver.department`,
          createdAt: sql`approver.created_at`,
          updatedAt: sql`approver.updated_at`,
        },
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .leftJoin(sql`users as approver`, sql`activities.approved_by = approver.id`)
      .orderBy(desc(activities.createdAt)) as ActivityWithDetails[];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.firstName, users.lastName);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getActivitiesByUserId(userId: string): Promise<ActivityWithDetails[]> {
    return await db
      .select({
        id: activities.id,
        userId: activities.userId,
        categoryId: activities.categoryId,
        title: activities.title,
        description: activities.description,
        activityDate: activities.activityDate,
        status: activities.status,
        approvedBy: activities.approvedBy,
        approvedAt: activities.approvedAt,
        rejectionReason: activities.rejectionReason,
        attachmentUrl: activities.attachmentUrl,
        createdAt: activities.createdAt,
        updatedAt: activities.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        category: {
          id: activityCategories.id,
          name: activityCategories.name,
          points: activityCategories.points,
          monetaryValue: activityCategories.monetaryValue,
          description: activityCategories.description,
        },
      })
      .from(activities)
      .innerJoin(users, eq(activities.userId, users.id))
      .innerJoin(activityCategories, eq(activities.categoryId, activityCategories.id))
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt)) as ActivityWithDetails[];
  }

  async getUserStatsById(userId: string): Promise<UserStats> {
    return this.getUserStats(userId);
  }

  // Encashment operations
  async createEncashmentRequest(request: InsertEncashmentRequest): Promise<EncashmentRequest> {
    const [encashmentRequest] = await db
      .insert(encashmentRequests)
      .values(request)
      .returning();
    return encashmentRequest;
  }

  async getEncashmentRequestsByUser(userId: string): Promise<EncashmentRequestWithDetails[]> {
    return await db
      .select({
        id: encashmentRequests.id,
        userId: encashmentRequests.userId,
        pointsRequested: encashmentRequests.pointsRequested,
        monetaryValue: encashmentRequests.monetaryValue,
        status: encashmentRequests.status,
        approvedBy: encashmentRequests.approvedBy,
        approvedAt: encashmentRequests.approvedAt,
        rejectionReason: encashmentRequests.rejectionReason,
        paymentDetails: encashmentRequests.paymentDetails,
        createdAt: encashmentRequests.createdAt,
        updatedAt: encashmentRequests.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        approver: {
          id: sql`approver.id`,
          email: sql`approver.email`,
          firstName: sql`approver.first_name`,
          lastName: sql`approver.last_name`,
          profileImageUrl: sql`approver.profile_image_url`,
          role: sql`approver.role`,
          designation: sql`approver.designation`,
          department: sql`approver.department`,
          createdAt: sql`approver.created_at`,
          updatedAt: sql`approver.updated_at`,
        },
      })
      .from(encashmentRequests)
      .innerJoin(users, eq(encashmentRequests.userId, users.id))
      .leftJoin(sql`${users} as approver`, sql`${encashmentRequests.approvedBy} = approver.id`)
      .where(eq(encashmentRequests.userId, userId))
      .orderBy(desc(encashmentRequests.createdAt)) as EncashmentRequestWithDetails[];
  }

  async getPendingEncashmentRequests(): Promise<EncashmentRequestWithDetails[]> {
    return await db
      .select({
        id: encashmentRequests.id,
        userId: encashmentRequests.userId,
        pointsRequested: encashmentRequests.pointsRequested,
        monetaryValue: encashmentRequests.monetaryValue,
        status: encashmentRequests.status,
        approvedBy: encashmentRequests.approvedBy,
        approvedAt: encashmentRequests.approvedAt,
        rejectionReason: encashmentRequests.rejectionReason,
        paymentDetails: encashmentRequests.paymentDetails,
        createdAt: encashmentRequests.createdAt,
        updatedAt: encashmentRequests.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        approver: {
          id: sql`approver.id`,
          email: sql`approver.email`,
          firstName: sql`approver.first_name`,
          lastName: sql`approver.last_name`,
          profileImageUrl: sql`approver.profile_image_url`,
          role: sql`approver.role`,
          designation: sql`approver.designation`,
          department: sql`approver.department`,
          createdAt: sql`approver.created_at`,
          updatedAt: sql`approver.updated_at`,
        },
      })
      .from(encashmentRequests)
      .innerJoin(users, eq(encashmentRequests.userId, users.id))
      .leftJoin(sql`${users} as approver`, sql`${encashmentRequests.approvedBy} = approver.id`)
      .where(eq(encashmentRequests.status, "pending"))
      .orderBy(desc(encashmentRequests.createdAt)) as EncashmentRequestWithDetails[];
  }

  async approveEncashmentRequest(approval: ApproveEncashmentRequest, approverId: string): Promise<EncashmentRequest> {
    const updateData: any = {
      status: approval.status,
      approvedBy: approverId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    if (approval.rejectionReason) {
      updateData.rejectionReason = approval.rejectionReason;
    }

    if (approval.paymentDetails) {
      updateData.paymentDetails = approval.paymentDetails;
    }

    const [encashmentRequest] = await db
      .update(encashmentRequests)
      .set(updateData)
      .where(eq(encashmentRequests.id, approval.id))
      .returning();

    return encashmentRequest;
  }

  // Profile change request operations
  async createProfileChangeRequest(request: InsertProfileChangeRequest): Promise<ProfileChangeRequest> {
    const [profileChangeRequest] = await db
      .insert(profileChangeRequests)
      .values(request)
      .returning();
    return profileChangeRequest;
  }

  async getProfileChangeRequestsByUser(userId: string): Promise<ProfileChangeRequestWithDetails[]> {
    return await db
      .select({
        id: profileChangeRequests.id,
        userId: profileChangeRequests.userId,
        requestedFirstName: profileChangeRequests.requestedFirstName,
        requestedLastName: profileChangeRequests.requestedLastName,
        requestedDesignation: profileChangeRequests.requestedDesignation,
        profileImageUrl: profileChangeRequests.profileImageUrl,
        status: profileChangeRequests.status,
        approvedBy: profileChangeRequests.approvedBy,
        approvedAt: profileChangeRequests.approvedAt,
        rejectionReason: profileChangeRequests.rejectionReason,
        createdAt: profileChangeRequests.createdAt,
        updatedAt: profileChangeRequests.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        approver: {
          id: sql`approver.id`,
          email: sql`approver.email`,
          firstName: sql`approver.first_name`,
          lastName: sql`approver.last_name`,
          profileImageUrl: sql`approver.profile_image_url`,
          role: sql`approver.role`,
          designation: sql`approver.designation`,
          department: sql`approver.department`,
          createdAt: sql`approver.created_at`,
          updatedAt: sql`approver.updated_at`,
        },
      })
      .from(profileChangeRequests)
      .innerJoin(users, eq(profileChangeRequests.userId, users.id))
      .leftJoin(sql`${users} as approver`, sql`${profileChangeRequests.approvedBy} = approver.id`)
      .where(eq(profileChangeRequests.userId, userId))
      .orderBy(desc(profileChangeRequests.createdAt)) as ProfileChangeRequestWithDetails[];
  }

  async getPendingProfileChangeRequests(): Promise<ProfileChangeRequestWithDetails[]> {
    return await db
      .select({
        id: profileChangeRequests.id,
        userId: profileChangeRequests.userId,
        requestedFirstName: profileChangeRequests.requestedFirstName,
        requestedLastName: profileChangeRequests.requestedLastName,
        requestedDesignation: profileChangeRequests.requestedDesignation,
        profileImageUrl: profileChangeRequests.profileImageUrl,
        status: profileChangeRequests.status,
        approvedBy: profileChangeRequests.approvedBy,
        approvedAt: profileChangeRequests.approvedAt,
        rejectionReason: profileChangeRequests.rejectionReason,
        createdAt: profileChangeRequests.createdAt,
        updatedAt: profileChangeRequests.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          role: users.role,
          designation: users.designation,
          department: users.department,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        approver: {
          id: sql`approver.id`,
          email: sql`approver.email`,
          firstName: sql`approver.first_name`,
          lastName: sql`approver.last_name`,
          profileImageUrl: sql`approver.profile_image_url`,
          role: sql`approver.role`,
          designation: sql`approver.designation`,
          department: sql`approver.department`,
          createdAt: sql`approver.created_at`,
          updatedAt: sql`approver.updated_at`,
        },
      })
      .from(profileChangeRequests)
      .innerJoin(users, eq(profileChangeRequests.userId, users.id))
      .leftJoin(sql`${users} as approver`, sql`${profileChangeRequests.approvedBy} = approver.id`)
      .where(eq(profileChangeRequests.status, "pending"))
      .orderBy(desc(profileChangeRequests.createdAt)) as ProfileChangeRequestWithDetails[];
  }

  async approveProfileChangeRequest(approval: ApproveProfileChangeRequest, approverId: string): Promise<ProfileChangeRequest> {
    const updateData: any = {
      status: approval.status,
      approvedBy: approverId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    if (approval.rejectionReason) {
      updateData.rejectionReason = approval.rejectionReason;
    }

    const [profileChangeRequest] = await db
      .update(profileChangeRequests)
      .set(updateData)
      .where(eq(profileChangeRequests.id, approval.id))
      .returning();

    // If approved, apply the changes to the user profile
    if (approval.status === "approved") {
      const request = await db
        .select()
        .from(profileChangeRequests)
        .where(eq(profileChangeRequests.id, approval.id))
        .limit(1);

      if (request[0]) {
        const userUpdateData: any = {
          firstName: request[0].requestedFirstName,
          lastName: request[0].requestedLastName,
          designation: request[0].requestedDesignation,
          updatedAt: new Date(),
        };

        // Update role based on designation
        if (request[0].requestedDesignation === 'Partner') {
          userUpdateData.role = 'approver';
        } else {
          userUpdateData.role = 'contributor';
        }

        // Update profile image if provided
        if (request[0].profileImageUrl) {
          userUpdateData.profileImageUrl = request[0].profileImageUrl;
        }

        await db
          .update(users)
          .set(userUpdateData)
          .where(eq(users.id, request[0].userId));
      }
    }

    return profileChangeRequest;
  }
}

export const storage = new DatabaseStorage();
