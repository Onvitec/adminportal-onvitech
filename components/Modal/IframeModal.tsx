"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "../session-provider";
import emailjs from "emailjs-com";


interface IframeModalProps {
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionname?: string;
}

export function IframeModal({
  sessionId,
  open,
  onOpenChange,
  sessionname = "Session",
}: IframeModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [shared, setShared] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [privateUrl, setPrivateUrl] = useState("");
  const { user} = useSession();
 

  useEffect(() => {
    if (typeof window !== "undefined") {
      setPrivateUrl(
        `<iframe src="${window.location.origin}/sessions/embed/${sessionId}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`
      );
    }
  }, [sessionId]);

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
      setEmailMessage("");
      setSelectedUserId("");
      setShared(false);
      setCopied(false);
    }
  }, [open]);

  const handleCopy = () => {
    navigator.clipboard.writeText(privateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

const handleShare = async () => {
  const selectedUser = users.find((u) => u.id === selectedUserId);
  if (!selectedUser) return;

  setSharing(true);

  const payload = {
    name: user?.username || "Unknown User",
    private_url: privateUrl,
    message: emailMessage,
    session: sessionname,
    to_email: selectedUser.email,
    to_name: selectedUser.first_name || selectedUser.email,
  };

  try {
    const result = await emailjs.send(
      "service_y8vwpg5",        // service ID
      "template_vt3cxj7",       // template ID
      payload,                  // template variables
      "dVdABZfh0aukWIT6n"       // public key
    );
    console.log("Email sent:", result.text);

    setShared(true);
    setTimeout(() => setShared(false), 1500);
  } catch (error) {
    console.error("Email send failed:", error);
    alert("Failed to send email. Please try again.");
  } finally {
    setSharing(false);
  }
};


  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 bg-opacity-50 transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4 text-center">
        <div
          className="relative transform overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-[600px]"
          onClick={(e) => e.stopPropagation()} // Prevent clicks from closing modal
        >
          {/* Modal content */}
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 space-y-4">
            {/* Header */}
            <div className="text-center sm:text-left flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                Share this Session
              </h3>

              <button
                onClick={() => onOpenChange(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <hr className="border-gray-300" />

            {/* Private Link */}
            <div>
              <label className="text-lg font-semibold text-black">
                Private Link
              </label>
              <p className="text-sm text-gray-500">
                You can share this link, but only authorized users can access
                it.
              </p>
              <input
                value={privateUrl}
                readOnly
                className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm mt-2 text-gray-500"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <hr className="border-gray-300" />

            {/* Add People */}
            <div className="space-y-2">
              <label className="text-lg font-semibold text-black">
                Add People
              </label>
              <div className="flex gap-2">
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  disabled={loadingUsers}
                  className="w-full h-10 border border-gray-300 rounded-md px-3 text-sm text-gray-800"
                >
                  <option value="">Select Company...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name + "       .......  "+ user.email}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleShare}
                  className="h-10 min-w-[80px] px-4 py-2 bg-[#2C3444] text-white rounded-md disabled:opacity-50"
                  disabled={!selectedUserId || sharing}
                >
                  {sharing ? "Sharing..." : shared ? "Shared!" : "Share"}
                </button>
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="text-md font-semibold text-black">
                Message
              </label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                className="w-full h-20 p-2 border border-gray-300 rounded-md text-sm"
                placeholder="Write a short message..."
              />
            </div>

            {/* Copy Link */}
            <div className="flex justify-end">
              <button
                onClick={handleCopy}
                className="h-10 text-sm text-blue-600 flex items-center gap-2 cursor-pointer"
              >
                <img
                  src={"/icons/clipart.png"}
                  alt="copy"
                  className="w-4 h-4"
                />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
