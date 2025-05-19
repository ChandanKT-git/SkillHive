import React, { useState, useEffect } from 'react';
import { 
  toggleBookmark, 
  getUserBookmarks 
} from '../lib/firebase';
import { getSkillPosts, getSkillPostById } from '../lib/api';
import { useAuth } from '../contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Search } from 'lucide-react';
import SkillPostCard from '@/components/explore/skill-post-card';
import CategoryCard from '@/components/explore/category-card';
import MentorCard from '@/components/dashboard/mentor-card';
import SessionModal from '@/components/modals/session-modal';
import ProfileModal from '@/components/modals/profile-modal';

const Explore = () => {
  const auth = useAuth() || {};
  const user = auth.user;
  const toastHook = useToast() || {};
  const toast = toastHook.toast || (() => {});
  const [loading, setLoading] = useState(true);
  const [trendingSkills, setTrendingSkills] = useState([]);
  const [recentSkills, setRecentSkills] = useState([]);
  const [bookmarkedSkills, setBookmarkedSkills] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [activeTab, setActiveTab] = useState('trending');

  // Categories data
  const categories = [
    {
      name: 'Technology',
      icon: <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>,
      mentorCount: 132,
      color: 'blue'
    },
    {
      name: 'Design',
      icon: <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>,
      mentorCount: 89,
      color: 'purple'
    },
    {
      name: 'Business',
      icon: <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>,
      mentorCount: 64,
      color: 'yellow'
    },
    {
      name: 'Languages',
      icon: <svg className="h-6 w-6 text-green-600 dark:text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>,
      mentorCount: 117,
      color: 'green'
    },
    {
      name: 'Music',
      icon: <svg className="h-6 w-6 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>,
      mentorCount: 78,
      color: 'red'
    },
    {
      name: 'Lifestyle',
      icon: <svg className="h-6 w-6 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>,
      mentorCount: 55,
      color: 'teal'
    }
  ];

  // Top mentors data
  const topMentors = [
    {
      id: '1',
      name: 'Priya Sharma',
      avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e',
      skills: ['UX/UI Design'],
      rating: 4.9,
      sessionCount: 48,
      tags: ['Design', 'UI/UX']
    },
    {
      id: '2',
      name: 'David Lee',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e',
      skills: ['Data Science'],
      rating: 4.8,
      sessionCount: 36,
      tags: ['Data', 'Python']
    },
    {
      id: '3',
      name: 'Maya Patel',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      skills: ['Yoga & Meditation'],
      rating: 5.0,
      sessionCount: 52,
      tags: ['Wellness', 'Fitness']
    }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch trending skills (highest rated)
        const trendingResult = await getSkillPosts({ active: true }, null, 8);
        
        // Sort by rating
        const sortedTrending = [...trendingResult.skillPosts].sort((a, b) => b.rating - a.rating);
        setTrendingSkills(sortedTrending);
        
        // Fetch recent skills
        const recentResult = await getSkillPosts({ active: true }, null, 8);
        setRecentSkills(recentResult.skillPosts);
        
        // Fetch user bookmarks if logged in
        if (user) {
          const bookmarks = await getUserBookmarks();
          const bookmarkIds = new Set(bookmarks.map(b => b.skillPostId));
          setBookmarkedIds(bookmarkIds);
          
          // Fetch bookmarked skills
          const bookmarkedSkillsPromises = Array.from(bookmarkIds).map(id => getSkillPostById(id));
          const bookmarkedSkillsResults = await Promise.all(bookmarkedSkillsPromises.filter(p => p !== undefined));
          setBookmarkedSkills(bookmarkedSkillsResults);
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
        toast({
          title: "Error fetching skills",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
  };

  const handleCategoryClick = (category) => {
    setCategoryFilter(category.name);
    // You could also add logic to filter skills by category
  };

  const handleMentorClick = (mentor) => {
    setSelectedProfile(mentor);
  };

  const handleToggleBookmark = async (skill) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark skills",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const result = await toggleBookmark(skill.id);
      
      if (result.bookmarked) {
        // Add to bookmarks
        setBookmarkedIds(prev => new Set([...prev, skill.id]));
        setBookmarkedSkills(prev => [...prev, skill]);
        toast({
          title: "Skill bookmarked",
          description: "Successfully added to your bookmarks"
        });
      } else {
        // Remove from bookmarks
        setBookmarkedIds(prev => {
          const updated = new Set([...prev]);
          updated.delete(skill.id);
          return updated;
        });
        setBookmarkedSkills(prev => prev.filter(s => s.id !== skill.id));
        toast({
          title: "Bookmark removed",
          description: "Successfully removed from your bookmarks"
        });
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      toast({
        title: "Error updating bookmark",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRequestSession = async (skillId, message) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to request a session",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await requestSession(skillId, message);
      toast({
        title: "Session request sent",
        description: "The mentor will be notified of your request"
      });
      return true;
    } catch (error) {
      console.error("Error requesting session:", error);
      toast({
        title: "Error sending request",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    }
  };

  const renderSkillCards = (skills, isLoading) => {
    if (isLoading) {
      return Array(8).fill().map((_, index) => (
        <SkillPostCard key={index} isLoading={true} />
      ));
    }
    
    if (skills.length === 0) {
      return (
        <div className="col-span-full text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No skills found.</p>
        </div>
      );
    }
    
    return skills.map(skill => (
      <SkillPostCard
        key={skill.id}
        skillPost={skill}
        isBookmarked={bookmarkedIds.has(skill.id)}
        onClick={() => handleSkillClick(skill)}
        onBookmark={() => handleToggleBookmark(skill)}
      />
    ));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-heading">Explore Skills</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">Discover new skills from peers around the world</p>
        </div>
        
        <div className="mt-4 md:mt-0 flex space-x-3">
          <div className="w-full md:w-48">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Categories">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {user && (user.role === 'mentor' || user.role === 'both') && (
            <Button>
              <PlusCircle className="h-5 w-5 mr-2" />
              Share a Skill
            </Button>
          )}
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="search"
            placeholder="Search skills, topics, or mentors..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Popular Categories */}
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 font-heading">Popular Categories</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((category, index) => (
            <CategoryCard
              key={index}
              category={category}
              onClick={() => handleCategoryClick(category)}
            />
          ))}
        </div>
      </div>
      
      {/* Skills Tabs */}
      <div className="mb-8">
        <Tabs defaultValue="trending" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="trending">Trending Skills</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            {user && <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>}
          </TabsList>
          
          <TabsContent value="trending">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderSkillCards(trendingSkills, loading)}
            </div>
          </TabsContent>
          
          <TabsContent value="recent">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {renderSkillCards(recentSkills, loading)}
            </div>
          </TabsContent>
          
          {user && (
            <TabsContent value="bookmarked">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {renderSkillCards(bookmarkedSkills, loading)}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      {/* Top Mentors */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white font-heading">Top Mentors</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill().map((_, index) => (
              <MentorCard key={index} isLoading={true} />
            ))
          ) : (
            topMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                onClick={() => handleMentorClick(mentor)}
              />
            ))
          )}
        </div>
      </div>
      
      {/* Session Modal */}
      {selectedSkill && (
        <SessionModal
          skillPost={selectedSkill}
          isOpen={!!selectedSkill}
          onClose={() => setSelectedSkill(null)}
          onRequestSession={handleRequestSession}
        />
      )}
      
      {/* Profile Modal */}
      {selectedProfile && (
        <ProfileModal
          user={selectedProfile}
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onContactRequest={(userId) => {
            setSelectedProfile(null);
            // Find a skill post for this mentor and open session modal
            const mentorSkill = trendingSkills.find(s => s.mentorId === userId);
            if (mentorSkill) {
              setSelectedSkill(mentorSkill);
            } else {
              toast({
                title: "No skills available",
                description: "This mentor doesn't have any available skills at the moment",
                variant: "destructive"
              });
            }
          }}
        />
      )}
    </div>
  );
};

export default Explore;
