import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/auth-context';
import { db, getUserProfile } from '../lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import AvatarImage from '@/components/ui/avatar-image';
import { format } from 'date-fns';
import {
  Search,
  Send,
  User,
  ArrowRight,
  PlusCircle,
  Loader2
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const messageListener = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Get user's conversations
    const fetchConversations = async () => {
      try {
        setLoading(true);
        
        // Query conversations where user is a participant
        const q = query(
          collection(db, "conversations"),
          where("participants", "array-contains", user.uid),
          orderBy("lastMessageAt", "desc")
        );
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const conversationsData = [];
          
          // Process each conversation
          const conversationPromises = snapshot.docs.map(async (doc) => {
            const conversationData = doc.data();
            
            // Get the other participant's info
            const otherParticipantId = conversationData.participants.find(id => id !== user.uid);
            let otherParticipant = null;
            
            try {
              otherParticipant = await getUserProfile(otherParticipantId);
            } catch (error) {
              console.error(`Error fetching user ${otherParticipantId}:`, error);
            }
            
            return {
              id: doc.id,
              ...conversationData,
              lastMessageAt: conversationData.lastMessageAt?.toDate(),
              otherParticipant
            };
          });
          
          const resolvedConversations = await Promise.all(conversationPromises);
          setConversations(resolvedConversations);
          
          // Set active conversation if there's at least one and none is currently selected
          if (resolvedConversations.length > 0 && !activeConversation) {
            setActiveConversation(resolvedConversations[0]);
          }
          
          setLoading(false);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error fetching conversations:", error);
        toast({
          title: "Error loading conversations",
          description: error.message,
          variant: "destructive"
        });
        setLoading(false);
      }
    };
    
    const unsubscribe = fetchConversations();
    
    return () => {
      if (unsubscribe) unsubscribe();
      if (messageListener.current) messageListener.current();
    };
  }, [user, toast]);

  useEffect(() => {
    // Listen for messages when an active conversation is selected
    if (!activeConversation) return;
    
    setIsLoadingMessages(true);
    
    try {
      // Create a query for messages in this conversation
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", activeConversation.id),
        orderBy("timestamp", "asc")
      );
      
      // Set up the listener
      messageListener.current = onSnapshot(q, (snapshot) => {
        const messagesData = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate()
          });
        });
        
        setMessages(messagesData);
        setIsLoadingMessages(false);
      });
    } catch (error) {
      console.error("Error setting up message listener:", error);
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive"
      });
      setIsLoadingMessages(false);
    }
    
    return () => {
      if (messageListener.current) {
        messageListener.current();
        messageListener.current = null;
      }
    };
  }, [activeConversation, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSelectConversation = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim()) return;
    
    try {
      if (!activeConversation) {
        throw new Error("No active conversation selected");
      }
      
      const newMessage = {
        conversationId: activeConversation.id,
        senderId: user.uid,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false
      };
      
      // Add message to Firestore
      await addDoc(collection(db, "messages"), newMessage);
      
      // Update conversation with last message
      await updateDoc(doc(db, "conversations", activeConversation.id), {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${activeConversation.otherParticipant.uid}`]: increment(1)
      });
      
      // Clear input
      setMessageText('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const filteredConversations = conversations.filter(conversation => 
    conversation.otherParticipant &&
    conversation.otherParticipant.displayName &&
    conversation.otherParticipant.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 font-heading">Messages</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Conversations List */}
        <Card className="lg:col-span-1 shadow-sm dark:shadow-none dark-shadow">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search conversations..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardHeader>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary-500 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading conversations...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <div 
                  key={conversation.id} 
                  className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer
                    ${activeConversation?.id === conversation.id ? 'bg-gray-100 dark:bg-gray-800' : ''}
                    ${conversation.unreadCount && conversation.unreadCount[user.uid] ? 'font-medium' : ''}
                  `}
                  onClick={() => handleSelectConversation(conversation)}
                >
                  <div className="flex items-center space-x-3">
                    <AvatarImage
                      src={conversation.otherParticipant?.photoURL}
                      alt={conversation.otherParticipant?.displayName || 'User'}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.otherParticipant?.displayName || 'Unknown User'}
                        </p>
                        {conversation.lastMessageAt && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {format(new Date(conversation.lastMessageAt), 'MMM d')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {conversation.lastMessage || 'No messages yet'}
                      </p>
                      {conversation.unreadCount && conversation.unreadCount[user.uid] > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-100 mt-1">
                          {conversation.unreadCount[user.uid]} new
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <User className="h-10 w-10 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No conversations yet</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                  Start chatting with mentors and learners
                </p>
                <Button size="sm">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Start New Conversation
                </Button>
              </div>
            )}
          </div>
        </Card>
        
        {/* Message Area */}
        <Card className="lg:col-span-3 shadow-sm dark:shadow-none dark-shadow flex flex-col h-[calc(100vh-200px)] min-h-[600px]">
          {activeConversation ? (
            <>
              <CardHeader className="pb-2 border-b border-gray-200 dark:border-gray-700 flex flex-row items-center space-y-0">
                <div className="flex items-center">
                  <AvatarImage
                    src={activeConversation.otherParticipant?.photoURL}
                    alt={activeConversation.otherParticipant?.displayName || 'User'}
                    size="md"
                    className="mr-3"
                  />
                  <div>
                    <CardTitle className="text-lg">
                      {activeConversation.otherParticipant?.displayName || 'User'}
                    </CardTitle>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activeConversation.otherParticipant?.role === 'mentor' 
                        ? 'Mentor' 
                        : activeConversation.otherParticipant?.role === 'learner'
                        ? 'Learner'
                        : 'Mentor & Learner'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              
              <div className="flex-1 overflow-y-auto p-4">
                {isLoadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading messages...</p>
                  </div>
                ) : messages.length > 0 ? (
                  messages.map((message, index) => {
                    const isUserMessage = message.senderId === user.uid;
                    const showAvatar = index === 0 || 
                      messages[index - 1].senderId !== message.senderId;
                    
                    return (
                      <div 
                        key={message.id} 
                        className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        {!isUserMessage && showAvatar && (
                          <AvatarImage
                            src={activeConversation.otherParticipant?.photoURL}
                            alt={activeConversation.otherParticipant?.displayName || 'User'}
                            size="sm"
                            className="mr-2 flex-shrink-0"
                          />
                        )}
                        <div className={`max-w-[70%] ${!isUserMessage && !showAvatar ? 'ml-8' : ''}`}>
                          <div 
                            className={`px-4 py-2 rounded-lg ${
                              isUserMessage 
                                ? 'bg-primary-500 text-white rounded-tr-none' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-tl-none'
                            }`}
                          >
                            {message.text}
                          </div>
                          <div 
                            className={`text-xs text-gray-500 dark:text-gray-400 mt-1 ${
                              isUserMessage ? 'text-right' : 'text-left'
                            }`}
                          >
                            {message.timestamp && format(new Date(message.timestamp), 'h:mm a')}
                          </div>
                        </div>
                        {isUserMessage && showAvatar && (
                          <AvatarImage
                            src={user.photoURL}
                            alt={user.displayName || 'You'}
                            size="sm"
                            className="ml-2 flex-shrink-0"
                          />
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <MessageSquare className="h-10 w-10 text-gray-400 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No messages yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
                      Send the first message to start the conversation
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Messages are only visible to you and {activeConversation.otherParticipant?.displayName || 'your contact'}
                    </p>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <CardContent className="pt-4 pb-4 border-t border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!messageText.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </Button>
                </form>
              </CardContent>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <MessageSquare className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Your Messages</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
                Select a conversation from the list to view your messages or start a new conversation.
              </p>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Start New Conversation
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Messages;
