'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import PollForm from './PollForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { MessageSquare, ListChecks } from 'lucide-react';

interface ForumClientContentProps {
  initialNickname: string;
}

// Mock data fetching functions (replace with actual API calls if backend exists)
const fetchMessages = async (): Promise<Message[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // Return some default messages or load from localStorage for demo
  const storedMessages = localStorage.getItem('forumMessages');
  if (storedMessages) return JSON.parse(storedMessages).map((m: Message) => ({...m, timestamp: new Date(m.timestamp)}));
  return [
    { id: '1', nickname: 'Alice', content: 'Hello AnonymChat!', timestamp: new Date(Date.now() - 1000 * 60 * 5), reposts: 2, filePreview: 'https://placehold.co/200x150.png', fileName: 'landscape.png', fileType: 'image/png' },
    { id: '2', nickname: 'Bob', content: 'This is a cool anonymous forum.', timestamp: new Date(Date.now() - 1000 * 60 * 2), reposts: 0 },
  ];
};

const fetchPolls = async (): Promise<Poll[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  const storedPolls = localStorage.getItem('forumPolls');
  if (storedPolls) return JSON.parse(storedPolls).map((p: Poll) => ({...p, timestamp: new Date(p.timestamp)}));
  return [
    { id: 'p1', nickname: 'Charlie', question: 'Favorite Season?', options: [{id: 'o1', text: 'Spring', votes: 5}, {id: 'o2', text: 'Summer', votes: 10}, {id: 'o3', text: 'Autumn', votes: 7}, {id: 'o4', text: 'Winter', votes: 3}], timestamp: new Date(Date.now() - 1000 * 60 * 10), totalVotes: 25 },
  ];
};


export default function ForumClientContent({ initialNickname }: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingPolls, setIsLoadingPolls] = useState(true);

  const loadMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    const fetchedMessages = await fetchMessages(); // In a real app, this would pass nickname for context
    // Sort messages by timestamp descending
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

  // Persist to localStorage for demo purposes
  useEffect(() => {
    if (messages.length > 0 || localStorage.getItem('forumMessages')) { // Avoid overwriting initial empty state with empty
        localStorage.setItem('forumMessages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
     if (polls.length > 0 || localStorage.getItem('forumPolls')) {
        localStorage.setItem('forumPolls', JSON.stringify(polls));
     }
  }, [polls]);

  const handleNewMessage = (newMessageData: Omit<Message, 'id' | 'reposts' | 'timestamp'>) => {
    const newMessage: Message = {
      ...newMessageData,
      id: String(Date.now() + Math.random()), // Simple unique ID
      timestamp: new Date(),
      reposts: 0,
    };
    setMessages(prevMessages => [newMessage, ...prevMessages]);
  };
  
  const handleNewPoll = (newPollData: Omit<Poll, 'id' | 'timestamp' | 'totalVotes'>) => {
    const newPoll: Poll = {
      ...newPollData,
      id: String(Date.now() + Math.random()),
      timestamp: new Date(),
      totalVotes: 0,
    };
    setPolls(prevPolls => [newPoll, ...prevPolls]);
  };


  // These are simplified callbacks. Server actions already handle revalidation.
  // If not using revalidatePath, or for purely client-side state updates (not recommended with server actions),
  // you would update state here. For this scaffold, revalidatePath should trigger useEffect again.
  const onMessagePostedOrReposted = () => {
    loadMessages(); // Re-fetch messages
  };

  const onPollCreatedOrVoted = () => {
    loadPolls(); // Re-fetch polls
  };

  return (
    <Tabs defaultValue="messages" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="messages"><MessageSquare className="mr-2 h-5 w-5" />Messages</TabsTrigger>
        <TabsTrigger value="polls"><ListChecks className="mr-2 h-5 w-5" />Polls</TabsTrigger>
      </TabsList>
      
      <TabsContent value="messages">
        <MessageForm onMessagePosted={onMessagePostedOrReposted} />
        <h2 className="text-2xl font-headline mb-4">Recent Messages</h2>
        {isLoadingMessages ? (
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
              <MessageItem key={msg.id} message={msg} currentNickname={initialNickname} />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="polls">
        <PollForm onPollCreated={onPollCreatedOrVoted} />
        <h2 className="text-2xl font-headline mb-4">Active Polls</h2>
        {isLoadingPolls ? (
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
              <PollItem key={poll.id} poll={poll} currentNickname={initialNickname} onPollVoted={onPollCreatedOrVoted} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
