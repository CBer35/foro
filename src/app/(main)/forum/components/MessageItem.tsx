'use client';

import type { Message } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Repeat, Paperclip, Download } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { repostMessageAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface MessageItemProps {
  message: Message;
  currentNickname: string;
}

export default function MessageItem({ message, currentNickname }: MessageItemProps) {
  const { toast } = useToast();

  const handleRepost = async () => {
    // In a real app, this would likely update server state and re-fetch or use optimistic updates.
    // For now, it's a placeholder action.
    const result = await repostMessageAction(message.id);
    if (result?.success) {
      toast({ title: "Success", description: result.success });
      // Potentially update UI locally if not relying on revalidatePath
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  const getInitials = (name: string) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Card className="mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out">
      <CardHeader className="flex flex-row items-start space-x-3 pb-2">
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(message.nickname)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-semibold">{message.nickname}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.filePreview && message.fileName && (
          <div className="mt-3 p-3 border rounded-md bg-secondary/30">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{message.fileName}</span>
            </div>
            {message.fileType?.startsWith('image/') && (
              <Image 
                src={message.filePreview} 
                alt={message.fileName} 
                width={200} height={150} 
                className="rounded-md object-cover max-h-48" 
                data-ai-hint="attached image"
              />
            )}
             {/* Basic placeholder for non-image files */}
            {!message.fileType?.startsWith('image/') && message.fileType && (
               <div className="p-2 bg-muted rounded-md text-xs">
                 File type: {message.fileType} (Preview not available)
               </div>
            )}
            {/* In a real app, you might add a download button for non-image files */}
            {/* <Button variant="outline" size="sm" className="mt-2">
              <Download className="h-4 w-4 mr-2" /> Download
            </Button> */}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end pt-0">
        <Button variant="ghost" size="sm" onClick={handleRepost} aria-label="Repost message">
          <Repeat className="h-4 w-4 mr-1" /> Repost ({message.reposts})
        </Button>
      </CardFooter>
    </Card>
  );
}
