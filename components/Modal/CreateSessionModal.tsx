"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, CheckCircle, Video, Shuffle, Layers } from "lucide-react";
import { useRouter } from "next/navigation";

interface SessionType {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  redirectUrl: string;
}

interface CreateSessionModalProps {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const SESSION_TYPES: SessionType[] = [
  {
    key: "interactive",
    title: "Interactive Video",
    description: "Interactive Video Flow Builder (Main Feature)",
    icon: <Video className="h-5 w-5 text-white" />,
    redirectUrl: "sesssions/create/interactive",
  },
  {
    key: "linear",
    title: "Linear Flow",
    description: "Linear Flow (Sequential Learning Path)",
    icon: <Shuffle className="h-5 w-5 text-white" />,
    redirectUrl: "sesssions/create/linear",
  },
  {
    key: "selection",
    title: "Selection Based",
    description: " Selection-Based Flow with Final Solutions",
    icon: <Layers className="h-5 w-5 text-white" />,
    redirectUrl: "sesssions/create/selection",
  },
];

export default function CreateSessionModal({
  open,
  setOpen,
}: CreateSessionModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const router = useRouter();

  const handleNext = () => {
    const session = SESSION_TYPES.find((s) => s.key === selected);
    if (session) {
      router.push(session.redirectUrl);
      setOpen(false);
    }
  };

  return (
    <>
    
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl rounded-lg top-1/2 -translate-y-1/2 p-0">
  <DialogHeader className="border-b px-6 py-4">
    <DialogTitle className="text-[#242B42] text-[18px] font-bold">Select Session Type</DialogTitle>
  </DialogHeader>

  <div className="grid gap-4 px-6 py-4">
    {SESSION_TYPES.map((type) => (
      <div
        key={type.key}
        className={`relative flex items-center gap-4 rounded-xl border px-4 py-3 cursor-pointer transition hover:bg-gray-50 ${
          selected === type.key ? "border-[#6096BA] border-2" : "border-[#E2E8F0]"
        }`}
        onClick={() => setSelected(type.key)}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black">
          {type.icon}
        </div>
        <div>
          <p className="text-[#242B42] text-[16px] font-bold">{type.title}</p>
          <p className="text-[14px] text-[#475569] font-normal">{type.description}</p>
        </div>
        {selected === type.key && (
          <CheckCircle className="absolute right-2 text-[#6096BA]" />
        )}
      </div>
    ))}
  </div>

  <DialogFooter className="border-t px-6 py-3">
    <Button
      variant="ghost"
      onClick={() => setOpen(false)}
      className="mr-2 text-[14px] font-medium text-[#475569] px-3 py-2 rounded-md"
    >
      Cancel
    </Button>
    <Button
      onClick={handleNext}
      disabled={!selected}
      className="bg-[#2E3545] text-[14px] font-medium text-white px-3 py-2 rounded-md"
    >
      Next
    </Button>
  </DialogFooter>
</DialogContent>

      </Dialog>
    </>
  );
}
