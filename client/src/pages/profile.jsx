import React, { useState, useEffect } from 'react';
import { useRoute, Link, useLocation } from 'wouter';
import { useAuth } from '../contexts/auth-context';
import { getUserProfile, updateUserProfile, getSkillPosts, getReviewsForUser } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import AvatarImage from '@/components/ui/avatar-image';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Progress 
} from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Calendar,
  MessageSquare,
  Star,
  Award,
  BookOpen,
  ThumbsUp,
  Edit,
  User,
  Mail,
  Briefcase,
  Github,
  Linkedin,
  Globe,
  ArrowLeft,
  Check,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import SkillCard from '@/components/dashboard/skill-card';

// Form validation schema
const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  bio: z.string().max(500, {
    message: "Bio must not be longer than 500 characters.",
  }),
  role: z.enum(["learner", "mentor", "both"], {
    message: "Please select a valid role.",
  }),
  expertise: z.array(z.string()).optional(),
  website: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  github: z.string().optional(),
  linkedin: z.string().optional(),
  location: z.string().optional(),
});

const Profile = () => {
  const [, params] = useRoute('/profile/:id?');
  const [, navigate] = useLocation();
  const auth = useAuth() || {};
  const user = auth.user;
  const toastHook = useToast() || {};
  const toast = toastHook.toast || (() => {});
  const [profileUser, setProfileUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userSkills, setUserSkills] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      role: "learner",
      expertise: [],
      website: "",
      github: "",
      linkedin: "",
      location: "",
    }
  });

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setIsLoading(true);
        
        // Determine whose profile to load
        const profileId = params?.id || user?.uid;
        
        if (!profileId) {
          // No profile ID and no logged in user
          navigate('/');
          return;
        }
        
        // Check if viewing own profile
        const isOwn = profileId === user?.uid;
        setIsCurrentUser(isOwn);
        
        // Fetch user profile
        const userProfile = await getUserProfile(profileId);
        
        if (!userProfile) {
          toast({
            title: "Profile not found",
            description: "The user profile you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/');
          return;
        }
        
        setProfileUser(userProfile);
        
        // Load form with user data if it's the current user
        if (isOwn) {
          form.reset({
            displayName: userProfile.displayName || "",
            bio: userProfile.bio || "",
            role: userProfile.role || "learner",
            expertise: userProfile.expertise || [],
            website: userProfile.website || "",
            github: userProfile.github || "",
            linkedin: userProfile.linkedin || "",
            location: userProfile.location || "",
          });
        }
        
        // Fetch user's skills if they are a mentor
        if (userProfile.role === 'mentor' || userProfile.role === 'both') {
          const userSkillsData = await getSkillPosts({ mentorId: profileId, active: true });
          setUserSkills(userSkillsData.skillPosts);
        }
        
        // Fetch user's reviews if they are a mentor
        if (userProfile.role === 'mentor' || userProfile.role === 'both') {
          const userReviewsData = await getReviewsForUser(profileId);
          setReviews(userReviewsData.reviews);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast({
          title: "Error loading profile",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [params, user, navigate, toast, form]);

  const onSubmit = async (data) => {
    try {
      await updateUserProfile(user.uid, data);
      
      setProfileUser(prev => ({
        ...prev,
        ...data
      }));
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
      
      setEditModalOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Calculate rating breakdown percentages
  const calculateRatingBreakdown = () => {
    if (!reviews || reviews.length === 0) return {};
    
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const total = reviews.length;
    
    reviews.forEach(review => {
      const rating = Math.round(review.rating);
      breakdown[rating] = (breakdown[rating] || 0) + 1;
    });
    
    // Convert to percentages
    Object.keys(breakdown).forEach(key => {
      breakdown[key] = Math.round((breakdown[key] / total) * 100);
    });
    
    return breakdown;
  };

  const ratingBreakdown = calculateRatingBreakdown();
  
  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The user profile you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4"
        onClick={() => window.history.back()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      {/* Profile Header Card */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              <AvatarImage
                src={profileUser.photoURL}
                alt={profileUser.displayName}
                size="xl"
                className="mt-2"
              />
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                <div>
                  <h1 className="text-2xl font-bold">{profileUser.displayName}</h1>
                  
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 my-2">
                    {profileUser.role === 'mentor' || profileUser.role === 'both' ? (
                      <Badge className="bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300">
                        Mentor
                      </Badge>
                    ) : null}
                    
                    {profileUser.role === 'learner' || profileUser.role === 'both' ? (
                      <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                        Learner
                      </Badge>
                    ) : null}
                    
                    {profileUser.reviewCount > 0 && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        <span>{profileUser.rating?.toFixed(1) || averageRating.toFixed(1)}</span>
                        <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                          ({profileUser.reviewCount || reviews.length})
                        </span>
                      </div>
                    )}
                    
                    {profileUser.location && (
                      <Badge variant="outline" className="text-gray-600 dark:text-gray-400">
                        {profileUser.location}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {isCurrentUser && (
                  <Button 
                    variant="outline"
                    className="mt-4 md:mt-0 self-center md:self-start"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-prose">
                {profileUser.bio || "No bio provided."}
              </p>
              
              {/* Social links */}
              {(profileUser.website || profileUser.github || profileUser.linkedin) && (
                <div className="flex items-center justify-center md:justify-start space-x-4 mt-4">
                  {profileUser.website && (
                    <a 
                      href={profileUser.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <Globe className="h-5 w-5" />
                    </a>
                  )}
                  
                  {profileUser.github && (
                    <a 
                      href={`https://github.com/${profileUser.github}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <Github className="h-5 w-5" />
                    </a>
                  )}
                  
                  {profileUser.linkedin && (
                    <a 
                      href={`https://linkedin.com/in/${profileUser.linkedin}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary-500 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                    >
                      <Linkedin className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Profile Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="mb-6">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          {isCurrentUser && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>
        
        {/* About Tab */}
        <TabsContent value="about" className="space-y-8">
          {/* Expertise */}
          {profileUser.expertise && profileUser.expertise.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profileUser.expertise.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-sm">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <Calendar className="h-6 w-6 text-primary-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profileUser.sessionsCompleted || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <Award className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profileUser.xp || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">XP Earned</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <BookOpen className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{userSkills.length || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Skills Offered</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <ThumbsUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{profileUser.skillsLearned || 0}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Skills Learned</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Contact/Actions */}
          {!isCurrentUser && (
            <Card>
              <CardHeader>
                <CardTitle>Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
                  {(profileUser.role === 'mentor' || profileUser.role === 'both') && (
                    <Button>
                      <Calendar className="mr-2 h-4 w-4" />
                      Request Session
                    </Button>
                  )}
                  
                  <Button variant="outline">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-6">
          {(profileUser.role === 'mentor' || profileUser.role === 'both') ? (
            userSkills.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {userSkills.map(skill => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isOwnSkill={isCurrentUser}
                    onToggleActive={() => {}} // This would be handled if on own profile
                    onEdit={() => {}} // This would be handled if on own profile
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <BookOpen className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No skills offered yet</h3>
                  {isCurrentUser ? (
                    <>
                      <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Share your expertise by creating a skill post.
                      </p>
                      <Button>
                        Create Skill Post
                      </Button>
                    </>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      This user hasn't created any skill posts yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Learner Profile</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {isCurrentUser 
                    ? "Update your profile to become a mentor and share your skills." 
                    : "This user is currently only learning, not teaching."}
                </p>
                {isCurrentUser && (
                  <Button 
                    onClick={() => setEditModalOpen(true)} 
                    className="mt-4"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Update Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6">
          {(profileUser.role === 'mentor' || profileUser.role === 'both') ? (
            <Card>
              <CardHeader>
                <CardTitle>Reviews</CardTitle>
                {reviews.length > 0 && (
                  <CardDescription>
                    Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <>
                    <div className="flex items-center mb-6">
                      <div className="flex items-center mr-6">
                        <Star className="h-10 w-10 text-yellow-500 mr-2" />
                        <span className="text-4xl font-bold">
                          {averageRating.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex-1 max-w-md">
                        <div className="space-y-1">
                          {[5, 4, 3, 2, 1].map((rating) => {
                            const percentage = ratingBreakdown[rating] || 0;
                            return (
                              <div key={rating} className="flex items-center">
                                <span className="text-xs w-6">{rating}</span>
                                <Progress value={percentage} className="h-2 mx-2 flex-1" />
                                <span className="text-xs w-8">{percentage}%</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 max-w-2xl">
                      {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center">
                              <AvatarImage
                                src={review.learnerAvatar}
                                alt={review.learnerName || 'Anonymous'}
                                size="sm"
                                className="mr-2"
                                fallback={review.learnerName?.charAt(0) || 'A'}
                              />
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {review.learnerName || 'Anonymous'}
                                </p>
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} 
                                    />
                                  ))}
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                    {new Date(review.createdAt?.toDate()).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Star className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No reviews yet</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {isCurrentUser 
                        ? "Complete more sessions to receive reviews from learners." 
                        : "This user hasn't received any reviews yet."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <User className="h-10 w-10 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Learner Profile</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Reviews are only available for mentor profiles.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Settings Tab (only for current user) */}
        {isCurrentUser && (
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Email</h3>
                    <p className="text-gray-500 dark:text-gray-400">{profileUser.email}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Account Type</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {profileUser.role === 'both' 
                        ? 'Mentor & Learner' 
                        : profileUser.role === 'mentor' 
                          ? 'Mentor' 
                          : 'Learner'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    Account Created
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {profileUser.createdAt?.toDate 
                      ? new Date(profileUser.createdAt.toDate()).toLocaleDateString() 
                      : 'Unknown date'}
                  </p>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <Button 
                    onClick={() => setEditModalOpen(true)}
                    className="mr-3"
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                  
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Change Email
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-500">Danger Zone</CardTitle>
                <CardDescription>
                  Irreversible and destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      
      {/* Edit Profile Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information and preferences
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Tell others about yourself..."
                        className="resize-none h-24"
                      />
                    </FormControl>
                    <FormDescription>
                      Briefly describe yourself, your interests, and what you're looking to learn or teach.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I want to join as</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="learner">Learner</SelectItem>
                        <SelectItem value="mentor">Mentor</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose whether you want to learn, teach, or both.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Globe className="mr-2 h-4 w-4 mt-3 text-gray-500" />
                          <Input {...field} placeholder="https://yourwebsite.com" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Briefcase className="mr-2 h-4 w-4 mt-3 text-gray-500" />
                          <Input {...field} placeholder="City, Country" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="github"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GitHub</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Github className="mr-2 h-4 w-4 mt-3 text-gray-500" />
                          <Input {...field} placeholder="username" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <Linkedin className="mr-2 h-4 w-4 mt-3 text-gray-500" />
                          <Input {...field} placeholder="username" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="submit" className="mr-2">
                  <Check className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
                <Button variant="outline" type="button" onClick={() => setEditModalOpen(false)}>
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
