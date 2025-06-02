
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Message, Poll, UserPreference } from '@/types';
import MessageItem from './MessageItem';
import MessageForm from './MessageForm';
import PollItem from './PollItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, ListChecks } from 'lucide-react';
import { adminGetAllMessagesAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';

interface ForumClientContentProps {
  initialNickname: string;
  initialMessages: Message[];
  initialPolls: Poll[];
  initialUserPreferences: UserPreference[];
}

export default function ForumClientContent({ 
  initialNickname, 
  initialMessages: allInitialMessages,
  initialPolls,
  initialUserPreferences
}: ForumClientContentProps) {
  const [messages, setMessages] = useState<Message[]>(() => allInitialMessages.filter(msg => !msg.parentId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [userPreferencesMap, setUserPreferencesMap] = useState<Map<string, UserPreference>>(
    new Map(initialUserPreferences.map(p => [p.nickname, p]))
  );
  const { toast } = useToast();
  const prevAllMessagesRef = useRef<Message[]>(allInitialMessages);
  const isInitialPollRef = useRef(true);
  
  useEffect(() => {
    setMessages(allInitialMessages.filter(msg => !msg.parentId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    prevAllMessagesRef.current = allInitialMessages;
  }, [allInitialMessages]);

  useEffect(() => {
    setPolls(initialPolls);
  }, [initialPolls]);

  useEffect(() => {
    setUserPreferencesMap(new Map(initialUserPreferences.map(p => [p.nickname, p])));
  }, [initialUserPreferences]);


  const pollAndNotify = useCallback(async () => {
    try {
      const allCurrentMessages = await adminGetAllMessagesAction(); 
      const latestTopLevelMessagesForDisplay = allCurrentMessages
        .filter(msg => !msg.parentId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      if (isInitialPollRef.current) {
        isInitialPollRef.current = false;
      } else {
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
      prevAllMessagesRef.current = allCurrentMessages;

    } catch (error) {
      console.error("Error polling messages for notification:", error);
    }
  }, [toast]);

  useEffect(() => {
    const intervalId = setInterval(pollAndNotify, 10000); 
    return () => clearInterval(intervalId);
  }, [pollAndNotify]);

  const handleNewTopLevelMessageCommitted = (newMessage: Message) => {
    if (!newMessage.parentId) {
      const updatedDisplayMessages = [newMessage, ...messages.filter(msg => msg.id !== newMessage.id)];
      setMessages(updatedDisplayMessages);
      
      prevAllMessagesRef.current = [newMessage, ...prevAllMessagesRef.current.filter(msg => msg.id !== newMessage.id)]
          .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      toast({
        title: "Mensaje Enviado",
        description: "Tu mensaje ha sido publicado.",
      });
    }
  };
  
  const handleMessageItemUpdated = (updatedMessage: Message) => {
    setMessages(prevDisplayMessages => 
      prevDisplayMessages.map(msg => {
        if (msg.id === updatedMessage.id) {
          return updatedMessage;
        }
        return msg;
      })
    );
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
            {messages.map((msg) => {
              const authorPreference = userPreferencesMap.get(msg.nickname);
              return (
                <MessageItem 
                  key={msg.id} 
                  message={msg} 
                  currentNickname={initialNickname} 
                  authorPreference={authorPreference}
                  onMessageUpdated={handleMessageItemUpdated}
                  userPreferencesMap={userPreferencesMap} // Pass the map for replies
                />
              );
            })}
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
