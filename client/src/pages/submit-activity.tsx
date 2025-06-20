import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertActivitySchema } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

const formSchema = insertActivitySchema.omit({ userId: true }).extend({
  categoryId: z.number().min(1, "Please select an activity type"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  activityDate: z.string().min(1, "Activity date is required"),
  attachmentUrl: z.string().optional().refine(
    (url) => !url || url === "" || /^https?:\/\/.+/.test(url),
    { message: "Please enter a valid URL starting with http:// or https://" }
  ),
  filePath: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function SubmitActivity() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCategory, setSelectedCategory] = useState<any>(null);

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/activity-categories"],
    enabled: isAuthenticated,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      activityDate: "",
      attachmentUrl: "",
      filePath: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return await apiRequest("/api/activities", "POST", {
        ...data,
        activityDate: data.activityDate,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity submitted successfully! It will be reviewed by your supervisor.",
      });
      form.reset();
      setSelectedCategory(null);
      queryClient.invalidateQueries({ queryKey: ["/api/activities/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
    onError: (error: any) => {
      console.error("Activity submission error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to submit activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleCategoryChange = (categoryId: string) => {
    if (categories && Array.isArray(categories)) {
      const category = categories.find((cat: any) => cat.id === parseInt(categoryId));
      setSelectedCategory(category);
      form.setValue("categoryId", parseInt(categoryId));
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      console.log("Submitting activity data:", data);
      mutation.mutate(data);
    } catch (error) {
      console.error("Form submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit form. Please check your inputs and try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || categoriesLoading) {
    return (
      <div className="max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Submit New Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Submit New Activity</CardTitle>
          <p className="text-sm text-gray-600">Add your contribution for approval and reward points</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Type</FormLabel>
                      <Select
                        onValueChange={handleCategoryChange}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select activity type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories && Array.isArray(categories) && categories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name} ({category.points} pts - ₹{category.monetaryValue?.toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-2">
                  <FormLabel>Expected Points</FormLabel>
                  <div className="flex items-center space-x-4">
                    <Input
                      value={selectedCategory?.points || 0}
                      readOnly
                      className="w-20 text-center font-bold bg-gray-50"
                    />
                    <span className="text-sm text-gray-600">points</span>
                    <span className="text-sm font-medium text-secondary">
                      ₹{selectedCategory?.monetaryValue?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Description</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter title or brief description of your contribution"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Detailed Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Provide detailed information about your contribution, including relevant links, dates, or additional context"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="activityDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Activity</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="attachmentUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supporting Document URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/document.pdf"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="filePath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local File Path (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="C:\Documents\project-file.pdf or /home/user/documents/file.pdf"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Specify the path to a file on your local drive or shared network location
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p>Your submission will be sent for approval to the authorized personnel.</p>
                </div>
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.reset()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {mutation.isPending ? "Submitting..." : "Submit for Approval"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
