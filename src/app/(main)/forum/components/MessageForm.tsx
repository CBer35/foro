
'use client';

import type { ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { useFormStatus as useFormStatusActual } from 'react-dom';
import { createMessageAction } from '@/lib/actions';
import type { Message } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Paperclip, Image as ImageIcon, XCircle, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface MessageFormProps {
  onMessageCommitted: (newMessage: Message) => void;
  parentId?: string; // For replying to a message
}

function SubmitButton() {
  const { pending } = useFormStatusActual();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Posting...' : <><Send className="mr-2 h-4 w-4" /> Post Message</>}
    </Button>
  );
}

export default function MessageForm({ onMessageCommitted, parentId }: MessageFormProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 25 * 1024 * 1024) { // 25MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 25MB. The server might have further restrictions.",
          variant: "destructive"
        });
        setFile(null);
        setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setFile(selectedFile);
      setVideoUrlInput(''); // Clear video URL if a file is selected
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null);
      }
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };

  const handleVideoUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideoUrlInput(event.target.value);
    if (event.target.value) {
      removeFile(); // Clear file if a video URL is entered
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (formData: FormData) => {
    // If a video URL is provided, don't send the file, even if selected.
    // The server action will prioritize videoEmbedUrl if present.
    if (videoUrlInput.trim() !== "") {
      formData.delete('file'); // Ensure file is not sent if URL is present
    } else if (filePreview && file?.type.startsWith('image/')) {
        formData.append('filePreview', filePreview);
    }


    const result = await createMessageAction(formData, parentId);

    if (result?.success && result.message) {
      toast({ title: "Success", description: result.success });
      onMessageCommitted(result.message);

      setContent('');
      setFile(null);
      setFilePreview(null);
      setVideoUrlInput('');
      formRef.current?.reset();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else if (result?.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-4 mb-8 p-4 border rounded-lg shadow-sm bg-card">
      <div>
        <Textarea
          name="content"
          placeholder={parentId ? "Write your reply..." : "Share your thoughts..."}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="resize-none"
        />
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="file-upload" className="text-sm font-medium">Attach File (Max 25MB)</Label>
          <div className="flex items-center gap-2 mt-1">
            <Button id="file-upload" type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={!!videoUrlInput}>
              <Paperclip className="mr-2 h-4 w-4" /> Attach File
            </Button>
            <Input
              type="file"
              name="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,video/*,application/pdf,.doc,.docx,.txt,.zip,.rar"
              disabled={!!videoUrlInput}
            />
            {file && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {file.type.startsWith('image/') && filePreview ? <ImageIcon className="h-4 w-4 text-primary" /> : <Paperclip className="h-4 w-4" />}
                <span>{file.name.length > 20 ? `${file.name.substring(0,17)}...` : file.name}</span>
                <Button type="button" variant="ghost" size="icon" onClick={removeFile} className="h-6 w-6">
                  <XCircle className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
          {filePreview && file?.type.startsWith('image/') && (
            <div className="mt-2">
              <Image src={filePreview} alt="File preview" width={100} height={100} className="rounded-md object-cover max-h-24" data-ai-hint="image preview" />
            </div>
          )}
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or
            </span>
          </div>
        </div>
        
        <div>
          <Label htmlFor="videoUrl" className="text-sm font-medium">Paste Video Link (e.g., YouTube, Vimeo, .mp4)</Label>
          <div className="flex items-center gap-2 mt-1">
            <LinkIcon className="h-5 w-5 text-muted-foreground" />
            <Input
              id="videoUrl"
              name="videoEmbedUrl"
              type="url"
              placeholder="https://example.com/video.mp4"
              value={videoUrlInput}
              onChange={handleVideoUrlChange}
              className="flex-1"
              disabled={!!file}
            />
          </div>
        </div>
      </div>


      <div className="flex justify-end items-center gap-4">
        <SubmitButton />
      </div>
    </form>
  );
}
