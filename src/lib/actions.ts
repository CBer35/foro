
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { addMessage, incrementMessageReposts, addPoll, voteOnPoll, getMessages } from './file-store';
import type { Message, Poll } from '@/types';

const nicknameSchema = z.object({
  nickname: z.string().min(3, "Nickname must be at least 3 characters").max(20, "Nickname can be at most 20 characters long."),
});

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
  });

  redirect('/forum');
}

export async function createMessageAction(
  formData: FormData,
  parentId?: string // Optional parentId for replies
): Promise<{ success?: string; message?: Message; error?: string; errors?: any; }> {
  const cookieStore = cookies();
  const nickname = cookieStore.get('nickname')?.value;

  if (!nickname) {
    return { error: 'User not authenticated. Please ensure you are properly logged in and cookies are enabled.' };
  }

  const content = formData.get('content') as string;
  const fileInput = formData.get('file') as File | null; // Received as File object by Next.js

  if (!content || content.trim().length === 0) {
    return { error: 'Message content cannot be empty.' };
  }

  try {
    // Prepare the core message data object
    const messageDetails: Omit<Message, 'id' | 'timestamp' | 'reposts' | 'replyCount'> & { parentId?: string } = {
      nickname,
      content,
    };

    // Add parentId if this is a reply
    if (parentId) {
      messageDetails.parentId = parentId;
    }

    // Add file metadata if a file was provided
    if (fileInput && fileInput.size > 0) {
      messageDetails.fileName = fileInput.name;
      messageDetails.fileType = fileInput.type;
      
      // The filePreview (data URI for images) is appended to formData by the client
      const filePreview = formData.get('filePreview') as string | null;
      if (filePreview) {
        messageDetails.filePreview = filePreview;
      }
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
  cookies().delete('nickname');
  redirect('/');
}

export async function fetchLatestMessagesAction(): Promise<Message[]> {
  try {
    // revalidatePath('/forum'); // Not strictly necessary here for polling, but doesn't hurt
    return await getMessages();
  } catch (error) {
    console.error("Error in fetchLatestMessagesAction:", error);
    return []; 
  }
}
