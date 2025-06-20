
'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { 
  addMessage, 
  incrementMessageReposts, 
  addPoll, 
  voteOnPoll, 
  getMessages as getForumMessages,
  getPolls as getForumPolls,
  getAllMessagesWithReplies,
  deleteMessageAndReplies as deleteMessageFromFileStore,
  deletePoll as deletePollFromFileStore,
  getUserPreferences,
  upsertUserPreference,
  deleteUserBackgroundGifFile,
} from './file-store';
import type { Message, Poll, UserPreference } from '@/types';

const nicknameSchema = z.object({
  nickname: z.string().min(3, "Nickname must be at least 3 characters").max(20, "Nickname can be at most 20 characters long."),
});

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const userBackgroundsDir = path.join(uploadsDir, 'user-backgrounds'); // For user-specific backgrounds

const ensureUploadsDirsExist = async () => {
  for (const dir of [uploadsDir, userBackgroundsDir]) {
    try {
      await fs.access(dir);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        await fs.mkdir(dir, { recursive: true });
      } else {
        throw error;
      }
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

function getIpAddress(): string | undefined {
  const headersList = headers();
  const xForwardedFor = headersList.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const cfConnectingIp = headersList.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp;
  const xRealIp = headersList.get('x-real-ip');
  if (xRealIp) return xRealIp;
  return undefined;
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
  const ipAddress = getIpAddress();

  if (!content || content.trim().length === 0) {
    return { error: 'Message content cannot be empty.' };
  }

  try {
    await ensureUploadsDirsExist();

    const messageDetails: Omit<Message, 'id' | 'timestamp' | 'reposts' | 'replyCount'> & { parentId?: string } = {
      nickname,
      content,
      ipAddress,
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
      const filePath = path.join(uploadsDir, uniqueFilename); // Message files still go to general uploads
      
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
    revalidatePath('/admin/messages');
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
    revalidatePath('/admin/messages');
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

  const nickname = "Admin"; 
  const question = formData.get('question') as string;
  const optionTexts = (formData.getAll('options[]') as string[]).filter(opt => opt.trim() !== '');
  const ipAddress = getIpAddress();

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
      ipAddress,
    };

    const newPoll = await addPoll(pollData);

    revalidatePath('/forum');
    revalidatePath('/admin/polls');
    return { success: 'Poll created successfully by Admin!', poll: newPoll };
  } catch (e) {
    console.error('Error creating poll by admin:', e);
    return { error: 'Failed to create poll.' };
  }
}

export async function votePollAction(pollId: string, optionId: string): Promise<{ success?: string; updatedPoll?: Poll; error?: string; }> {
  try {
    const updatedPoll = await voteOnPoll(pollId, optionId);
    if(!updatedPoll) {
      return { error: 'Poll or option not found, or failed to vote.'};
    }
    revalidatePath('/forum');
    revalidatePath('/admin/polls');
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
  revalidatePath('/');
  redirect('/');
}

export async function fetchLatestMessagesAction(): Promise<Message[]> {
  try {
    const topLevelMessages = await getForumMessages(false); 
    return topLevelMessages;
  } catch (error) {
    console.error("Error in fetchLatestMessagesAction:", error);
    return []; 
  }
}

export async function fetchRepliesAction(parentId: string): Promise<Message[]> {
  try {
    const allMessages = await getAllMessagesWithReplies();
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
      maxAge: 60 * 60 * 24, 
      path: '/',
      sameSite: 'Lax',
    });
    redirect('/admin');
  } else {
    return { error: 'Invalid username or password.' };
  }
}

export async function adminLogoutAction() {
  cookies().delete('admin-session');
  revalidatePath('/admin/login');
  redirect('/admin/login');
}

export async function adminGetAllMessagesAction(): Promise<Message[]> {
  const isAdmin = cookies().get('admin-session')?.value === 'true';
  if (!isAdmin) {
    console.warn("Unauthorized attempt to fetch all messages by non-admin.");
    return []; 
  }
  return getAllMessagesWithReplies();
}

export async function adminDeleteMessageAction(messageId: string): Promise<{ success?: string; error?: string; }> {
  const isAdmin = cookies().get('admin-session')?.value === 'true';
  if (!isAdmin) {
    return { error: 'Unauthorized. Only admins can delete messages.' };
  }

  try {
    const success = await deleteMessageFromFileStore(messageId);
    if (success) {
      revalidatePath('/admin/messages');
      revalidatePath('/forum'); 
      return { success: 'Message and any replies deleted successfully.' };
    } else {
      return { error: 'Message not found or already deleted.' };
    }
  } catch (e) {
    console.error('Error deleting message by admin:', e);
    return { error: 'Failed to delete message.' };
  }
}

export async function adminGetAllPollsAction(): Promise<Poll[]> {
   const isAdmin = cookies().get('admin-session')?.value === 'true';
  if (!isAdmin) {
    console.warn("Unauthorized attempt to fetch all polls by non-admin.");
    return [];
  }
  return getForumPolls();
}

export async function adminDeletePollAction(pollId: string): Promise<{ success?: string; error?: string; }> {
  const isAdmin = cookies().get('admin-session')?.value === 'true';
  if (!isAdmin) {
    return { error: 'Unauthorized. Only admins can delete polls.' };
  }

  try {
    const success = await deletePollFromFileStore(pollId);
    if (success) {
      revalidatePath('/admin/polls');
      revalidatePath('/forum'); 
      return { success: 'Poll deleted successfully.' };
    } else {
      return { error: 'Poll not found or already deleted.' };
    }
  } catch (e) {
    console.error('Error deleting poll by admin:', e);
    return { error: 'Failed to delete poll.' };
  }
}

export async function adminSetUserPreferenceAction(formData: FormData): Promise<{ success?: string; error?: string; updatedPreference?: UserPreference; }> {
  const isAdmin = cookies().get('admin-session')?.value === 'true';
  if (!isAdmin) return { error: 'Unauthorized.' };

  const nickname = formData.get('nickname') as string;
  if (!nickname) return { error: 'Nickname is required.' };

  const selectedBadges = formData.getAll('badges[]') as string[];
  const backgroundGifFile = formData.get('backgroundGifFile') as File | null;
  const removeBackgroundGif = formData.get('removeBackgroundGif') === 'true';

  let newBackgroundGifUrl: string | null | undefined = undefined; // undefined means don't change

  try {
    await ensureUploadsDirsExist();
    const preferences = await getUserPreferences();
    const currentUserPref = preferences.find(p => p.nickname === nickname);

    if (removeBackgroundGif) {
      if (currentUserPref?.backgroundGifUrl) {
        await deleteUserBackgroundGifFile(currentUserPref.backgroundGifUrl);
      }
      newBackgroundGifUrl = null; // Explicitly remove
    } else if (backgroundGifFile && backgroundGifFile.size > 0) {
      if (backgroundGifFile.type !== 'image/gif') {
        return { error: 'Invalid file type. Please upload a GIF for user background.' };
      }
      if (currentUserPref?.backgroundGifUrl) {
        await deleteUserBackgroundGifFile(currentUserPref.backgroundGifUrl);
      }
      
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      // Sanitize nickname for filename
      const sanitizedNickname = nickname.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const uniqueFilename = `userbg-${sanitizedNickname}-${uniqueSuffix}.gif`;
      const gifPath = path.join(userBackgroundsDir, uniqueFilename);
      
      const fileBuffer = Buffer.from(await backgroundGifFile.arrayBuffer());
      await fs.writeFile(gifPath, fileBuffer);
      newBackgroundGifUrl = `/uploads/user-backgrounds/${uniqueFilename}`;
    }

    const updatedPreference = await upsertUserPreference(nickname, selectedBadges, newBackgroundGifUrl);
    
    revalidatePath('/admin/users');
    revalidatePath('/forum');
    return { success: `Preferences for ${nickname} updated!`, updatedPreference };

  } catch (e) {
    console.error(`Error setting user preference for ${nickname}:`, e);
    const errorMessage = e instanceof Error ? e.message : 'Server error setting user preference.';
    return { error: errorMessage };
  }
}

export async function getAllUniqueNicknamesAction(): Promise<string[]> {
    const isAdmin = cookies().get('admin-session')?.value === 'true';
    if (!isAdmin) return [];

    const messages = await getAllMessagesWithReplies();
    const polls = await getForumPolls();
    const preferences = await getUserPreferences();

    const nicknames = new Set<string>();
    messages.forEach(m => nicknames.add(m.nickname));
    polls.forEach(p => nicknames.add(p.nickname));
    preferences.forEach(p => nicknames.add(p.nickname));
    
    return Array.from(nicknames).sort();
}
