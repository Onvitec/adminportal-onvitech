"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { DeleteIcon, EditIcon, Plus } from "@/components/icons";
import { EyeIcon } from "@/components/icons";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SessionType } from "@/lib/types";
import { fetchSessions } from "@/repos/sessions";
import { ConfirmModal } from "@/components/Modal/confirmDelete";
import { IframeModal } from "@/components/Modal/IframeModal";
import { showToast } from "@/components/toast";
import CreateSessionModal from "@/components/Modal/CreateSessionModal";

const FILTERS = [
  { label: "All", key: "all" },
  { label: "Linear Flow", key: "linear" },
  { label: "Interactive Video", key: "interactive" },
  { label: "Selection Based", key: "selection" },
] as const;

export default function SessionsTable() {
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [filtered, setFiltered] = useState<SessionType[]>([]);
  const [activeFilter, setActiveFilter] =
    useState<(typeof FILTERS)[number]["key"]>("all");
  const [loading, setLoading] = useState(true);
  const [selectedSessions, setSelectedSessions] = useState<SessionType[]>([]);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [sessionToShare, setSessionToShare] = useState<SessionType | null>(
    null
  );
  const [isConfirmModalOpen, setIsconfirmModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (activeFilter === "all") {
      setFiltered(sessions);
    } else {
      setFiltered(sessions.filter((s) => s.session_type === activeFilter));
    }
    setSelectedSessions([]);
  }, [activeFilter, sessions]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const sessionsData = await fetchSessions();
      setSessions(sessionsData as SessionType[]);
    } catch {
      showToast("error", "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;
      setSessions((prev) => prev.filter((x) => x.id !== sessionId));
      showToast("success", "Session deleted");
    } catch {
      showToast("error", "Failed to delete");
    }
  };

  const handleBulkDelete = async () => {
    const ids = selectedSessions.map((s) => s.id);
    try {
      await supabase.from("sessions").delete().in("id", ids);
      setSessions((prev) => prev.filter((s) => !ids.includes(s.id)));
      setIsBulkDeleteModalOpen(false);
      showToast("success", `${ids.length} sessions deleted`);
    } catch {
      showToast("error", "Bulk delete failed");
    }
  };

  const sessionActions = [
    {
      label: "View Session",
      icon: <EyeIcon className="h-4 w-4" />,
      action: (s: SessionType) => router.push(`sessions/${s.id}`),
    },
    {
      label: "Edit",
      icon: <EditIcon className="h-4 w-4" />,
      action: (s: SessionType) => router.push(`sessions/edit/${s.id}`),
    },
    {
      label: "Delete",
      icon: <DeleteIcon className="h-4 w-4 text-[#505568]" />,
      action: (s: SessionType) => {
        setSessionToDelete(s.id);
        setIsconfirmModalOpen(true);
      },
      variant: "outline" as const,
    },
    {
      label: "Share Session",
      icon: <EditIcon className="h-4 w-4" />,
      action: (s: SessionType) => {
        setSessionToShare(s);
        setIsShareModalOpen(true);
      },
      variant: "outline" as const,
    },
  ];

  const columns = [
    {
      accessorKey: "title" as keyof SessionType,
      header: "Session Name",
      enableSorting: true,
    },
    {
      accessorKey: "session_type" as keyof SessionType,
      header: "Type",
      cell: ({ getValue }: { getValue: () => any }) => {
        const value = getValue();
        return (
          <span className="capitalize">
            {value === "linear"
              ? "Linear Flow"
              : value === "interactive"
              ? "Interactive Flow"
              : value}
          </span>
        );
      },
    },
    {
      accessorKey: "is_active" as keyof SessionType,
      header: "Status",
      enableSorting: true,
      cell: ({ getValue }: { getValue: () => any }) => {
        const isActive = getValue();
        return (
          <span
            className={
              isActive
                ? "text-green-600 font-semibold"
                : "text-red-600 font-semibold"
            }
          >
            {isActive ? "Completed" : "In Progress"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at" as keyof SessionType,
      header: "Published Date",
      enableSorting: true,
      cell: ({ getValue }: { getValue: () => any }) => {
        const rawDate = getValue();
        const date = new Date(rawDate);
        const formatted = `${date.getFullYear()}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}`;
        return <span>{formatted}</span>;
      },
    },
  ];

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <Heading>Session Maker</Heading>
          <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md">
            Create and manage your sessions in one place.
          </p>
        </div>

        <div className="flex gap-2">
          {selectedSessions.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] hover:bg-gray-900"
            >
              <DeleteIcon className="h-4 w-4" />
              Delete Selected ({selectedSessions.length})
            </button>
          )}
          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] hover:bg-gray-900 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New Session
          </button>
        </div>
      </div>

      {/* Connected Toggle Filter Buttons */}
      <div className="flex justify-start mb-6">
        <div className="inline-flex bg-white rounded-md border border-gray-200 px-1 py-0.5 gap-[10px]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`cursor-pointer py-2 text-[14px] text-[#5F6D7E] font-medium rounded-md focus:outline-none transition-colors duration-150
          whitespace-nowrap
          w-40
          ${
            activeFilter === f.key
              ? "bg-[#2C3444] text-white"
              : "bg-white text-[#5F6D7E] hover:bg-gray-100"
          }
        `}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Table<SessionType>
        data={filtered}
        columns={columns}
        onSelectionChange={setSelectedSessions}
        pageSize={10}
        showCheckbox
        showActions
        isSelectable
        actions={sessionActions}
        isLoading={loading}
      />

      {/* Modals */}
      <IframeModal
        sessionId={sessionToShare?.id || ""}
        open={isShareModalOpen}
        sessionname={sessionToShare?.title}
        onOpenChange={setIsShareModalOpen}
      />
      <ConfirmModal
        open={isConfirmModalOpen}
        title="Delete this session?"
        description="This will permanently delete the session data."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={async () => {
          if (sessionToDelete) {
            await handleDeleteSession(sessionToDelete);
            setIsconfirmModalOpen(false);
          }
        }}
        onCancel={() => setIsconfirmModalOpen(false)}
      />
      <ConfirmModal
        open={isBulkDeleteModalOpen}
        title="Delete selected sessions?"
        description={`You are about to delete ${selectedSessions.length} session(s). This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />
      <CreateSessionModal open={openModal} setOpen={setOpenModal} />
    </>
  );
}
