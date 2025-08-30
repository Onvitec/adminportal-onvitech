export type VideoType = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  is_main?: boolean;
  duration: number; // Add duration in seconds
  links?: VideoLink[]; // Add links array
};
export type VideoLink = {
  id: string;
  timestamp_seconds: number;
  label: string;
  url?: string;
  video_id?: string;
  destination_video_id?: string; // Optional destination video ID
  destination_video?: VideoType;
  link_type: "url" | "video"; // Type discriminator
  position_x: number;
  position_y: number;
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
  SELECTION = "selection",
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

// Solution Types
export type SolutionCategory = {
  id: number;
  name: string;
};

export type Solution = {
  id: string;
  session_id: string;
  category_id: number | null;
  form_data?: any;
  emailContent?: string;
  emailTarget?: string;
  link_url?: string;
  videoFile?: File | null;
  video_url?: string;
  email_content?: string;
};

export type FormElementType =
  | "text"
  | "number"
  | "dropdown"
  | "checkbox"
  | "radio"
  | "paragraph"
  | "button";

export type FormElement = {
  id: string;
  type: FormElementType;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // For dropdown, radio
  defaultValue?: string;
};

export type FormSolutionData = {
  description?: string;
  elements: FormElement[];
};
