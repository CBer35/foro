
'use client';

import { useState, useEffect } from 'react';
import type { Message } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Repeat, Paperclip, MessageSquareReply, MessagesSquare, PlayCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { repostMessageAction, fetchRepliesAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import MessageForm from './MessageForm';

interface MessageItemProps {
  message: Message;
  currentNickname: string;
  onMessageUpdated: (updatedMessage: Message) => void;
  onReplyCommitted?: (newReply: Message, parentId: string) => void;
  isReply?: boolean;
}

export default function MessageItem({ message: initialMessage, currentNickname, onMessageUpdated, onReplyCommitted, isReply = false }: MessageItemProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState<Message>(initialMessage);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [comments, setComments] = useState<Message[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    setMessage(initialMessage);
  }, [initialMessage]);

  const handleRepost = async () => {
    const result = await repostMessageAction(message.id);
    if (result?.success && result.updatedMessage) {
      toast({ title: "Success", description: result.success });
      setMessage(result.updatedMessage);
      onMessageUpdated(result.updatedMessage);
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.substring(0, 2).toUpperCase();
  };

  const handleToggleReplyForm = () => {
    setShowReplyForm(prev => !prev);
  };

  const handleToggleComments = async () => {
    if (showComments) {
      setShowComments(false);
    } else {
      setShowComments(true);
      if (comments.length === 0 && (message.replyCount || 0) > 0) {
        setIsLoadingComments(true);
        try {
          const fetchedReplies = await fetchRepliesAction(message.id);
          setComments(fetchedReplies);
        } catch (error) {
          console.error("Failed to fetch replies:", error);
          toast({ title: "Error", description: "Could not load comments.", variant: "destructive" });
        } finally {
          setIsLoadingComments(false);
        }
      }
    }
  };
  
  const handleReplyCommittedChild = (newReply: Message) => {
    const updatedParentMessage = { ...message, replyCount: (message.replyCount || 0) + 1 };
    setMessage(updatedParentMessage); 
    onMessageUpdated(updatedParentMessage); 
    
    if (showComments) {
      setComments(prevComments => [newReply, ...prevComments]);
    }
    setShowReplyForm(false);

    if (onReplyCommitted) {
        onReplyCommitted(newReply, message.id);
    }
    toast({
        title: "Respuesta Enviada",
        description: "Tu respuesta ha sido publicada."
    });
  };

  const handleChildCommentUpdated = (updatedChildComment: Message) => {
    setComments(prevComments => 
      prevComments.map(comment => comment.id === updatedChildComment.id ? updatedChildComment : comment)
    );
  };

  const isYouTubeUrl = (url: string): boolean => {
    if (!url) return false;
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const convertYouTubeUrlToEmbed = (url: string): string => {
    let videoId = '';
    if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split(/[?&]/)[0];
    } else if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('watch?v=')[1].split('&')[0];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1].split(/[?&]/)[0];
    } else if (url.includes('youtube.com/shorts/')) {
      videoId = url.split('shorts/')[1].split(/[?&]/)[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&controls=1&autoplay=1` : url;
  };
  
  const isVimeoUrl = (url: string): boolean => {
    if (!url) return false;
    const vimeoRegex = /^(https?:\/\/)?(www\.)?(vimeo\.com)\/(.+)/;
    return vimeoRegex.test(url);
  };

  const convertVimeoUrlToEmbed = (url: string): string => {
    const vimeoRegex = /vimeo\.com\/(\d+)/;
    const match = url.match(vimeoRegex);
    return match ? `https://player.vimeo.com/video/${match[1]}?byline=0&portrait=0&title=0&controls=1&autoplay=1` : url;
  };

  const directVideoLink = message.videoEmbedUrl && !isYouTubeUrl(message.videoEmbedUrl) && !isVimeoUrl(message.videoEmbedUrl)
    ? message.videoEmbedUrl
    : null;

  const uploadedVideoFile = (message.fileUrl && message.fileType?.startsWith('video/'))
    ? message.fileUrl
    : null;
  
  const videoToEmbed = isYouTubeUrl(message.videoEmbedUrl || '') || isVimeoUrl(message.videoEmbedUrl || '') || directVideoLink || uploadedVideoFile;

  const getBadgeStyle = (badge: string) => {
    switch (badge.toLowerCase()) {
      case 'admin': return "bg-red-600 text-white";
      case 'mod': return "bg-blue-600 text-white";
      case 'negro': return "bg-black text-white";
      default: return "bg-gray-500 text-white";
    }
  };
  
  const hasBackgroundGif = !!message.messageBackgroundGif;

  return (
    <Card 
      className={`mb-4 shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out relative ${isReply ? 'ml-6 sm:ml-10 border-l-2 border-primary/30 pl-3' : ''}`}
      style={hasBackgroundGif ? { 
        backgroundImage: `url('${message.messageBackgroundGif}')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      <CardHeader className={`flex flex-row items-start space-x-3 pb-2 ${hasBackgroundGif ? 'bg-card/80 backdrop-blur-sm p-3 rounded-t-lg m-1 mb-0' : ''}`}>
        <Avatar>
          <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(message.nickname)}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg font-semibold flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>{message.nickname || 'Anonymous'}</span>
            {message.badges && message.badges.map(badge => (
              <span key={badge} className={`px-2 py-0.5 text-xs rounded-full font-medium ${getBadgeStyle(badge)}`}>
                {badge}
              </span>
            ))}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            {message.parentId && !isReply && <span className="italic text-muted-foreground/80"> (reply)</span>}
          </p>
        </div>
      </CardHeader>
      <CardContent className={`pb-3 ${hasBackgroundGif ? 'bg-card/80 backdrop-blur-sm p-3 rounded-b-lg m-1 mt-0 relative z-10' : ''}`}>
        <p className="whitespace-pre-wrap">{message.content}</p>
        
        {videoToEmbed && (
          <div className="mt-3 max-w-md mx-auto">
            {!showVideoPlayer ? (
              <div 
                className="aspect-video p-4 border rounded-lg bg-secondary/20 hover:bg-secondary/40 cursor-pointer flex items-center justify-center flex-col shadow-sm"
                onClick={() => setShowVideoPlayer(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowVideoPlayer(true);}}
                aria-label="Reproducir video"
              >
                <PlayCircle className="h-12 w-12 text-primary mb-1" />
                <p className="text-xs font-medium text-primary">Video incrustado [ver]</p>
              </div>
            ) : (
              <div className="aspect-video overflow-hidden rounded-lg shadow-sm bg-black">
                {isYouTubeUrl(message.videoEmbedUrl || '') ? (
                  <iframe
                    src={convertYouTubeUrlToEmbed(message.videoEmbedUrl!)}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="w-full h-full" 
                  ></iframe>
                ) : isVimeoUrl(message.videoEmbedUrl || '') ? (
                  <iframe
                    src={convertVimeoUrlToEmbed(message.videoEmbedUrl!)}
                    title="Vimeo video player"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                ) : directVideoLink || uploadedVideoFile ? (
                  <video
                    src={directVideoLink || uploadedVideoFile!}
                    controls
                    controlsList="nodownload"
                    className="w-full h-full bg-black"
                    preload="metadata"
                    autoPlay 
                  />
                ) : null}
              </div>
            )}
          </div>
        )}

        {!videoToEmbed && message.fileUrl && message.fileName && message.fileType?.startsWith('image/') ? (
          <div className="mt-3 p-3 border rounded-md bg-secondary/30">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{message.fileName}</span>
            </div>
            <Image 
              src={message.filePreview || message.fileUrl} 
              alt={message.fileName} 
              width={200} height={150} 
              className="rounded-md object-cover max-h-48"
              data-ai-hint="attached image"
            />
          </div>
        ) : !videoToEmbed && message.fileUrl && message.fileName ? (
          <div className="mt-3 p-3 border rounded-md bg-secondary/30">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium text-sm">{message.fileName}</span>
            </div>
            <Link href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Download {message.fileName}
            </Link>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className={`flex justify-between items-center pt-0 ${hasBackgroundGif ? 'bg-card/70 backdrop-blur-sm p-3 rounded-b-lg m-1 mt-0 relative z-0' : ''}`}>
        <div className="flex gap-1">
          {!isReply && (
            <>
              <Button variant="ghost" size="sm" onClick={handleToggleReplyForm} aria-label="Reply to message">
                <MessageSquareReply className="h-4 w-4 mr-1" /> {showReplyForm ? 'Cancel Reply' : 'Reply'}
              </Button>
              {(message.replyCount || 0) > 0 || showComments ? (
                <Button variant="ghost" size="sm" onClick={handleToggleComments} aria-label="View comments">
                  <MessagesSquare className="h-4 w-4 mr-1" /> 
                  {showComments ? 'Hide Comments' : `View Comments (${message.replyCount || 0})`}
                </Button>
              ) : null}
            </>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={handleRepost} aria-label="Repost message">
          <Repeat className="h-4 w-4 mr-1" /> Repost ({message.reposts})
        </Button>
      </CardFooter>

      {showReplyForm && !isReply && (
        <div className={`p-4 border-t ${hasBackgroundGif ? 'bg-card/70 backdrop-blur-sm m-1 mt-0 rounded-b-lg' : ''}`}>
          <MessageForm onMessageCommitted={handleReplyCommittedChild} parentId={message.id} />
        </div>
      )}

      {showComments && !isReply && (
         <div className={`p-4 border-t ${hasBackgroundGif ? 'bg-card/70 backdrop-blur-sm m-1 mt-0 rounded-b-lg' : ''}`}>
          <h3 className="text-md font-semibold mb-3">Comments:</h3>
          {isLoadingComments && <div className="flex items-center justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /> <span className="ml-2">Loading comments...</span></div>}
          {!isLoadingComments && comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
          {!isLoadingComments && comments.length > 0 && (
            <div className="space-y-4">
              {comments.map(comment => (
                <MessageItem 
                  key={comment.id} 
                  message={comment} 
                  currentNickname={currentNickname}
                  onMessageUpdated={handleChildCommentUpdated} 
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
