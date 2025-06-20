import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Users, Award } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img 
              src="/dco-logo.png" 
              alt="Dhadda & Co. Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Dhadda & Co.
          </h1>
          <p className="text-xl text-gray-600 mb-2">Chartered Accountants</p>
          <p className="text-lg text-gray-500 mb-8">Team Rewards Management System</p>
          
          <div className="max-w-2xl mx-auto text-gray-600 mb-8">
            <p>
              Track your professional contributions, earn reward points, and celebrate team achievements. 
              Join our rewards program to get recognized for your valuable contributions to the firm.
            </p>
          </div>

          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="px-8 py-3 text-lg bg-primary hover:bg-primary/90"
          >
            Login to Continue
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <Trophy className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle className="text-lg">Earn Points</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get rewarded for articles, sessions, and professional contributions
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 text-secondary mx-auto mb-2" />
              <CardTitle className="text-lg">Track Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Monitor your contributions and earnings with detailed analytics
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-purple-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Team Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View team leaderboard and celebrate collective achievements
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Award className="h-12 w-12 text-orange-600 mx-auto mb-2" />
              <CardTitle className="text-lg">Monetary Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Convert your points to monetary rewards (₹100 per point)
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Activity Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Third-party Website Articles</span>
                    <span className="font-medium">10 pts (₹1,000)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LinkedIn Articles</span>
                    <span className="font-medium">8 pts (₹800)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Newsletter Articles</span>
                    <span className="font-medium">7 pts (₹700)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Journal Articles</span>
                    <span className="font-medium">15 pts (₹1,500)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Writing a Book</span>
                    <span className="font-medium">100 pts (₹10,000)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Office Training Sessions</span>
                    <span className="font-medium">6 pts (₹600)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Professional Body Sessions</span>
                    <span className="font-medium">10 pts (₹1,000)</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Virtual Client Sessions</span>
                    <span className="font-medium">8 pts (₹800)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Training Mentoring</span>
                    <span className="font-medium">2 pts (₹200)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RRC Attendance</span>
                    <span className="font-medium">15 pts (₹1,500)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Study Circle Meetings</span>
                    <span className="font-medium">5 pts (₹500)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conference Attendance</span>
                    <span className="font-medium">5 pts (₹500)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LinkedIn Technical Posts</span>
                    <span className="font-medium">1 pt (₹100)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Newsletter Contributions</span>
                    <span className="font-medium">3 pts (₹300)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
