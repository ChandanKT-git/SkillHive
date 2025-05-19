import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/auth-context';
import { 
  getUserSessions,
  getSkillPosts,
  updateSkillPost,
  getUserProfile,
  updateSessionStatus 
} from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { 
  Monitor, 
  Award, 
  GraduationCap, 
  User, 
  Rocket, 
  Trophy, 
  Star, 
  Calendar, 
  MessageSquare, 
  CalendarCheck 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatsCard from '@/components/dashboard/stats-card';
import ProgressTracker from '@/components/dashboard/progress-tracker';
import SkillCard from '@/components/dashboard/skill-card';
import SessionCard from '@/components/dashboard/session-card';
import MentorCard from '@/components/dashboard/mentor-card';
import { generateMeetingUrl } from '../lib/jitsi';

const Dashboard = () => {
  const auth = useAuth() || {};
  const user = auth.user;
  const toastHook = useToast() || {};
  const toast = toastHook.toast || (() => {});
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [recommendedSkills, setRecommendedSkills] = useState([]);
  const [stats, setStats] = useState({
    sessionsCompleted: 0,
    xpPoints: 0,
    skillsLearned: 0,
    skillsTaught: 0
  });

  // Top mentors data
  const topMentors = [
    {
      id: '1',
      name: 'Sarah Chen',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e',
      skills: ['UX Research', 'Public Speaking'],
      rating: 4.9,
      sessionCount: 52,
      tags: ['UX', 'Communication']
    },
    {
      id: '2',
      name: 'David Wilson',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      skills: ['React', 'Node.js', 'JavaScript'],
      rating: 4.8,
      sessionCount: 47,
      tags: ['React', 'JavaScript']
    },
    {
      id: '3',
      name: 'Maya Johnson',
      avatar: 'https://images.unsplash.com/photo-1584361853901-dd1904bb7987',
      skills: ['Graphic Design', 'Illustration'],
      rating: 4.7,
      sessionCount: 39,
      tags: ['Design', 'Creative']
    }
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // Fetch user sessions
        let userSessions = [];
        if (user.role === 'both') {
          const mentorSessions = await getUserSessions('mentor');
          const learnerSessions = await getUserSessions('learner');
          userSessions = [...mentorSessions, ...learnerSessions];
        } else {
          userSessions = await getUserSessions(user.role);
        }
        
        // Sort sessions by date
        userSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Enrich session data with participant info
        const enrichedSessions = await Promise.all(userSessions.map(async (session) => {
          const isLearner = session.learnerId === user.uid;
          const otherUserId = isLearner ? session.mentorId : session.learnerId;
          
          try {
            const otherUser = await getUserProfile(otherUserId);
            return {
              ...session,
              date: new Date(session.scheduleDate || session.createdAt),
              startTime: new Date(session.startTime || session.createdAt),
              endTime: new Date(session.endTime || new Date(session.createdAt).getTime() + 3600000),
              mentor: isLearner ? {
                id: otherUserId,
                name: otherUser.displayName || 'Mentor',
                avatar: otherUser.photoURL
              } : {
                id: user.uid,
                name: user.displayName || 'You',
                avatar: user.photoURL
              },
              learner: !isLearner ? {
                id: otherUserId,
                name: otherUser.displayName || 'Learner',
                avatar: otherUser.photoURL
              } : {
                id: user.uid,
                name: user.displayName || 'You',
                avatar: user.photoURL
              },
              title: session.skillPostTitle || 'Learning Session',
              canReview: isLearner && session.status === 'completed' && !session.reviewed
            };
          } catch (error) {
            console.error("Error fetching user profile:", error);
            return {
              ...session,
              date: new Date(session.scheduleDate || session.createdAt),
              startTime: new Date(session.startTime || session.createdAt),
              endTime: new Date(session.endTime || new Date(session.createdAt).getTime() + 3600000),
              mentor: isLearner ? {
                id: otherUserId,
                name: 'Mentor',
                avatar: ''
              } : {
                id: user.uid,
                name: user.displayName || 'You',
                avatar: user.photoURL
              },
              learner: !isLearner ? {
                id: otherUserId,
                name: 'Learner',
                avatar: ''
              } : {
                id: user.uid,
                name: user.displayName || 'You',
                avatar: user.photoURL
              },
              title: session.skillPostTitle || 'Learning Session',
              canReview: isLearner && session.status === 'completed' && !session.reviewed
            };
          }
        }));
        
        setSessions(enrichedSessions);

        // Fetch user's skills if they are a mentor
        if (user.role === 'mentor' || user.role === 'both') {
          const userSkillsData = await getSkillPosts({ mentorId: user.uid });
          setUserSkills(userSkillsData.skillPosts);
        }

        // Fetch recommended skills
        const recommendedData = await getSkillPosts({ active: true }, null, 3);
        setRecommendedSkills(recommendedData.skillPosts);

        // Calculate stats
        const completedSessions = enrichedSessions.filter(s => s.status === 'completed').length;
        const userProfile = await getUserProfile(user.uid);
        
        setStats({
          sessionsCompleted: completedSessions,
          xpPoints: userProfile.xp || completedSessions * 50,
          skillsLearned: new Set(enrichedSessions.filter(s => s.learnerId === user.uid).map(s => s.skillPostId)).size,
          skillsTaught: user.role === 'mentor' || user.role === 'both' ? userSkillsData?.skillPosts?.length || 0 : 0
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error loading dashboard",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, toast]);

  const handleToggleSkillActive = async (skill) => {
    try {
      await updateSkillPost(skill.id, { active: !skill.active });
      setUserSkills(prevSkills => 
        prevSkills.map(s => 
          s.id === skill.id ? { ...s, active: !s.active } : s
        )
      );
      
      toast({
        title: skill.active ? "Skill deactivated" : "Skill activated",
        description: `${skill.title} is now ${skill.active ? 'hidden from' : 'visible to'} learners`,
      });
    } catch (error) {
      console.error("Error toggling skill status:", error);
      toast({
        title: "Error updating skill",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleJoinSession = async (session) => {
    // Generate or use existing Jitsi link
    let jitsiLink = session.jitsiLink;
    
    if (!jitsiLink) {
      // Generate new Jitsi link
      jitsiLink = generateMeetingUrl(session.id);
      
      // Update session with Jitsi link
      try {
        await updateSessionStatus(session.id, session.status, jitsiLink);
      } catch (error) {
        console.error("Error updating session with Jitsi link:", error);
      }
    }
    
    // Open Jitsi link in a new tab
    window.open(jitsiLink, '_blank');
  };

  const handleConfirmSession = async (session) => {
    try {
      // Generate Jitsi link
      const jitsiLink = generateMeetingUrl(session.id);
      
      // Update session status to confirmed
      await updateSessionStatus(session.id, 'confirmed', jitsiLink);
      
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === session.id ? { ...s, status: 'confirmed', jitsiLink } : s
        )
      );
      
      toast({
        title: "Session confirmed",
        description: "The learner has been notified",
      });
    } catch (error) {
      console.error("Error confirming session:", error);
      toast({
        title: "Error confirming session",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleCancelSession = async (session) => {
    try {
      // Update session status to cancelled
      await updateSessionStatus(session.id, 'cancelled');
      
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(s => 
          s.id === session.id ? { ...s, status: 'cancelled' } : s
        )
      );
      
      toast({
        title: "Session cancelled",
        description: "The other participant has been notified",
      });
    } catch (error) {
      console.error("Error cancelling session:", error);
      toast({
        title: "Error cancelling session",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleReviewSession = (session) => {
    // Navigate to review page
    window.location.href = `/session/${session.id}/review`;
  };

  // Get upcoming sessions (confirmed or pending, with future dates)
  const upcomingSessions = sessions.filter(session => 
    (session.status === 'confirmed' || session.status === 'pending') && 
    new Date(session.date) >= new Date()
  ).sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Dashboard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Welcome back, {user?.displayName?.split(' ')[0] || 'User'}</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Sessions Completed"
          value={stats.sessionsCompleted}
          icon={{
            component: <Monitor className="h-6 w-6 text-primary-500 dark:text-primary-400" />,
            bgColor: "primary"
          }}
          trend="up"
          trendValue="+3"
          trendLabel="this month"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="XP Points"
          value={stats.xpPoints}
          icon={{
            component: <Award className="h-6 w-6 text-secondary-500 dark:text-secondary-400" />,
            bgColor: "secondary"
          }}
          trend="up"
          trendValue="+75"
          trendLabel="this week"
          isLoading={isLoading}
        />
        
        <StatsCard
          title="Skills Learned"
          value={stats.skillsLearned}
          icon={{
            component: <GraduationCap className="h-6 w-6 text-accent-500 dark:text-accent-500" />,
            bgColor: "accent"
          }}
          trendLabel="across categories"
          isLoading={isLoading}
        />
        
        {(user?.role === 'mentor' || user?.role === 'both') && (
          <StatsCard
            title="Skills Teaching"
            value={stats.skillsTaught}
            icon={{
              component: <User className="h-6 w-6 text-purple-500 dark:text-purple-400" />,
              bgColor: "purple"
            }}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* XP Level Progress */}
      <ProgressTracker
        level={{ number: Math.floor(stats.xpPoints / 200) + 1, title: "Curious Explorer" }}
        xpCurrent={stats.xpPoints % 200}
        xpNext={200}
        badges={[
          { icon: <Rocket className="ri-rocket-line text-primary-500 dark:text-primary-400 text-xs" />, title: "Quick Learner", color: "primary" },
          { icon: <Trophy className="ri-trophy-line text-secondary-500 dark:text-secondary-400 text-xs" />, title: "5 Sessions Completed", color: "secondary" },
          { icon: <Star className="ri-star-line text-yellow-500 dark:text-yellow-400 text-xs" />, title: "Top Rated Mentor", color: "yellow" }
        ]}
        nextAchievements={[
          { 
            icon: <User className="text-gray-500 dark:text-gray-400" />,
            title: "Mentor 3 more learners",
            description: "+100 XP" 
          },
          { 
            icon: <MessageSquare className="text-gray-500 dark:text-gray-400" />,
            title: "Give feedback to 5 sessions",
            description: "+50 XP" 
          },
          { 
            icon: <CalendarCheck className="text-gray-500 dark:text-gray-400" />,
            title: "Complete 3 more sessions",
            description: "+75 XP" 
          }
        ]}
        isLoading={isLoading}
      />

      {/* Upcoming Sessions Section */}
      <div className="mb-8 mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-semibold">Upcoming Sessions</h2>
          <Link href="/sessions" className="text-primary-500 dark:text-primary-400 hover:underline flex items-center text-sm font-medium">
            <span>View Calendar</span>
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700 transition-all duration-200">
          {isLoading ? (
            Array(3).fill().map((_, index) => (
              <SessionCard key={index} isLoading={true} />
            ))
          ) : upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                isLearner={session.learnerId === user?.uid}
                onJoin={handleJoinSession}
                onConfirm={handleConfirmSession}
                onCancel={handleCancelSession}
                onReview={handleReviewSession}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No upcoming sessions</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {user?.role === 'learner' ? 
                  "Start learning by browsing available skills" : 
                  "Create a skill post or check your pending sessions"
                }
              </p>
              <Link href="/explore">
                <Button>
                  {user?.role === 'learner' ? "Find Skills" : "Manage Skills"}
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Section: Recommended Skills + Your Skills */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recommended Skills to Learn */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-heading font-semibold">Recommended For You</h2>
            <Link href="/explore" className="text-primary-500 dark:text-primary-400 hover:underline flex items-center text-sm font-medium">
              <span>Browse All</span>
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </Link>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              Array(3).fill().map((_, index) => (
                <SkillCard key={index} isLoading={true} />
              ))
            ) : recommendedSkills.length > 0 ? (
              recommendedSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} onClick={() => {}} />
              ))
            ) : (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-none p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">
                  No recommended skills available. Try exploring more categories!
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Your Skills (skills you offer) */}
        {(user?.role === 'mentor' || user?.role === 'both') && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-heading font-semibold">Skills You Offer</h2>
              <Link href="/skills/new" className="text-primary-500 dark:text-primary-400 hover:underline flex items-center text-sm font-medium">
                <span>Add New Skill</span>
                <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                </svg>
              </Link>
            </div>
            
            <div className="space-y-4">
              {isLoading ? (
                Array(2).fill().map((_, index) => (
                  <SkillCard key={index} isLoading={true} isOwnSkill={true} />
                ))
              ) : userSkills.length > 0 ? (
                userSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isOwnSkill={true}
                    onToggleActive={handleToggleSkillActive}
                    onEdit={() => {}} // Handle edit logic
                  />
                ))
              ) : (
                <Link href="/skills/new">
                  <div className="bg-gray-50 dark:bg-gray-700/30 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="bg-white dark:bg-gray-800 rounded-full p-3 mb-3">
                      <svg className="h-6 w-6 text-primary-500 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                      </svg>
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white mb-1">Share Your Expertise</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create a new skill post to help others learn from you</p>
                    <Button>Create Skill Post</Button>
                  </div>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Community Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-semibold">Community Spotlight</h2>
          <Link href="/mentors" className="text-primary-500 dark:text-primary-400 hover:underline flex items-center text-sm font-medium">
            <span>View All</span>
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {isLoading ? (
            Array(3).fill().map((_, index) => (
              <MentorCard key={index} isLoading={true} />
            ))
          ) : (
            topMentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} onClick={() => {}} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
