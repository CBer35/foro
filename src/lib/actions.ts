
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
    return { error: 'User not authenticated. Please ensure you are properly logged in and cookies are enabled.' };
  }

  const content = formData.get('content') as string;
  const fileInput = formData.get('file') as File | null;
  const clientFilePreview = formData.get('filePreview') as string | null;
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
      messageDetails.videoEmbedUrl = videoEmbedUrl;
      messageDetails.fileName = undefined;
      messageDetails.fileType = undefined;
      messageDetails.fileUrl = undefined;
      messageDetails.filePreview = undefined;
    } else if (fileInput && fileInput.size > 0) {
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
      messageDetails.videoEmbedUrl = undefined;
    }
    
    const newMessage = await addMessage(messageDetails);

    revalidatePath('/forum'); 
    if (parentId) {
        revalidatePath(`/forum/message/${parentId}`);
    }
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
  const cookieStore = cookies();
  const isAdmin = cookieStore.get('admin-session')?.value === 'true';

  if (!isAdmin) {
    return { error: 'Only administrators can create polls.' };
  }

  const nickname = "Admin"; // Polls created by admin will have "Admin" as nickname
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
    revalidatePath('/admin'); // Also revalidate admin if polls are listed there
    return { success: 'Poll created successfully by Admin!', poll: newPoll };
  } catch (e) {
    console.error('Error creating poll by admin:', e);
    return { error: 'Failed to create poll.' };
  }
}

export async function votePollAction(pollId: string, optionId: string): Promise<{ success?: string; updatedPoll?: Poll; error?: string; }> {
  const nickname = cookies().get('nickname')?.value;
  if (!nickname) {
    // Allow anonymous voting or voting based on 'nickname' cookie if preferred
    // For now, let's keep the check, but this could be removed if polls are fully public for voting
    // return { error: 'User not authenticated to vote.' }; 
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
  cookies().set('nickname', '', { maxAge: -1, path: '/', sameSite: 'Lax' });
  redirect('/');
}

export async function fetchLatestMessagesAction(): Promise<Message[]> {
  try {
    const allMessages = await getMessages();
    return allMessages.filter(msg => !msg.parentId);
  } catch (error) {
    console.error("Error in fetchLatestMessagesAction:", error);
    return []; 
  }
}

export async function fetchRepliesAction(parentId: string): Promise<Message[]> {
  try {
    const allMessages = await getMessages();
    const replies = allMessages.filter(msg => msg.parentId === parentId);
    return replies.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  } catch (error) {
    console.error("Error in fetchRepliesAction:", error);
    return [];
  }
}

// Admin Actions
const adminCredentialsSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function adminLoginAction(prevState: any, formData: FormData) {
  const validatedFields = adminCredentialsSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      error: "Both username and password are required.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { username, password } = validatedFields.data;

  // Ensure ADMIN_USERNAME and ADMIN_PASSWORD are set in .env.local
  const adminUser = process.env.ADMIN_USERNAME;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminUser || !adminPass) {
    console.error("ADMIN_USERNAME or ADMIN_PASSWORD not set in environment variables.");
    return { error: "Admin authentication is not configured on the server." };
  }

  if (username === adminUser && password === adminPass) {
    cookies().set('admin-session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      sameSite: 'Lax',
    });
    redirect('/admin');
  } else {
    return { error: 'Invalid username or password.' };
  }
}

export async function adminLogoutAction() {
  cookies().set('admin-session', '', { maxAge: -1, path: '/', sameSite: 'Lax' });
  redirect('/admin/login');
}
