import React from 'react';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AvatarImage from '../ui/avatar-image';
import { format } from 'date-fns';

const SessionStatusBadge = ({ status }) => {
  const statusConfig = {
    confirmed: {
      color: "green",
      text: "Confirmed"
    },
    pending: {
      color: "yellow",
      text: "Pending"
    },
    completed: {
      color: "blue",
      text: "Completed"
    },
    cancelled: {
      color: "red",
      text: "Cancelled"
    }
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant="outline" className={`bg-${config.color}-100 dark:bg-${config.color}-900 text-${config.color}-800 dark:text-${config.color}-300 border-${config.color}-200 dark:border-${config.color}-800`}>
      {config.text}
    </Badge>
  );
};

const SessionCard = ({ 
  session, 
  isLearner = true,
  onJoin,
  onConfirm,
  onCancel,
  onReview,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 dark:border-gray-700 py-4 first:pt-0 last:border-0 last:pb-0">
        <div className="md:w-1/4 mb-3 md:mb-0">
          <div className="h-5 w-32 skeleton rounded mb-1"></div>
          <div className="h-4 w-24 skeleton rounded"></div>
        </div>
        <div className="md:w-2/4 mb-3 md:mb-0">
          <div className="flex items-center">
            <div className="h-10 w-10 skeleton rounded-full mr-3"></div>
            <div>
              <div className="h-5 w-40 skeleton rounded mb-1"></div>
              <div className="h-4 w-32 skeleton rounded"></div>
            </div>
          </div>
        </div>
        <div className="md:w-1/4 flex items-center justify-between md:justify-end">
          <div className="h-6 w-20 skeleton rounded-full"></div>
          <div className="ml-4 h-9 w-24 skeleton rounded"></div>
        </div>
      </div>
    );
  }

  // Format the date and time
  const sessionDate = format(new Date(session.date), 'EEEE, MMM d');
  const sessionTime = `${format(new Date(session.startTime), 'h:mm a')} - ${format(new Date(session.endTime), 'h:mm a')}`;
  
  // Determine the role label for the other participant
  const roleLabel = isLearner ? 'Mentor' : 'Learner';
  
  // Get the other participant's info
  const participant = isLearner ? session.mentor : session.learner;
  
  // Determine the button to show based on session status and user role
  const renderActionButton = () => {
    if (session.status === 'confirmed') {
      return (
        <Button onClick={() => onJoin(session)}>
          Join Session
        </Button>
      );
    } else if (session.status === 'pending' && !isLearner) {
      return (
        <Button onClick={() => onConfirm(session)}>
          Confirm
        </Button>
      );
    } else if (session.status === 'completed' && session.canReview) {
      return (
        <Button variant="outline" onClick={() => onReview(session)}>
          Leave Review
        </Button>
      );
    } else if (session.status === 'pending') {
      return (
        <Button variant="outline" onClick={() => onCancel(session)}>
          Cancel
        </Button>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 dark:border-gray-700 py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="md:w-1/4 mb-3 md:mb-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{sessionDate}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{sessionTime}</p>
      </div>
      <div className="md:w-2/4 mb-3 md:mb-0">
        <div className="flex items-center">
          <AvatarImage
            src={participant.avatar}
            alt={participant.name}
            className="mr-3"
            size="md"
          />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{session.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              With {participant.name} • <span className={isLearner ? "text-secondary-500 dark:text-secondary-400" : "text-accent-500"}>{roleLabel}</span>
            </p>
          </div>
        </div>
      </div>
      <div className="md:w-1/4 flex items-center justify-between md:justify-end">
        <SessionStatusBadge status={session.status} />
        <div className="ml-4">
          {renderActionButton()}
        </div>
      </div>
    </div>
  );
};

export default SessionCard;
