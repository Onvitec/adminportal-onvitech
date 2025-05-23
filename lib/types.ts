export type Video = {
  id: string;
  title: string;
  file: File | null;
  url: string;
};

export interface Module {
  id: string;
  title: string;
  videos: Video[];
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
