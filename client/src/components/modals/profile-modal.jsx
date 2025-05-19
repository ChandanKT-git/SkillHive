import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'wouter';
import { 
  Star, 
  MessageSquare, 
  Calendar, 
  Award, 
  BookOpen, 
  ThumbsUp
} from 'lucide-react';
import AvatarImage from '../ui/avatar-image';
import SkillCard from '../dashboard/skill-card';

const UserBadge = ({ name, icon, level = 1 }) => (
  <div className="flex flex-col items-center space-y-1 p-2">
    <div className="bg-primary-100 dark:bg-primary-900 rounded-full p-2">
      {icon}
    </div>
    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{name}</span>
    <span className="text-xs text-gray-500 dark:text-gray-400">Level {level}</span>
  </div>
);

const ReviewItem = ({ review }) => (
  <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
    <div className="flex justify-between items-start mb-2">
      <div className="flex items-center">
        <AvatarImage
          src={review.user.avatar}
          alt={review.user.name}
          size="sm"
          className="mr-2"
        />
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{review.user.name}</p>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} 
              />
            ))}
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {new Date(review.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </div>
    <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
  </div>
);

const ProfileModal = ({ 
  user, 
  isOpen, 
  onClose, 
  onContactRequest 
}) => {
  const [activeTab, setActiveTab] = useState('about');
  
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            <AvatarImage
              src={user.avatar}
              alt={user.name}
              size="xl"
            />
            <div className="text-center sm:text-left">
              <DialogTitle className="text-xl">{user.name}</DialogTitle>
              <DialogDescription>
                <div className="flex flex-wrap items-center justify-center sm:justify-start mt-1 space-x-2">
                  {user.role === 'mentor' || user.role === 'both' ? (
                    <Badge className="bg-secondary-100 text-secondary-800 dark:bg-secondary-900 dark:text-secondary-300">
                      Mentor
                    </Badge>
                  ) : null}
                  {user.role === 'learner' || user.role === 'both' ? (
                    <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300">
                      Learner
                    </Badge>
                  ) : null}
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{user.rating.toFixed(1)}</span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm ml-1">
                      ({user.reviewCount} reviews)
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-gray-600 dark:text-gray-400">{user.bio}</p>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>
          
          <TabsContent value="about" className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {user.expertise.map((skill, idx) => (
                  <Badge key={idx} variant="outline" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Experience Level</h3>
              <div className="space-y-3">
                {user.experienceLevels.map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{item.skill}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{item.level}</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Achievements</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {user.badges.map((badge, idx) => (
                  <UserBadge 
                    key={idx} 
                    name={badge.name} 
                    icon={badge.icon} 
                    level={badge.level} 
                  />
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Stats</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <Calendar className="h-6 w-6 text-primary-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{user.stats.sessionCount}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sessions</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <Award className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{user.stats.xp}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">XP Earned</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <BookOpen className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{user.stats.skillsTaught}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Skills Taught</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-center">
                  <ThumbsUp className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{user.stats.skillsLearned}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Skills Learned</p>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-4">
            {user.skills.length > 0 ? (
              user.skills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No skills offered at the moment.
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="reviews" className="space-y-4">
            {user.reviews.length > 0 ? (
              <>
                <div className="flex items-center mb-4">
                  <div className="flex items-center mr-4">
                    <Star className="h-8 w-8 text-yellow-500 mr-2" />
                    <span className="text-3xl font-bold">{user.rating.toFixed(1)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="space-y-1">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const percentage = user.ratingBreakdown[rating] || 0;
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
                <div className="space-y-4">
                  {user.reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No reviews yet.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {(user.role === 'mentor' || user.role === 'both') && (
            <Button onClick={() => onContactRequest(user.id)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              Request Session
            </Button>
          )}
          <Link href={`/profile/${user.id}`}>
            <Button variant="secondary" onClick={onClose}>
              View Full Profile
            </Button>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
