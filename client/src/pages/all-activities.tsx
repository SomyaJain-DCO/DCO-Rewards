import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar, User, Award, Clock, Search, Download, X } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";

export default function AllActivities() {
  const { user, isAuthenticated } = useAuth();
  const userRole = (user as any)?.role;
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allActivities, isLoading } = useQuery({
    queryKey: ["/api/activities/all"],
    enabled: isAuthenticated,
  });

  // Filter activities based on search term
  const filteredActivities = allActivities?.filter((activity: any) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      activity.title?.toLowerCase().includes(searchLower) ||
      activity.description?.toLowerCase().includes(searchLower) ||
      activity.category?.name?.toLowerCase().includes(searchLower) ||
      activity.user?.firstName?.toLowerCase().includes(searchLower) ||
      activity.user?.lastName?.toLowerCase().includes(searchLower) ||
      activity.user?.email?.toLowerCase().includes(searchLower)
    );
  }) || [];

  const exportToCSV = () => {
    if (!filteredActivities || filteredActivities.length === 0) return;
    
    const headers = [
      'Title',
      'Description', 
      'Category',
      'Points',
      'Monetary Value',
      'Status',
      'User Name',
      'User Email',
      'Activity Date',
      'Submitted Date',
      'Approved Date',
      'Approver'
    ];
    
    const csvData = filteredActivities.map((activity: any) => [
      activity.title || '',
      activity.description || '',
      activity.category?.name || '',
      activity.category?.points || 0,
      activity.category?.monetaryValue || 0,
      activity.status || '',
      `${activity.user?.firstName || ''} ${activity.user?.lastName || ''}`.trim() || activity.user?.email || '',
      activity.user?.email || '',
      activity.activityDate ? format(new Date(activity.activityDate), 'yyyy-MM-dd') : '',
      activity.createdAt ? format(new Date(activity.createdAt), 'yyyy-MM-dd HH:mm') : '',
      activity.approvedAt ? format(new Date(activity.approvedAt), 'yyyy-MM-dd HH:mm') : '',
      activity.approver ? `${activity.approver.firstName || ''} ${activity.approver.lastName || ''}`.trim() || activity.approver.email : ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `all-activities-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Activities</h1>
          <p className="text-gray-600">Complete overview of team contributions</p>
        </div>
        
        <div className="grid gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getDisplayName = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email?.split('@')[0] || 'User';
  };

  const getInitials = (user: any) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
    }
    if (user.firstName) return user.firstName.charAt(0).toUpperCase();
    if (user.lastName) return user.lastName.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">All Activities</h1>
        <p className="text-gray-600">Complete overview of team contributions</p>
      </div>

      {/* Search and Export Section */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search activities, users, or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <Button
              onClick={() => setSearchTerm("")}
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {filteredActivities.length} of {allActivities?.length || 0} activities
          </span>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            disabled={filteredActivities.length === 0}
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-3">
        {filteredActivities && filteredActivities.length > 0 ? (
          filteredActivities.map((activity: any) => (
            <Card key={activity.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* User Avatar */}
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {getInitials(activity.user)}
                      </span>
                    </div>

                    {/* Activity Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link href={`/user/${activity.user.id}`}>
                          <h3 className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer transition-colors">
                            {getDisplayName(activity.user)}
                          </h3>
                        </Link>
                        <span className="text-gray-400">•</span>
                        <span className="text-sm text-gray-600">{activity.user.designation || "Team Member"}</span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Award className="w-4 h-4" />
                          <span className="font-medium">{activity.category.name}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{format(new Date(activity.activityDate), "MMM d, yyyy")}</span>
                        </div>

                        {activity.status === 'approved' && activity.approvedAt && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Approved {format(new Date(activity.approvedAt), "MMM d")}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm text-gray-900 flex-1 line-clamp-1">
                          <span className="font-medium">{activity.title}</span>
                          <span className="text-gray-400 mx-2">|</span>
                          <span className="text-gray-600">{activity.description}</span>
                        </p>
                        {getStatusBadge(activity.status)}
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="flex items-center space-x-3 flex-shrink-0">
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {activity.category.points} pts
                      </div>
                      {userRole === 'approver' && (
                        <div className="text-sm text-secondary font-medium">
                          ₹{activity.category.monetaryValue?.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No activities found</p>
                <p>Activities will appear here once team members start contributing.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {allActivities && allActivities.length > 0 && (
        <div className="text-center text-sm text-gray-500 mt-6">
          Showing {allActivities.length} activities
        </div>
      )}
    </div>
  );
}