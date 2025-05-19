import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MessageSquare, Star, Users, Video } from 'lucide-react';
import AvatarImage from '../ui/avatar-image';
import { useAuth } from '../../contexts/auth-context';
import { format } from 'date-fns';

const SessionModal = ({ 
  skillPost, 
  isOpen, 
  onClose, 
  onRequestSession 
}) => {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  if (!skillPost) return null;

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please provide a brief message about what you want to learn",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onRequestSession(skillPost.id, message);
      toast({
        title: "Session request sent!",
        description: "You'll be notified when the mentor responds to your request."
      });
      onClose();
    } catch (error) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{skillPost.title}</DialogTitle>
          <DialogDescription className="flex items-center mt-2">
            <AvatarImage
              src={skillPost.mentor.avatar}
              alt={skillPost.mentor.name}
              size="sm"
              className="mr-2"
            />
            <span className="text-sm font-medium">{skillPost.mentor.name}</span>
            <div className="ml-2 flex items-center">
              <Star className="h-3 w-3 text-yellow-400 mr-1" />
              <span className="text-sm">{skillPost.rating.toFixed(1)}</span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              {skillPost.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {skillPost.tags.map((tag, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Availability</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {skillPost.availability.days.join(', ')}
                  <br />
                  {format(new Date(`2000-01-01T${skillPost.availability.startTime}`), 'h:mm a')} - 
                  {format(new Date(`2000-01-01T${skillPost.availability.endTime}`), 'h:mm a')}
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Session Length</h4>
                <p className="text-gray-600 dark:text-gray-400">{skillPost.sessionLength} minutes</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Users className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Experience Level</h4>
                <p className="text-gray-600 dark:text-gray-400">{skillPost.experienceLevel}</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Video className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <h4 className="font-medium text-gray-700 dark:text-gray-200">Session Format</h4>
                <p className="text-gray-600 dark:text-gray-400">Live video call via Jitsi Meet</p>
              </div>
            </div>
          </div>

          {user && user.role !== 'mentor' && (
            <div>
              <h4 className="font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center">
                <MessageSquare className="h-5 w-5 text-gray-500 mr-2" />
                Request a Session
              </h4>
              <Textarea
                placeholder="Briefly describe what you want to learn and any specific questions you have..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-24"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {user ? 
              "You can schedule a session based on mentor's availability" : 
              "Please log in to request a session"
            }
          </div>
          <div className="space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {user && user.role !== 'mentor' && (
              <Button 
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                Request Session
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionModal;
