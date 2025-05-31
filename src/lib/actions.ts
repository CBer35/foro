
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { addMessage, incrementMessageReposts, addPoll, voteOnPoll, getMessages } from './file-store';
import type { Message, Poll } from '@/types';

const nicknameSchema = z.object({
  nickname: z.string().min(3, "Nickname must be at least 3 characters").max(20, "Nickname can be at most 20 characters long."),
});

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const ensureUploadsDirExists = async () => {
  try {
    await fs.access(uploadsDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      await fs.mkdir(uploadsDir, { recursive: true });
    } else {
      throw error;
    }
  }
};

export async function setNicknameAction(prevState: any, formData: FormData) {
  const validatedFields = nicknameSchema.safeParse({
    nickname: formData.get('nickname'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { nickname } = validatedFields.data;

  cookies().set('nickname', nickname, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'Lax',
  });

  redirect('/forum');
}

export async function createMessageAction(
  formData: FormData,
  parentId?: string
): Promise<{ success?: string; message?: Message; error?: string; errors?: any; }> {
  const cookieStore = cookies();
  const nickname = cookieStore.get('nickname')?.value;

  if (!nickname) {
    console.error("Authentication failed in createMessageAction: Nickname cookie not found or has no value.");
    return { error: 'User not authenticated. Please ensure you are properly logged in and cookies are enabled. Check server logs for cookie details.' };
  }

  const content = formData.get('content') as string;
  const fileInput = formData.get('file') as File | null;
  const clientFilePreview = formData.get('filePreview') as string | null; // For images
  const videoEmbedUrl = formData.get('videoEmbedUrl') as string | null;

  if (!content || content.trim().length === 0) {
    return { error: 'Message content cannot be empty.' };
  }

  try {
    await ensureUploadsDirExists();

    const messageDetails: Omit<Message, 'id' | 'timestamp' | 'reposts' | 'replyCount'> & { parentId?: string } = {
      nickname,
      content,
    };

    if (parentId) {
      messageDetails.parentId = parentId;
    }

    if (videoEmbedUrl && videoEmbedUrl.trim() !== '') {
      // Prioritize video embed URL if provided
      messageDetails.videoEmbedUrl = videoEmbedUrl;
      // Clear any file-related properties if a video URL is given
      messageDetails.fileName = undefined;
      messageDetails.fileType = undefined;
      messageDetails.fileUrl = undefined;
      messageDetails.filePreview = undefined;
    } else if (fileInput && fileInput.size > 0) {
      // Process file upload if no video embed URL
      messageDetails.fileName = fileInput.name;
      messageDetails.fileType = fileInput.type;

      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      const extension = path.extname(fileInput.name);
      const uniqueFilename = `${path.basename(fileInput.name, extension)}-${uniqueSuffix}${extension}`;
      const filePath = path.join(uploadsDir, uniqueFilename);
      
      const fileBuffer = Buffer.from(await fileInput.arrayBuffer());
      await fs.writeFile(filePath, fileBuffer);
      
      messageDetails.fileUrl = `/uploads/${uniqueFilename}`; 

      if (fileInput.type.startsWith('image/') && clientFilePreview) {
        messageDetails.filePreview = clientFilePreview;
      }
      messageDetails.videoEmbedUrl = undefined; // Ensure videoEmbedUrl is not set if file is uploaded
    }
    
    const newMessage = await addMessage(messageDetails);

    revalidatePath('/forum'); 
    return { success: 'Message posted successfully!', message: newMessage };

  } catch (e) {
    console.error('Error posting message:', e);
    const errorMessage = e instanceof Error ? e.message : 'Failed to post message. Please try again.';
    return { error: errorMessage };
  }
}

export async function repostMessageAction(messageId: string): Promise<{ success?: string; updatedMessage?: Message; error?: string; }> {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }

  try {
    const updatedMessage = await incrementMessageReposts(messageId);
    if (!updatedMessage) {
      return { error: 'Message not found or failed to repost.'};
    }
    revalidatePath('/forum');
    return { success: 'Message reposted!', updatedMessage };
  } catch (e) {
    console.error('Error reposting message:', e);
    return { error: 'Failed to repost message.' };
  }
}

export async function createPollAction(formData: FormData): Promise<{ success?: string; poll?: Poll; error?: string; }> {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }
  const question = formData.get('question') as string;
  const optionTexts = (formData.getAll('options[]') as string[]).filter(opt => opt.trim() !== '');

  if (!question || question.trim().length === 0) {
    return { error: 'Poll question cannot be empty.' };
  }
  if (optionTexts.length < 2) {
    return { error: 'Poll must have at least two options.' };
  }
  
  try {
    const pollData = {
      nickname,
      question,
      options: optionTexts,
    };

    const newPoll = await addPoll(pollData);

    revalidatePath('/forum');
    return { success: 'Poll created successfully!', poll: newPoll };
  } catch (e) {
    console.error('Error creating poll:', e);
    return { error: 'Failed to create poll.' };
  }
}

export async function votePollAction(pollId: string, optionId: string): Promise<{ success?: string; updatedPoll?: Poll; error?: string; }> {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    return { error: 'User not authenticated.' };
  }

  try {
    const updatedPoll = await voteOnPoll(pollId, optionId);
    if(!updatedPoll) {
      return { error: 'Poll or option not found, or failed to vote.'};
    }
    revalidatePath('/forum');
    return { success: 'Voted successfully!', updatedPoll };
  } catch (e) {
    console.error('Error voting on poll:', e);
    if (e instanceof Error) { 
      return { error: e.message };
    }
    return { error: 'Failed to vote on poll.' };
  }
}

export async function handleSignOut() {
  cookies().delete('nickname', { path: '/', sameSite: 'Lax' });
  redirect('/');
}

export async function fetchLatestMessagesAction(): Promise<Message[]> {
  try {
    return await getMessages();
  } catch (error) {
    console.error("Error in fetchLatestMessagesAction:", error);
    return []; 
  }
}
