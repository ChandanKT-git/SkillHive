import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '../contexts/auth-context';
import { 
  getSkillPostById,
  getUserProfile,
  updateSessionStatus,
  submitReview 
} from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { loadJitsiScript, initJitsiMeet } from '../lib/jitsi';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import AvatarImage from '@/components/ui/avatar-image';
import {
  Star,
  MessageSquare,
  Video,
  Clock,
  Calendar,
  ArrowLeft,
  Loader2,
  VideoOff,
  Check
} from 'lucide-react';
import { format } from 'date-fns';

// Review form schema
const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, {
    message: "Comment must be at least 10 characters.",
  }),
});

const Session = () => {
  const [, params] = useRoute('/session/:id');
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [session, setSession] = useState(null);
  const [skillPost, setSkillPost] = useState(null);
  const [mentor, setMentor] = useState(null);
  const [learner, setLearner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isInSession, setIsInSession] = useState(false);
  const [jitsiStarted, setJitsiStarted] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  
  const jitsiContainerRef = useRef(null);
  const jitsiApiRef = useRef(null);
  
  const form = useForm({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!params?.id || !user) {
        navigate('/');
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Fetch session data
        const sessionDoc = await getDoc(doc(db, "sessions", params.id));
        if (!sessionDoc.exists()) {
          setError("Session not found");
          return;
        }
        
        const sessionData = sessionDoc.data();
        setSession({
          id: sessionDoc.id,
          ...sessionData,
          createdAt: sessionData.createdAt?.toDate(),
          updatedAt: sessionData.updatedAt?.toDate(),
          scheduledDate: sessionData.scheduledDate?.toDate(),
        });
        
        // Check if user is part of this session
        if (sessionData.mentorId !== user.uid && sessionData.learnerId !== user.uid) {
          setError("You don't have access to this session");
          return;
        }
        
        // Fetch skill post data
        if (sessionData.skillPostId) {
          const skillData = await getSkillPostById(sessionData.skillPostId);
          setSkillPost(skillData);
        }
        
        // Fetch mentor data
        const mentorData = await getUserProfile(sessionData.mentorId);
        setMentor(mentorData);
        
        // Fetch learner data
        const learnerData = await getUserProfile(sessionData.learnerId);
        setLearner(learnerData);
        
        // Load Jitsi script if this is a confirmed session
        if (sessionData.status === 'confirmed' && sessionData.jitsiLink) {
          await loadJitsiScript();
        }
      } catch (error) {
        console.error("Error fetching session:", error);
        setError(error.message);
        toast({
          title: "Error loading session",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
    
    // Cleanup Jitsi API on unmount
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
      }
    };
  }, [params, user, navigate, toast]);

  const startJitsiMeeting = () => {
    if (!jitsiContainerRef.current) return;
    
    try {
      const domain = 'meet.jit.si';
      const options = {
        roomName: `skillswap-${session.id}`,
        width: '100%',
        height: 500,
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: user.displayName || 'User',
          email: user.email,
        },
      };
      
      jitsiApiRef.current = new window.JitsiMeetExternalAPI(domain, options);
      
      // Set up event handlers
      jitsiApiRef.current.addEventListeners({
        videoConferenceJoined: () => {
          setJitsiStarted(true);
          toast({
            title: "Joined session",
            description: "You have successfully joined the video call",
          });
          
          // If session was pending and is now confirmed, update status
          if (session.status === 'pending') {
            handleUpdateSessionStatus('confirmed');
          }
        },
        videoConferenceLeft: () => {
          setJitsiStarted(false);
        },
        readyToClose: () => {
          if (jitsiApiRef.current) {
            jitsiApiRef.current.dispose();
            jitsiApiRef.current = null;
          }
          setIsInSession(false);
          setJitsiStarted(false);
          
          // Check if session is finished
          if (session.status === 'confirmed') {
            // Ask if user wants to mark session as completed
            // We'll use a simple confirm for this example
            if (window.confirm('Do you want to mark this session as completed?')) {
              handleUpdateSessionStatus('completed');
              
              // If user is learner, show review dialog
              if (user.uid === session.learnerId) {
                setShowReviewDialog(true);
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error starting Jitsi meeting:', error);
      toast({
        title: "Error starting video call",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleJoinSession = async () => {
    setIsInSession(true);
    
    // If Jitsi script is loaded, start meeting
    if (window.JitsiMeetExternalAPI) {
      startJitsiMeeting();
    } else {
      // Load Jitsi script and then start meeting
      try {
        await loadJitsiScript();
        startJitsiMeeting();
      } catch (error) {
        console.error('Error loading Jitsi script:', error);
        toast({
          title: "Error loading video call system",
          description: error.message,
          variant: "destructive"
        });
        setIsInSession(false);
      }
    }
  };

  const handleUpdateSessionStatus = async (newStatus) => {
    try {
      await updateSessionStatus(session.id, newStatus);
      setSession({ ...session, status: newStatus });
      
      toast({
        title: `Session ${newStatus}`,
        description: `The session has been marked as ${newStatus}`,
      });
    } catch (error) {
      console.error(`Error updating session status to ${newStatus}:`, error);
      toast({
        title: "Error updating session",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const onSubmitReview = async (data) => {
    try {
      await submitReview(session.id, data.rating, data.comment);
      
      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });
      
      setShowReviewDialog(false);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[60vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>We encountered a problem</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!session || !mentor || !learner) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400">
              The session you're looking for doesn't exist or you don't have permission to view it.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const isLearner = user.uid === session.learnerId;
  const otherParticipant = isLearner ? mentor : learner;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4"
        onClick={() => navigate('/dashboard')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{skillPost?.title || session.skillPostTitle || 'Learning Session'}</CardTitle>
                  <CardDescription>
                    {session.status === 'confirmed'
                      ? 'This session is confirmed and ready to begin'
                      : session.status === 'completed'
                      ? 'This session has been completed'
                      : session.status === 'pending'
                      ? 'This session is pending confirmation'
                      : 'This session has been cancelled'
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    session.status === 'confirmed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                      : session.status === 'completed'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : session.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                  }`}>
                    {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {/* Jitsi container */}
              {isInSession ? (
                <div>
                  <div 
                    ref={jitsiContainerRef} 
                    id="jitsi-container" 
                    className="w-full h-[500px] bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden"
                  >
                    {!jitsiStarted && (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
                        <p>Setting up your video call...</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button 
                      variant="outline" 
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (jitsiApiRef.current) {
                          jitsiApiRef.current.executeCommand('hangup');
                        }
                        setIsInSession(false);
                      }}
                    >
                      End Call
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {session.status === 'confirmed' && (
                    <div className="py-10 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                      <Video className="h-14 w-14 text-primary-500 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Ready to start your session</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                        When you join, you'll connect via video call with {otherParticipant.displayName || 'your learning partner'}.
                      </p>
                      <Button size="lg" onClick={handleJoinSession}>
                        Join Video Session
                      </Button>
                    </div>
                  )}
                  
                  {session.status === 'pending' && (
                    <div className="py-10 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                      <Clock className="h-14 w-14 text-yellow-500 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        {isLearner ? 'Waiting for mentor confirmation' : 'Session request pending'}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                        {isLearner 
                          ? `${otherParticipant.displayName || 'The mentor'} needs to confirm this session request.`
                          : 'You need to confirm this session to proceed.'
                        }
                      </p>
                      {!isLearner && (
                        <div className="flex space-x-3">
                          <Button onClick={() => handleUpdateSessionStatus('confirmed')}>
                            <Check className="mr-2 h-4 w-4" />
                            Confirm Session
                          </Button>
                          <Button 
                            variant="outline"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleUpdateSessionStatus('cancelled')}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {session.status === 'completed' && (
                    <div className="py-10 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                      <Check className="h-14 w-14 text-green-500 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Session Completed</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                        This session has been completed successfully.
                      </p>
                      {isLearner && !session.reviewed && (
                        <Button onClick={() => setShowReviewDialog(true)}>
                          <Star className="mr-2 h-4 w-4" />
                          Leave Review
                        </Button>
                      )}
                      {session.reviewed && isLearner && (
                        <p className="text-green-600 dark:text-green-400 flex items-center">
                          <Check className="mr-1 h-4 w-4" />
                          Review submitted
                        </p>
                      )}
                    </div>
                  )}
                  
                  {session.status === 'cancelled' && (
                    <div className="py-10 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg mb-4">
                      <VideoOff className="h-14 w-14 text-red-500 mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Session Cancelled</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6 text-center max-w-md">
                        This session has been cancelled.
                      </p>
                      <Button variant="outline" onClick={() => navigate('/explore')}>
                        Find Other Sessions
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Session Message */}
          {session.message && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Session Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 italic">
                  "{session.message}"
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Skill Post Details (if available) */}
          {skillPost && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About This Skill</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {skillPost.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {skillPost.tags && skillPost.tags.map((tag, idx) => (
                    <span key={idx} className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div>
          {/* Session Info Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Session Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-200">Date & Time</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {session.scheduledDate 
                      ? format(new Date(session.scheduledDate), 'EEEE, MMMM d, yyyy')
                      : format(new Date(session.createdAt), 'EEEE, MMMM d, yyyy')}
                    <br />
                    {session.startTime 
                      ? `${format(new Date(session.startTime), 'h:mm a')} - ${format(new Date(session.endTime), 'h:mm a')}`
                      : 'Time not specified'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-700 dark:text-gray-200">Session Length</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {skillPost?.sessionLength || '60'} minutes
                  </p>
                </div>
              </div>
              
              <Separator />
              
              {/* Mentor info */}
              <div className="pt-2">
                <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-3">
                  {isLearner ? 'Your Mentor' : 'Learner'}
                </h4>
                <div className="flex items-center">
                  <AvatarImage
                    src={otherParticipant.photoURL}
                    alt={otherParticipant.displayName || 'User'}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {otherParticipant.displayName || 'User'}
                    </p>
                    {isLearner && mentor.rating > 0 && (
                      <div className="flex items-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {mentor.rating.toFixed(1)} ({mentor.reviewCount || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Message button */}
              {session.status !== 'cancelled' && (
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => navigate('/messages')}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message
                </Button>
              )}
            </CardContent>
          </Card>
          
          {/* Support/Help Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Having technical issues or questions about your session?
              </p>
              <Button variant="outline" className="w-full" onClick={() => window.open('/help', '_blank')}>
                Visit Help Center
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Leave a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {mentor.displayName || 'your mentor'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitReview)} className="space-y-6">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rating</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => field.onChange(star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= field.value
                                  ? "text-yellow-500 fill-yellow-500"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Review</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Share details of your experience with this mentor..."
                        className="resize-none h-32"
                      />
                    </FormControl>
                    <FormDescription>
                      Your honest feedback helps improve the community.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Submit Review
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Session;
