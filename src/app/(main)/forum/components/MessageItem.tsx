
'use client';

import type { Message } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Repeat, Paperclip, MessageSquareReply, MessagesSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { repostMessageAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image'; // For Next.js optimized images
import Link from 'next/link';

interface MessageItemProps {
  message: Message;
  currentNickname: string;
  onMessageUpdated: (updatedMessage: Message) => void; 
}

export default function MessageItem({ message, currentNickname, onMessageUpdated }: MessageItemProps) {
  const { toast } = useToast();

  const handleRepost = async () => {
    const result = await repostMessageAction(message.id);
    if (result?.success && result.updatedMessage) {
      toast({ title: "Success", description: result.success });
      onMessageUpdated(result.updatedMessage); 
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  const handleReply = () => {
    // TODO: Implement reply functionality (e.g., open a reply form)
    console.log("Reply to message:", message.id);
    toast({ title: "Reply", description: "Reply functionality coming soon!"});
  };

  const handleViewComments = () => {
    // TODO: Implement view comments functionality (e.g., navigate to a thread view or expand inline)
    console.log("View comments for message:", message.id);
     toast({ title: "View Comments", description: "Viewing comments functionality coming soon!"});
  };


  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-start space-x-3 pb-2">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(message.nickname)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-semibold">{message.nickname || 'Anonymous'}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {/* Displaying attached file */}
        {message.fileUrl && message.fileName && (
          <div className="mt-3 p-3 border rounded-md bg-secondary/30">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{message.fileName}</span>
            </div>
            {message.fileType?.startsWith('image/') ? (
              // If filePreview (client-side data URI) exists, use it for immediate display.
              // Otherwise, use fileUrl (server-stored file).
              <Image 
                src={message.filePreview || message.fileUrl} 
                alt={message.fileName} 
                width={200} height={150} 
                className="rounded-md object-cover max-h-48"
                data-ai-hint="attached image"
              />
            ) : (
              <Link href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Download {message.fileName}
              </Link>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-0">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={handleReply} aria-label="Reply to message">
            <MessageSquareReply className="h-4 w-4 mr-1" /> Reply
          </Button>
          <Button variant="ghost" size="sm" onClick={handleViewComments} aria-label="View comments">
            <MessagesSquare className="h-4 w-4 mr-1" /> View Comments ({message.replyCount || 0})
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={handleRepost} aria-label="Repost message">
          <Repeat className="h-4 w-4 mr-1" /> Repost ({message.reposts})
        </Button>
      </CardFooter>
    </Card>
  );
}
