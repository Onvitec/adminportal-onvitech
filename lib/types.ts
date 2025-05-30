export type VideoType = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  is_main:boolean;
};

export type Question = {
  id: string;
  question_text: string;
  video_id: string;
  answers: Answer[];
};

export type Answer = {
  id: string;
  answer_text: string;
  question_id: string;
  destination_video_id: string | null;
  destination_video?: VideoType;
};

export interface Module {
  id: string;
  title: string;
  videos: VideoType[];
}

export interface SessionForm {
  sessionName: string;
  sessionType: string;
  userId: string;
  modules: Module[];
}

export enum sessionTypes {
  LINEAR_FLOW = "linear",
  INTERACTIVE = "interactive",
}

export type SessionType = {
  id: string;
  title: string;
  session_type: string;
  created_by: string;
  created_at: string;
};

export type UserType = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
};
