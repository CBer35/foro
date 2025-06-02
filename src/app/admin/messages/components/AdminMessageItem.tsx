
'use client';

import type { Message } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, FileText, Video, Link as LinkIcon, Fingerprint, Palette, ShieldCheck, ShieldX, UploadCloud, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { adminDeleteMessageAction, adminToggleMessageBadgeAction, adminSetMessageBackgroundGifAction } from '@/lib/actions';
import { useState, type FormEvent, useRef, ChangeEvent } from 'react';
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
  onMessageDeleted: (messageId: string) => void;
  onMessageUpdated: (updatedMessage: Message) => void;
}

export default function AdminMessageItem({ message: initialMessage, onMessageDeleted, onMessageUpdated }: AdminMessageItemProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState<Message>(initialMessage);
  const [selectedGifFile, setSelectedGifFile] = useState<File | null>(null);
  const [gifPreview, setGifPreview] = useState<string | null>(initialMessage.messageBackgroundGif || null);
  const gifFormRef = useRef<HTMLFormElement>(null);
  const gifInputRef = useRef<HTMLInputElement>(null);


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

  const handleToggleBadge = async (badge: 'admin' | 'mod' | 'negro') => {
    const result = await adminToggleMessageBadgeAction(message.id, badge);
    if (result?.success && result.updatedMessage) {
      toast({ title: "Success", description: `Badge '${badge}' toggled.` });
      setMessage(result.updatedMessage);
      onMessageUpdated(result.updatedMessage);
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  const handleGifFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'image/gif') {
        toast({ title: "Invalid File", description: "Please select a GIF file.", variant: "destructive" });
        setSelectedGifFile(null);
        setGifPreview(message.messageBackgroundGif || null); // Revert to original or null
        if (gifInputRef.current) gifInputRef.current.value = "";
        return;
      }
      // Optional: Add size check here
      // if (file.size > 5 * 1024 * 1024) { // 5MB limit
      //   toast({ title: "File too large", description: "GIF should be smaller than 5MB.", variant: "destructive" });
      //   return;
      // }
      setSelectedGifFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGifPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setSelectedGifFile(null);
      setGifPreview(message.messageBackgroundGif || null);
    }
  };

  const handleSetBackgroundGifSubmit = async (formData: FormData) => {
    // 'action' field is not needed as separate buttons handle logic
    if (!selectedGifFile && !formData.has('action')) { // If no file and not explicitly removing
        toast({ title: "No file", description: "Please select a GIF to upload or click 'Remove Background'.", variant: "default" });
        return;
    }
    
    const result = await adminSetMessageBackgroundGifAction(message.id, formData);
     if (result?.success && result.updatedMessage) {
      toast({ title: "Success", description: result.success });
      setMessage(result.updatedMessage);
      onMessageUpdated(result.updatedMessage);
      setSelectedGifFile(null); 
      setGifPreview(result.updatedMessage.messageBackgroundGif || null);
      if (gifInputRef.current) gifInputRef.current.value = ""; 
      gifFormRef.current?.reset();
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
      // Revert preview if upload failed but a file was selected
      if(selectedGifFile) setGifPreview(message.messageBackgroundGif || null);
    }
  };
  
  const getBadgeStyle = (badge: string) => {
    switch (badge) {
      case 'admin': return "bg-red-600 text-white";
      case 'mod': return "bg-blue-600 text-white";
      case 'negro': return "bg-black text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <Card 
      className={`shadow-sm ${message.parentId ? 'ml-6 border-l-2 border-muted pl-3' : ''}`}
      style={gifPreview ? { 
        backgroundImage: `url('${gifPreview}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : ( message.messageBackgroundGif ? {
        backgroundImage: `url('${message.messageBackgroundGif}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : {})}
    >
      <div className={`${(gifPreview || message.messageBackgroundGif) ? 'bg-card/80 backdrop-blur-sm rounded-lg' : ''}`}>
        <CardHeader className="flex flex-row items-start space-x-3 pb-2">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(message.nickname)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-md font-semibold flex items-center gap-2">
              {message.nickname || 'Anonymous'}
              {message.badges && message.badges.map(badge => (
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
        <CardContent className="pb-3">
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

        <CardFooter className="flex flex-col items-start gap-4 pt-2 border-t mt-2">
          <div className="w-full">
            <Label className="text-xs font-semibold">Manage Badges</Label>
            <div className="flex gap-2 mt-1">
              {(['admin', 'mod', 'negro'] as const).map(badgeType => (
                <Button key={badgeType} variant="outline" size="sm" onClick={() => handleToggleBadge(badgeType)}>
                  {message.badges?.includes(badgeType) ? <ShieldX className="mr-1 h-4 w-4 text-destructive" /> : <ShieldCheck className="mr-1 h-4 w-4 text-green-600" />}
                  {badgeType.charAt(0).toUpperCase() + badgeType.slice(1)}
                </Button>
              ))}
            </div>
          </div>
          
          <form ref={gifFormRef} action={handleSetBackgroundGifSubmit} className="w-full space-y-2">
            <Label htmlFor={`gifFile-${message.id}`} className="text-xs font-semibold">Set Background GIF</Label>
            <div className="flex items-center gap-2">
              <Input 
                id={`gifFile-${message.id}`}
                name="backgroundGifFile"
                ref={gifInputRef}
                type="file" 
                accept="image/gif"
                onChange={handleGifFileChange}
                className="h-8 text-xs flex-1"
              />
              <Button type="submit" variant="outline" size="sm" className="h-8">
                <UploadCloud className="mr-1 h-4 w-4" /> Set
              </Button>
            </div>
            {gifPreview && (
              <div className="mt-1 flex items-center gap-2">
                <Image src={gifPreview} alt="GIF preview" width={50} height={30} className="rounded border" data-ai-hint="GIF preview" />
                 <Button 
                    type="submit" 
                    name="action"
                    value="remove"
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-destructive hover:text-destructive/80"
                  >
                  <XCircle className="mr-1 h-4 w-4" /> Remove BG
                </Button>
              </div>
            )}
             {!gifPreview && message.messageBackgroundGif && ( // Show remove button if there's an existing BG but no current preview (e.g. on initial load)
                <div className="mt-1">
                     <Button 
                        type="submit" 
                        name="action"
                        value="remove"
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-destructive hover:text-destructive/80"
                    >
                        <XCircle className="mr-1 h-4 w-4" /> Remove BG
                    </Button>
                </div>
            )}
          </form>
          
          <div className="flex justify-end w-full">
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
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
