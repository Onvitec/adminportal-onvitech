"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";

interface IframeModalProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IframeModal({ sessionId, open, onOpenChange }: IframeModalProps) {
  const [copied, setCopied] = useState(false);
  const iframeCode = `<iframe src="${window.location.origin}/sessions/embed/${sessionId}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`;

  const handleCopy = () => {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false); // Close the modal
    window.location.reload(); // Refresh the page
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            Share Session
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              value={iframeCode}
              readOnly
              className="font-mono text-sm h-10"
            />
            <Button onClick={handleCopy} className="h-10">
              {copied ? (
                <CheckIcon className="w-4 h-4 mr-1" />
              ) : (
                <CopyIcon className="w-4 h-4 mr-1" />
              )}
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}