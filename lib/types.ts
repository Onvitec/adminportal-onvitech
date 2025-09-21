export type VideoType = {
  id: string;
  title: string;
  file: File | null;
  url: string;
  is_main?: boolean;
  duration: number; // Add duration in seconds
  links?: VideoLink[]; // Add links array

  db_id?: string;
  path?: string;
  freezeAtEnd?: boolean;
  destination_video_id: string | null;
};
export type VideoLink = {
  id: string;
  timestamp_seconds: number;
  label: string;
  url?: string;
  duration_ms?: number;
  video_id?: string;
  destination_video_id?: string | null; // Optional destination video ID
  destination_video?: VideoType;
  link_type: "url" | "video" | "form"; // Type discriminator
  position_x: number;
  position_y: number;

  // Database image URLs (persisted)
  normal_state_image?: string;
  hover_state_image?: string;
  normal_image_width?: number;
  normal_image_height?: number;
  hover_image_width?: number;
  hover_image_height?: number;

  // Temporary files for upload (not persisted)
  normalImageFile?: File | null;
  hoverImageFile?: File | null;

  // Temporary preview URLs for UI (not persisted)
  normalImagePreview?: string; // Add this
  hoverImagePreview?: string; // Add this

  form_data?: FormSolutionData | null | undefined;
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
  | "button"
  | "email"
  | "textarea";
export type FormElement = {
  id: string;
  type: FormElementType | any;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: any[]; // For dropdown, radio
  defaultValue?: string;
};

export type FormSolutionData = {
  description?: string;
  title: string;
  email: string;
  elements: FormElement[];
};
