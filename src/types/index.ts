export interface Message {
  id: string;
  nickname: string;
  content: string;
  timestamp: Date;
  filePreview?: string; // URL or data URI for image preview, or filename for others
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
  timestamp: Date;
  totalVotes: number;
}
