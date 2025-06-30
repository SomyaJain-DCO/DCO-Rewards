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
import { supabase } from './supabaseClient';

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
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as User | undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Upsert by id
    const { data, error } = await supabase
      .from('users')
      .upsert([{ ...userData, updatedAt: new Date().toISOString() }], { onConflict: ['id'] })
      .select()
      .single();
    if (error) throw error;
    return data as User;
  }

  async updateUserDesignation(id: string, designation: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ designation, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw error || new Error('User not found');
    return data as User;
  }

  async updateUserDesignationAndRole(id: string, designation: string, role: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ designation, role, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error || !data) throw error || new Error('User not found');
    return data as User;
  }

  // Activity category operations
  async getActivityCategories(): Promise<ActivityCategory[]> {
    const { data, error } = await supabase
      .from('activityCategories')
      .select('*')
      .order('id', { ascending: true });
    if (error) throw error;
    return data as ActivityCategory[];
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
    const { data, error } = await supabase
      .from('activityCategories')
      .select('id');
    if (error) throw error;
    if (!data || data.length === 0) {
      const { error: insertError } = await supabase
        .from('activityCategories')
        .insert(categories);
      if (insertError) throw insertError;
    }
  }

  // Activity operations
  async createActivity(activity: InsertActivity): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .insert([{ ...activity }])
      .select()
      .single();
    if (error) throw error;
    return data as Activity;
  }

  async getActivityById(id: number): Promise<Activity | undefined> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Activity | undefined;
  }

  async updateActivity(id: number, activityData: InsertActivity): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .update({ ...activityData, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Activity;
  }

  async getActivitiesByUser(userId: string): Promise<ActivityWithDetails[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('userId', userId);
    if (error) throw error;
    return data as ActivityWithDetails[];
  }

  async getPendingActivities(): Promise<ActivityWithDetails[]> {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('status', 'pending');
    if (error) throw error;
    return data as ActivityWithDetails[];
  }

  async approveActivity(approval: ApproveActivity, approverId: string): Promise<Activity> {
    const { data, error } = await supabase
      .from('activities')
      .update({
        status: approval.status,
        approvedBy: approverId,
        approvedAt: new Date().toISOString(),
        rejectionReason: approval.rejectionReason || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', approval.activityId)
      .select()
      .single();
    if (error) throw error;
    return data as Activity;
  }

  // Dashboard operations
  async getUserStats(userId: string): Promise<UserStats> {
    // Fetch all activities and encashments for the user
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'approved');
    if (activitiesError) throw activitiesError;

    const { data: encashments, error: encashmentsError } = await supabase
      .from('encashmentRequests')
      .select('*')
      .eq('userId', userId)
      .eq('status', 'approved');
    if (encashmentsError) throw encashmentsError;

    const totalPoints = activities?.reduce((sum, activity) => sum + (activity.points || 0), 0) || 0;
    const totalEarnings = activities?.reduce((sum, activity) => sum + (activity.monetaryValue || 0), 0) || 0;
    const totalEncashed = encashments?.reduce((sum, encashment) => sum + (encashment.amount || 0), 0) || 0;

    return {
      totalPoints,
      totalEarnings,
      totalEncashed,
    };
  }

  async getLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    // Fetch all users and their activities
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*');
    if (usersError) throw usersError;

    const { data: activitiesData, error: activitiesError } = await supabase
      .from('activities')
      .select('*')
      .eq('status', 'approved');
    if (activitiesError) throw activitiesError;

    // Aggregate points and earnings per user
    const leaderboard = (usersData || []).map(user => {
      const userActivities = (activitiesData || []).filter(activity => activity.userId === user.id);
      const totalPoints = userActivities.reduce((sum, activity) => sum + (activity.points || 0), 0);
      const totalEarnings = userActivities.reduce((sum, activity) => sum + (activity.monetaryValue || 0), 0);
      return { ...user, totalPoints, totalEarnings };
    });

    // Sort by totalPoints descending
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints);
    return leaderboard;
  }

  async getMonthlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const leaderboard = await supabase
      .from('users')
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
        totalPoints: supabase.sql<number>`COALESCE(SUM(${activityCategories.points}), 0)`,
        totalEarnings: supabase.sql<number>`COALESCE(SUM(${activityCategories.monetaryValue}), 0)`,
      })
      .leftJoin(activities, supabase.and(
        supabase.eq(users.id, activities.userId), 
        supabase.eq(activities.status, "approved"),
        supabase.gte(activities.approvedAt, currentMonth)
      ))
      .leftJoin(activityCategories, supabase.eq(activities.categoryId, activityCategories.id))
      .groupBy(users.id)
      .orderBy(supabase.desc(supabase.sql`COALESCE(SUM(${activityCategories.points}), 0)`));

    return leaderboard;
  }

  async getYearlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    const currentYear = new Date();
    currentYear.setMonth(0, 1);
    currentYear.setHours(0, 0, 0, 0);
    
    const leaderboard = await supabase
      .from('users')
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
        totalPoints: supabase.sql<number>`COALESCE(SUM(${activityCategories.points}), 0)`,
        totalEarnings: supabase.sql<number>`COALESCE(SUM(${activityCategories.monetaryValue}), 0)`,
      })
      .leftJoin(activities, supabase.and(
        supabase.eq(users.id, activities.userId), 
        supabase.eq(activities.status, "approved"),
        supabase.gte(activities.approvedAt, currentYear)
      ))
      .leftJoin(activityCategories, supabase.eq(activities.categoryId, activityCategories.id))
      .groupBy(users.id)
      .orderBy(supabase.desc(supabase.sql`COALESCE(SUM(${activityCategories.points}), 0)`));

    return leaderboard;
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityWithDetails[]> {
    return await supabase
      .from('activities')
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
          id: supabase.sql`approver.id`,
          email: supabase.sql`approver.email`,
          firstName: supabase.sql`approver.first_name`,
          lastName: supabase.sql`approver.last_name`,
          profileImageUrl: supabase.sql`approver.profile_image_url`,
          role: supabase.sql`approver.role`,
          designation: supabase.sql`approver.designation`,
          department: supabase.sql`approver.department`,
          createdAt: supabase.sql`approver.created_at`,
          updatedAt: supabase.sql`approver.updated_at`,
        },
      })
      .from(activities)
      .innerJoin(users, supabase.eq(activities.userId, users.id))
      .innerJoin(activityCategories, supabase.eq(activities.categoryId, activityCategories.id))
      .leftJoin(supabase.sql`users as approver`, supabase.sql`activities.approved_by = approver.id`)
      .where(supabase.eq(activities.status, "approved"))
      .orderBy(supabase.desc(activities.approvedAt))
      .limit(limit) as ActivityWithDetails[];
  }

  async getAllActivities(): Promise<ActivityWithDetails[]> {
    return await supabase
      .from('activities')
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
          id: supabase.sql`approver.id`,
          email: supabase.sql`approver.email`,
          firstName: supabase.sql`approver.first_name`,
          lastName: supabase.sql`approver.last_name`,
          profileImageUrl: supabase.sql`approver.profile_image_url`,
          role: supabase.sql`approver.role`,
          designation: supabase.sql`approver.designation`,
          department: supabase.sql`approver.department`,
          createdAt: supabase.sql`approver.created_at`,
          updatedAt: supabase.sql`approver.updated_at`,
        },
      })
      .from(activities)
      .innerJoin(users, supabase.eq(activities.userId, users.id))
      .innerJoin(activityCategories, supabase.eq(activities.categoryId, activityCategories.id))
      .leftJoin(supabase.sql`users as approver`, supabase.sql`activities.approved_by = approver.id`)
      .orderBy(supabase.desc(activities.createdAt)) as ActivityWithDetails[];
  }

  async getAllUsers(): Promise<User[]> {
    return await supabase.select().from(users).orderBy(users.firstName, users.lastName);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await supabase.select().from(users).where(supabase.eq(users.id, id));
    return user;
  }

  async getActivitiesByUserId(userId: string): Promise<ActivityWithDetails[]> {
    return await supabase
      .from('activities')
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
      .innerJoin(users, supabase.eq(activities.userId, users.id))
      .innerJoin(activityCategories, supabase.eq(activities.categoryId, activityCategories.id))
      .where(supabase.eq(activities.userId, userId))
      .orderBy(supabase.desc(activities.createdAt)) as ActivityWithDetails[];
  }

  async getUserStatsById(userId: string): Promise<UserStats> {
    return this.getUserStats(userId);
  }

  // Encashment operations
  async createEncashmentRequest(request: InsertEncashmentRequest): Promise<EncashmentRequest> {
    const { data, error } = await supabase
      .from('encashmentRequests')
      .insert([{ ...request }])
      .select()
      .single();
    if (error) throw error;
    return data as EncashmentRequest;
  }

  async getEncashmentRequestsByUser(userId: string): Promise<EncashmentRequestWithDetails[]> {
    const { data, error } = await supabase
      .from('encashmentRequests')
      .select('*')
      .eq('userId', userId);
    if (error) throw error;
    return data as EncashmentRequestWithDetails[];
  }

  async getPendingEncashmentRequests(): Promise<EncashmentRequestWithDetails[]> {
    const { data, error } = await supabase
      .from('encashmentRequests')
      .select('*')
      .eq('status', 'pending');
    if (error) throw error;
    return data as EncashmentRequestWithDetails[];
  }

  async approveEncashmentRequest(approval: ApproveEncashmentRequest, approverId: string): Promise<EncashmentRequest> {
    const { data, error } = await supabase
      .from('encashmentRequests')
      .update({
        status: approval.status,
        approvedBy: approverId,
        approvedAt: new Date().toISOString(),
        rejectionReason: approval.rejectionReason || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', approval.encashmentRequestId)
      .select()
      .single();
    if (error) throw error;
    return data as EncashmentRequest;
  }

  // Profile change request operations
  async createProfileChangeRequest(request: InsertProfileChangeRequest): Promise<ProfileChangeRequest> {
    const { data, error } = await supabase
      .from('profileChangeRequests')
      .insert([{ ...request }])
      .select()
      .single();
    if (error) throw error;
    return data as ProfileChangeRequest;
  }

  async getProfileChangeRequestsByUser(userId: string): Promise<ProfileChangeRequestWithDetails[]> {
    const { data, error } = await supabase
      .from('profileChangeRequests')
      .select('*')
      .eq('userId', userId);
    if (error) throw error;
    return data as ProfileChangeRequestWithDetails[];
  }

  async getPendingProfileChangeRequests(): Promise<ProfileChangeRequestWithDetails[]> {
    const { data, error } = await supabase
      .from('profileChangeRequests')
      .select('*')
      .eq('status', 'pending');
    if (error) throw error;
    return data as ProfileChangeRequestWithDetails[];
  }

  async approveProfileChangeRequest(approval: ApproveProfileChangeRequest, approverId: string): Promise<ProfileChangeRequest> {
    const { data, error } = await supabase
      .from('profileChangeRequests')
      .update({
        status: approval.status,
        approvedBy: approverId,
        approvedAt: new Date().toISOString(),
        rejectionReason: approval.rejectionReason || null,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', approval.profileChangeRequestId)
      .select()
      .single();
    if (error) throw error;
    return data as ProfileChangeRequest;
  }
}

export const storage = new DatabaseStorage();
