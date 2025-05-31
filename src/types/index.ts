
// No more Firebase Timestamp type
// export type { Timestamp } from 'firebase/firestore';

export interface Message {
  id: string;
  nickname: string;
  content: string;
  timestamp: string; // ISO 8601 date string
  filePreview?: string; 
  fileName?: string;
  fileType?: string;
  reposts: number;
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
}
