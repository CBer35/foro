
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
// PollForm is removed for regular users
// import PollForm from './PollForm'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ListChecks } from 'lucide-react';
import { fetchLatestMessagesAction } from '@/lib/actions';

interface ForumClientContentProps {
  initialNickname: string;
  initialMessages: Message[];
  initialPolls: Poll[];
}

export default function ForumClientContent({ 
  initialNickname, 
  initialMessages, 
  initialPolls 
}: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages.filter(msg => !msg.parentId));
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  
  useEffect(() => {
    setMessages(initialMessages.filter(msg => !msg.parentId));
  }, [initialMessages]);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  const fetchAndUpdateMessages = useCallback(async () => {
    try {
      const latestTopLevelMessages = await fetchLatestMessagesAction();
      setMessages(latestTopLevelMessages);
    } catch (error) {
      console.error("Error fetching latest messages:", error);
    }
  }, []);

  useEffect(() => {
    fetchAndUpdateMessages(); 
    const intervalId = setInterval(fetchAndUpdateMessages, 10000); 
    return () => clearInterval(intervalId);
  }, [fetchAndUpdateMessages]);

  const handleNewTopLevelMessageCommitted = (newMessage: Message) => {
    if (!newMessage.parentId) {
      setMessages(prevMessages => [newMessage, ...prevMessages.filter(msg => msg.id !== newMessage.id)]);
    }
  };
  
  const handleMessageItemUpdated = (updatedMessage: Message) => {
    setMessages(prevMessages => 
      prevMessages.map(msg => {
        if (msg.id === updatedMessage.id) {
          return updatedMessage;
        }
        return msg;
      })
    );
  };

  // Poll creation is now admin-only, so this handler might not be needed here for users
  // const handlePollCreated = (newPoll: Poll) => {
  //   setPolls(prevPolls => [newPoll, ...prevPolls.filter(p => p.id !== newPoll.id)]);
  // };

  const handlePollUpdated = (updatedPoll: Poll) => {
    setPolls(prevPolls =>
      prevPolls.map(p => p.id === updatedPoll.id ? updatedPoll : p)
    );
  };

  return (
    <Tabs defaultValue="messages" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
        <TabsTrigger value="messages"><MessageSquare className="mr-2 h-5 w-5" />Messages</TabsTrigger>
        <TabsTrigger value="polls"><ListChecks className="mr-2 h-5 w-5" />Polls</TabsTrigger>
      </TabsList>
      
      <TabsContent value="messages">
        <MessageForm onMessageCommitted={handleNewTopLevelMessageCommitted} />
        <h2 className="text-2xl font-headline mb-4">Recent Messages</h2>
        {messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No messages yet. Be the first to post!</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageItem 
                key={msg.id} 
                message={msg} 
                currentNickname={initialNickname} 
                onMessageUpdated={handleMessageItemUpdated}
              />
            ))}
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="polls">
        {/* PollForm removed for regular users. Admins will create polls from the admin panel. */}
        {/* <PollForm onPollCreated={handlePollCreated} />  */}
        <h2 className="text-2xl font-headline mb-4">Active Polls</h2>
        {polls.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No polls available currently.</p>
        ) : (
          <div className="space-y-6">
            {polls.map((poll) => (
              <PollItem 
                key={poll.id} 
                poll={poll} 
                currentNickname={initialNickname} 
                onPollUpdated={handlePollUpdated} 
              />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
