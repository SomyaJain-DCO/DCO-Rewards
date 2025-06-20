import {
  type User,
  type UpsertUser,
  type Activity,
  type ActivityCategory,
  type InsertActivity,
  type InsertActivityCategory,
  type ApproveActivity,
  type ActivityWithDetails,
  type EncashmentRequest,
  type InsertEncashmentRequest,
  type ApproveEncashmentRequest,
  type EncashmentRequestWithDetails,
  type UserStats,
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserDesignation(id: string, designation: string): Promise<User>;
  updateUserDesignationAndRole(id: string, designation: string, role: string): Promise<User>;
  updateUserProfile(id: string, profile: { firstName: string; lastName: string; designation: string; role: string }): Promise<User>;
  
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
}

export class MockStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private activities: Map<number, Activity> = new Map();
  private activityCategories: ActivityCategory[] = [];
  private encashmentRequests: Map<number, EncashmentRequest> = new Map();
  private nextActivityId = 1;
  private nextEncashmentId = 1;

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);
    const user: User = {
      id: userData.id,
      email: userData.email || null,
      firstName: userData.firstName || existingUser?.firstName || null,
      lastName: userData.lastName || existingUser?.lastName || null,
      profileImageUrl: userData.profileImageUrl || existingUser?.profileImageUrl || null,
      role: userData.role || existingUser?.role || "contributor",
      designation: userData.designation || existingUser?.designation || null,
      department: userData.department || existingUser?.department || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id, user);
    return user;
  }

  async updateUserDesignation(id: string, designation: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, designation, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserDesignationAndRole(id: string, designation: string, role: string): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { ...user, designation, role, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserProfile(id: string, profile: { firstName: string; lastName: string; designation: string; role: string }): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser = { 
      ...user, 
      firstName: profile.firstName,
      lastName: profile.lastName,
      designation: profile.designation,
      role: profile.role,
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getActivityCategories(): Promise<ActivityCategory[]> {
    return this.activityCategories;
  }

  async seedActivityCategories(): Promise<void> {
    if (this.activityCategories.length === 0) {
      this.activityCategories = [
        { id: 1, name: "Professional Development", points: 2, monetaryValue: 200, description: null },
        { id: 2, name: "Client Presentation", points: 3, monetaryValue: 300, description: null },
        { id: 3, name: "Team Training", points: 2, monetaryValue: 200, description: null },
      ];
    }
  }

  async createActivity(activity: InsertActivity): Promise<Activity> {
    const newActivity: Activity = {
      id: this.nextActivityId++,
      userId: activity.userId,
      categoryId: activity.categoryId,
      title: activity.title,
      description: activity.description,
      activityDate: activity.activityDate,
      attachmentUrl: activity.attachmentUrl || null,
      filePath: activity.filePath || null,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.activities.set(newActivity.id, newActivity);
    return newActivity;
  }

  async getActivitiesByUser(userId: string): Promise<ActivityWithDetails[]> {
    return [];
  }

  async getActivityById(id: number): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  async updateActivity(id: number, activityData: InsertActivity): Promise<Activity> {
    const activity = this.activities.get(id);
    if (!activity) throw new Error("Activity not found");
    
    const updatedActivity = { ...activity, ...activityData, updatedAt: new Date() };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async getPendingActivities(): Promise<ActivityWithDetails[]> {
    return [];
  }

  async approveActivity(approval: ApproveActivity, approverId: string): Promise<Activity> {
    const activity = this.activities.get(approval.id);
    if (!activity) throw new Error("Activity not found");
    
    const updatedActivity = { 
      ...activity, 
      status: approval.status,
      approvedBy: approverId,
      approvedAt: new Date(),
      rejectionReason: approval.rejectionReason || null,
      updatedAt: new Date()
    };
    this.activities.set(approval.id, updatedActivity);
    return updatedActivity;
  }

  async getUserStats(userId: string): Promise<UserStats> {
    return {
      totalPoints: 0,
      totalEarnings: 0,
      totalPointsEarned: 0,
      totalEarningsEarned: 0,
      redeemedPoints: 0,
      redeemedValue: 0,
      monthlyPoints: 0,
      monthlyEarnings: 0,
      pendingPoints: 0,
      pendingEarnings: 0,
      pendingActivities: 0,
      ranking: 1,
      totalMembers: 1,
    };
  }

  async getLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    return [];
  }

  async getMonthlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    return [];
  }

  async getYearlyLeaderboard(): Promise<Array<User & { totalPoints: number; totalEarnings: number }>> {
    return [];
  }

  async getRecentActivities(limit: number = 10): Promise<ActivityWithDetails[]> {
    return [];
  }

  async getAllActivities(): Promise<ActivityWithDetails[]> {
    return [];
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getActivitiesByUserId(userId: string): Promise<ActivityWithDetails[]> {
    return [];
  }

  async getUserStatsById(userId: string): Promise<UserStats> {
    return this.getUserStats(userId);
  }

  async createEncashmentRequest(request: InsertEncashmentRequest): Promise<EncashmentRequest> {
    const newRequest: EncashmentRequest = {
      id: this.nextEncashmentId++,
      userId: request.userId,
      pointsRequested: request.pointsRequested,
      monetaryValue: request.monetaryValue,
      status: "pending",
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      paymentDetails: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.encashmentRequests.set(newRequest.id, newRequest);
    return newRequest;
  }

  async getEncashmentRequestsByUser(userId: string): Promise<EncashmentRequestWithDetails[]> {
    return [];
  }

  async getPendingEncashmentRequests(): Promise<EncashmentRequestWithDetails[]> {
    return [];
  }

  async approveEncashmentRequest(approval: ApproveEncashmentRequest, approverId: string): Promise<EncashmentRequest> {
    const request = this.encashmentRequests.get(approval.id);
    if (!request) throw new Error("Encashment request not found");
    
    const updatedRequest = { 
      ...request, 
      status: approval.status,
      approvedBy: approverId,
      approvedAt: new Date(),
      rejectionReason: approval.rejectionReason || null,
      paymentDetails: approval.paymentDetails || null,
      updatedAt: new Date()
    };
    this.encashmentRequests.set(approval.id, updatedRequest);
    return updatedRequest;
  }
}

export const storage = new MockStorage();