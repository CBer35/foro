
'use client';

import type { Message, UserPreference } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Trash2, FileText, Video, Fingerprint, Palette } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { adminDeleteMessageAction } from '@/lib/actions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Image from 'next/image';
import Link from 'next/link';

interface AdminMessageItemProps {
  message: Message;
  authorPreference?: UserPreference; // Pass the author's preference
  onMessageDeleted: (messageId: string) => void;
  // onMessageUpdated is no longer needed here for badges/GIFs
}

export default function AdminMessageItem({ message, authorPreference, onMessageDeleted }: AdminMessageItemProps) {
  const { toast } = useToast();

  const handleDelete = async () => {
    const result = await adminDeleteMessageAction(message.id);
    if (result?.success) {
      toast({ title: "Success", description: result.success });
      onMessageDeleted(message.id);
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };
  
  const getBadgeStyle = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'admin': return "bg-red-600 text-white";
      case 'mod': return "bg-blue-600 text-white";
      case 'negro': return "bg-black text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const userBadges = authorPreference?.badges || [];
  const userBackgroundGif = authorPreference?.backgroundGifUrl;
  const hasBackgroundGif = !!userBackgroundGif;

  return (
    <Card 
      className={`shadow-sm relative ${message.parentId ? 'ml-6 border-l-2 border-muted pl-3' : ''}`}
      style={hasBackgroundGif ? { 
        backgroundImage: `url('${userBackgroundGif}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {}}
    >
      <CardHeader className={`flex flex-row items-start space-x-3 pb-2 ${hasBackgroundGif ? 'bg-card/80 backdrop-blur-sm p-3 rounded-t-lg m-1 mb-0' : ''}`}>
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(message.nickname)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-md font-semibold flex items-center gap-2">
            {message.nickname || 'Anonymous'}
            {userBadges.map(badge => (
              <span key={badge} className={`px-2 py-0.5 text-xs rounded-full font-medium ${getBadgeStyle(badge)}`}>
                {badge}
              </span>
            ))}
          </CardTitle>
          <CardDescription className="text-xs">
            ID: {message.id} • Posted {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            {message.parentId && <span className="italic text-muted-foreground/80"> (reply to {message.parentId})</span>}
          </CardDescription>
          <p className="text-xs text-muted-foreground">
            Reposts: {message.reposts}, Replies: {message.replyCount || 0}
          </p>
          {message.ipAddress && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Fingerprint className="h-3 w-3" /> IP: {message.ipAddress}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className={`pb-3 ${hasBackgroundGif ? 'bg-card/80 backdrop-blur-sm p-3 m-1 mt-0' : ''}`}>
        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
        
        {message.videoEmbedUrl && (
          <div className="mt-2 p-2 border rounded-md bg-secondary/30 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Video className="h-4 w-4"/> Video Link: 
              <Link href={message.videoEmbedUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {message.videoEmbedUrl}
              </Link>
            </div>
          </div>
        )}

        {message.fileUrl && message.fileName && (
          <div className="mt-2 p-2 border rounded-md bg-secondary/30 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              {message.fileType?.startsWith('image/') ? <Image src={message.filePreview || message.fileUrl} alt="preview" width={20} height={20} className="rounded" data-ai-hint="thumbnail"/> : <FileText className="h-4 w-4"/> }
              File: 
              <Link href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                {message.fileName} ({message.fileType})
              </Link>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className={`flex justify-end items-center pt-2 ${hasBackgroundGif ? 'bg-card/70 backdrop-blur-sm p-3 rounded-b-lg m-1 mt-0' : 'border-t mt-2'}`}>
        {/* Controls for per-message badges and GIF are removed */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="mr-2 h-4 w-4" /> Delete Message
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the message
                {message.parentId ? '' : ' and all its replies'}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                Yes, delete message
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
