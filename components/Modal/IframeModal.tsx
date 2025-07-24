"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "../ui/textarea";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { showToast } from "../toast";

interface IframeModalProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IframeModal({
  sessionId,
  open,
  onOpenChange,
}: IframeModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [shared, setShared] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sharing, setSharing] = useState(false);

  const privateUrl = `<iframe src="${window.location.origin}/sessions/embed/${sessionId}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`;

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, email")
        .eq("role", "User");

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
      setLoadingUsers(false);
    }

    if (open) fetchUsers();
  }, [open]);

  useEffect(() => {
    if (!open) {
      // Reset form state when modal closes
      setEmailMessage("");
      setSelectedUserId("");
      setShared(false);
      setCopied(false);
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(privateUrl);
    setCopied(true);
    showToast("success", "Link Copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser) return;

    setSharing(true);

    const payload = {
      to: selectedUser.email,
      subject: "Shared Session",
      body: `${emailMessage} PRIVATE URL: ${privateUrl}`,
    };

    console.log("Sharing to:", selectedUser.email);
    console.log("Payload:", payload);

    // TODO: Integrate email sending API
    setTimeout(() => {
      setShared(true);
      setSharing(false);
      setTimeout(() => setShared(false), 1500);
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-xl space-y-2">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Share this Session
          </DialogTitle>
        </DialogHeader>

        <hr className="bg-gray-500" />

        {/* Private Link */}
        <div>
          <Label className="text-lg font-semibold text-black">Private Link</Label>
          <p className="text-sm text-gray-500">
            You can share this link, but only authorized users can access it.
          </p>
          <Input
            value={privateUrl}
            readOnly
            className="h-10 text-sm mt-2 text-gray-500"
          />
        </div>

        <hr className="bg-gray-500" />

        {/* Add People */}
        <div className="space-y-2">
          <Label className="text-lg font-semibold text-black">Add People</Label>
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={loadingUsers}
              className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm text-gray-800"
            >
              <option value="">Select user...</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name || user.email}
                </option>
              ))}
            </select>
            <Button
              onClick={handleShare}
              className="h-10 min-w-[80px]"
              disabled={!selectedUserId || sharing}
            >
              {sharing ? "Sharing..." : shared ? "Shared!" : "Share"}
            </Button>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label className="text-md font-semibold text-black">Message</Label>
          <Textarea
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            className="h-20 text-sm"
            placeholder="Write a short message..."
          />
        </div>

        {/* Copy Link */}
        <div className="flex justify-end">
          <button
            onClick={handleCopy}
            className="h-10 text-sm text-blue-600 flex items-center gap-2 cursor-pointer"
          >
            <img src={"/icons/clipart.png"} alt="copy" className="w-4 h-4" />
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
