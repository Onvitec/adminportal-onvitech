export type VideoType = {
  id: string;
  title: string;
  file: File | null;
  url: string;
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

export type UserType={
 id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
}
