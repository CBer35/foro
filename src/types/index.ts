
// No more Firebase Timestamp type
// export type { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  nickname: string;
  content: string;
  timestamp: string; // ISO 8601 date string
  filePreview?: string; // Client-generated data URI for image previews
  fileName?: string;
  fileType?: string;
  fileUrl?: string; // URL to the file stored on the server
  videoEmbedUrl?: string; // URL for an externally hosted video to embed
  parentId?: string;
  reposts: number;
  replyCount?: number;
  ipAddress?: string; // Added IP address
}

export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll {
  id: string;
  nickname: string;
  question: string;
  options: PollOption[];
  timestamp: string; // ISO 8601 date string
  totalVotes: number;
  ipAddress?: string; // Added IP address
}

