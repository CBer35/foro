
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import PollForm from './PollForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { MessageSquare, ListChecks } from 'lucide-react';

interface ForumClientContentProps {
  initialNickname: string;
}

// Mock data fetching functions
const fetchMessages = async (): Promise<Message[]> => {
  await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay for faster refresh perception
  const storedMessages = localStorage.getItem('forumMessages');
  if (storedMessages) return JSON.parse(storedMessages).map((m: Message) => ({...m, timestamp: new Date(m.timestamp)}));
  return []; // Return empty array if nothing in localStorage
};

const fetchPolls = async (): Promise<Poll[]> => {
  await new Promise(resolve => setTimeout(resolve, 100));
  const storedPolls = localStorage.getItem('forumPolls');
  if (storedPolls) return JSON.parse(storedPolls).map((p: Poll) => ({...p, timestamp: new Date(p.timestamp)}));
  return []; // Return empty array if nothing in localStorage
};


export default function ForumClientContent({ initialNickname }: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  const loadMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    const fetchedMessages = await fetchMessages();
    fetchedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setMessages(fetchedMessages);
    setIsLoadingMessages(false);
  }, []);

  const loadPolls = useCallback(async () => {
    setIsLoadingPolls(true);
    const fetchedPolls = await fetchPolls();
    fetchedPolls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setPolls(fetchedPolls);
    setIsLoadingPolls(false);
  }, []);

  useEffect(() => {
    loadMessages();
    loadPolls();
  }, [loadMessages, loadPolls]);

  useEffect(() => {
    if (!isLoadingMessages && (messages.length > 0 || localStorage.getItem('forumMessages'))) {
        localStorage.setItem('forumMessages', JSON.stringify(messages));
    }
  }, [messages, isLoadingMessages]);

  useEffect(() => {
     if (!isLoadingPolls && (polls.length > 0 || localStorage.getItem('forumPolls'))) {
        localStorage.setItem('forumPolls', JSON.stringify(polls));
     }
  }, [polls, isLoadingPolls]);

  const handleMessageCommitted = (newMessageData: Omit<Message, 'id' | 'reposts' | 'timestamp' | 'nickname'>) => {
    const newMessage: Message = {
      ...newMessageData,
      nickname: initialNickname, // Use nickname from ForumPage props
      id: String(Date.now() + Math.random()), 
      timestamp: new Date(),
      reposts: 0,
    };
    // Optimistically update the messages state
    setMessages(prevMessages => [newMessage, ...prevMessages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    // The useEffect for 'messages' will handle saving to localStorage.
  };
  
  const handleNewPoll = (newPollData: Omit<Poll, 'id' | 'timestamp' | 'totalVotes' | 'nickname'>) => {
    const newPoll: Poll = {
      ...newPollData,
      nickname: initialNickname,
      id: String(Date.now() + Math.random()),
      timestamp: new Date(),
      totalVotes: newPollData.options.reduce((sum, opt) => sum + opt.votes, 0),
    };
    setPolls(prevPolls => [newPoll, ...prevPolls].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  };

  // Called after a repost action is successful to refresh the message list
  const onMessageReposted = () => {
    loadMessages(); 
  };

  // Called after a poll is created or voted to refresh the poll list
  const onPollInteractionSuccess = () => {
    loadPolls();
  };

  return (
    <Tabs defaultValue="messages" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="messages"><MessageSquare className="mr-2 h-5 w-5" />Messages</TabsTrigger>
        <TabsTrigger value="polls"><ListChecks className="mr-2 h-5 w-5" />Polls</TabsTrigger>
      </TabsList>
      
      <TabsContent value="messages">
        <MessageForm onMessageCommitted={handleMessageCommitted} />
        <h2 className="text-2xl font-headline mb-4">Recent Messages</h2>
        {isLoadingMessages && messages.length === 0 ? ( // Show skeleton only on initial load or if empty
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="mb-4 p-4">
              <div className="flex items-center space-x-3 mb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4" />
            </Card>
          ))
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No messages yet. Be the first to post!</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageItem key={msg.id} message={msg} currentNickname={initialNickname} onRepostSuccess={onMessageReposted} />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="polls">
        <PollForm onPollCreated={handleNewPoll} /> 
        <h2 className="text-2xl font-headline mb-4">Active Polls</h2>
        {isLoadingPolls && polls.length === 0 ? ( // Show skeleton only on initial load or if empty
          Array.from({ length: 2 }).map((_, index) => (
             <Card key={index} className="mb-6 p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))
        ) : polls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No polls available. Why not create one?</p>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <PollItem key={poll.id} poll={poll} currentNickname={initialNickname} onPollVoted={onPollInteractionSuccess} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
