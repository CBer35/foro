
'use client';

import type { ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import type { useFormStatus } from 'react-dom'; // Corrected: Keep type import
import { useFormStatus as useFormStatusActual } from 'react-dom'; // Use actual hook
import { createMessageAction } from '@/lib/actions';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Image as ImageIcon, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import type { Message } from '@/types';

interface MessageFormProps {
  // Callback with client-side constructed message data after server action success
  onMessageCommitted: (messageData: Omit<Message, 'id' | 'reposts' | 'timestamp' | 'nickname'>) => void;
}

function SubmitButton() {
  const { pending } = useFormStatusActual(); // Use actual hook
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Posting...' : <><Send className="mr-2 h-4 w-4" /> Post Message</>}
    </Button>
  );
}

export default function MessageForm({ onMessageCommitted }: MessageFormProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: "File too large", description: "Please select a file smaller than 5MB.", variant: "destructive"});
        setFile(null);
        setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; // Reset file input
        return;
      }
      setFile(selectedFile);
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFilePreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setFilePreview(null); // No preview for non-image files
      }
    } else {
      setFile(null);
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Reset the file input
    }
  };

  const handleSubmit = async (formData: FormData) => {
    // content from formData will be used by server action.
    // We use client-side state (content, file, filePreview) to construct the object for onMessageCommitted.
    const clientContent = content;
    const clientFile = file;
    const clientFilePreview = filePreview;

    const result = await createMessageAction(formData);
    if (result?.success) {
      toast({ title: "Success", description: result.success });

      const messageDataForClient: Omit<Message, 'id' | 'reposts' | 'timestamp' | 'nickname'> = {
        content: clientContent,
        filePreview: clientFilePreview,
        fileName: clientFile?.name,
        fileType: clientFile?.type,
      };
      onMessageCommitted(messageDataForClient);

      setContent('');
      setFile(null);
      setFilePreview(null);
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
          placeholder="Share your thoughts..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          rows={3}
          className="resize-none"
        />
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="mr-2 h-4 w-4" /> Attach File
          </Button>
          <Input
            type="file"
            name="file" // Name attribute for server action to pick up the file
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.txt"
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
        <SubmitButton />
      </div>
      {filePreview && file?.type.startsWith('image/') && (
        <div className="mt-2">
          <Image src={filePreview} alt="File preview" width={100} height={100} className="rounded-md object-cover max-h-24" data-ai-hint="image preview" />
        </div>
      )}
    </form>
  );
}
