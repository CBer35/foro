
'use client';

import type { ChangeEvent } from 'react';
import { useState, useRef } from 'react';
import { useFormStatus as useFormStatusActual } from 'react-dom';
import { createMessageAction } from '@/lib/actions';
import type { Message } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Image as ImageIcon, XCircle } from 'lucide-react';
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
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 200 * 1024 * 1024) { // 200MB limit
        toast({ 
          title: "File too large", 
          description: "Please select a file smaller than 200MB. Note: Server may have lower limits.", 
          variant: "destructive"
        });
        setFile(null);
        setFilePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = ""; 
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
        setFilePreview(null); 
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
      fileInputRef.current.value = ""; 
    }
  };

  const handleSubmit = async (formData: FormData) => {
    if (filePreview && file?.type.startsWith('image/')) {
        formData.append('filePreview', filePreview);
    }

    // Pass parentId to the action if it exists
    const result = await createMessageAction(formData, parentId);
    
    if (result?.success && result.message) {
      toast({ title: "Success", description: result.success });
      onMessageCommitted(result.message);

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
          placeholder={parentId ? "Write your reply..." : "Share your thoughts..."}
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
            name="file" // This name is used by formData.get('file') in the action
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.txt,.zip,.rar" // Example accepted types
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
