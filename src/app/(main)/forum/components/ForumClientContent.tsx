
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Poll } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ListChecks } from 'lucide-react';
import { adminGetAllMessagesAction } from '@/lib/actions'; // Changed to adminGetAllMessagesAction
import { useToast } from '@/hooks/use-toast';

interface ForumClientContentProps {
  initialNickname: string;
  initialMessages: Message[]; // This will now receive ALL messages
  initialPolls: Poll[];
}

export default function ForumClientContent({ 
  initialNickname, 
  initialMessages: allInitialMessages, // Renamed for clarity
  initialPolls 
}: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>(() => allInitialMessages.filter(msg => !msg.parentId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const { toast } = useToast();
  const prevAllMessagesRef = useRef<Message[]>(allInitialMessages);
  const isInitialPollRef = useRef(true);
  
  useEffect(() => {
    setMessages(allInitialMessages.filter(msg => !msg.parentId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    prevAllMessagesRef.current = allInitialMessages; // Initialize ref with all messages
  }, [allInitialMessages]);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  const pollAndNotify = useCallback(async () => {
    try {
      const allCurrentMessages = await adminGetAllMessagesAction(); // Fetches all messages
      const latestTopLevelMessagesForDisplay = allCurrentMessages
        .filter(msg => !msg.parentId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (isInitialPollRef.current) {
        isInitialPollRef.current = false;
      } else {
        // 1. Detect new top-level messages
        const prevTopLevelIds = new Set(prevAllMessagesRef.current.filter(m => !m.parentId).map(m => m.id));
        const newTopLevelMessagesFound = latestTopLevelMessagesForDisplay.filter(
          (newMessage) => !prevTopLevelIds.has(newMessage.id)
        );

        newTopLevelMessagesFound.forEach(msg => {
          toast({
            title: `Nuevo Mensaje`,
            description: `"${msg.content.substring(0, 30)}..." por ${msg.nickname}`,
            duration: 5000,
          });
        });

        // 2. Detect new replies to existing top-level messages
        const prevMessageMap = new Map(prevAllMessagesRef.current.map(m => [m.id, m]));
        latestTopLevelMessagesForDisplay.forEach(currentMsg => {
          const prevMsg = prevMessageMap.get(currentMsg.id);
          if (prevMsg && (currentMsg.replyCount || 0) > (prevMsg.replyCount || 0)) {
            const newReplyCountDiff = (currentMsg.replyCount || 0) - (prevMsg.replyCount || 0);
            toast({
              title: `Nueva Respuesta`,
              description: `${newReplyCountDiff} nueva(s) respuesta(s) en "${currentMsg.content.substring(0, 30)}..."`,
              duration: 5000,
            });
          }
        });
      }
      
      setMessages(latestTopLevelMessagesForDisplay);
      prevAllMessagesRef.current = allCurrentMessages; // Store all for next comparison

    } catch (error) {
      console.error("Error polling messages for notification:", error);
    }
  }, [toast]);

  useEffect(() => {
    // Initial poll call is handled by the first state setting or useEffect for allInitialMessages
    // This interval starts after the initial setup.
    const intervalId = setInterval(pollAndNotify, 10000); 
    return () => clearInterval(intervalId);
  }, [pollAndNotify]);

  const handleNewTopLevelMessageCommitted = (newMessage: Message) => {
    if (!newMessage.parentId) {
      const updatedDisplayMessages = [newMessage, ...messages.filter(msg => msg.id !== newMessage.id)];
      setMessages(updatedDisplayMessages);
      
      // Update ref for all messages
      prevAllMessagesRef.current = [newMessage, ...prevAllMessagesRef.current.filter(msg => msg.id !== newMessage.id)]
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      toast({
        title: "Mensaje Enviado",
        description: "Tu mensaje ha sido publicado.",
      });
    }
  };
  
  const handleMessageItemUpdated = (updatedMessage: Message) => {
    // This is called when a message's properties (like replyCount) are updated by a child (e.g., current user posted a reply)
    setMessages(prevDisplayMessages => 
      prevDisplayMessages.map(msg => {
        if (msg.id === updatedMessage.id) {
          return updatedMessage; // Update the top-level message in display
        }
        return msg;
      })
    );
    // Also update the prevAllMessagesRef for accurate comparison in the next poll
    prevAllMessagesRef.current = prevAllMessagesRef.current.map(msg =>
      msg.id === updatedMessage.id ? updatedMessage : msg
    );
  };

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
