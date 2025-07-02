"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { Share2} from "lucide-react";
import { DeleteIcon, EditIcon, Plus , EyeIcon } from "@/components/icons";
import { useEffect, useState } from "react";
import CreateSessionModal from "../../components/Modal/CreateSessionModal";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SessionType } from "@/lib/types";
import { fetchSessions } from "@/repos/sessions";
import { ConfirmModal } from "@/components/Modal/confirmDelete";
import { IframeModal } from "@/components/Modal/IframeModal";

const SessionsTable = () => {
  const [openModal, setOpenModal] = useState(false);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<SessionType[]>([]);
  const [isConfirmModalOpen, setIsconfirmModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
const [sessionToShare, setSessionToShare] = useState<SessionType | null>(null);

  const router = useRouter();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    const sessionsData = await fetchSessions();
    setSessions(sessionsData as SessionType[]);
    setLoading(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", sessionId);
    setSelectedSessions([]);
    if (error) {
      console.error("Failed to delete session:", error.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSessions.length === 0) return;

    try {
      const idsToDelete = selectedSessions.map((s) => s.id);

      const { error } = await supabase
        .from("sessions")
        .delete()
        .in("id", idsToDelete);

      if (error) throw new Error(error.message);

      // Refresh session list
      const refreshedSessions = await fetchSessions();
      setSessions(refreshedSessions!);
      setSelectedSessions([]);
      setIsBulkDeleteModalOpen(false);
    } catch (err) {
      console.error("Failed to delete sessions:", err);
    }
  };

  const sessionActions = [
    {
      label: "View Session",
      icon: <EyeIcon className="h-4 w-4" />,
      action: (session: SessionType) => router.push(`sessions/${session.id}`),
    },
    {
      label: "Edit",
      icon: <EditIcon className="h-4 w-4" />,
      action: (session: SessionType) =>
        router.push(`sessions/edit/${session.id}`),
    },
    {
      label: "Delete",
      icon: <DeleteIcon className="h-4 w-4" />,
      action: (session: SessionType) => {
        setSessionToDelete(session.id);
        setIsconfirmModalOpen(true);
      },
      variant: "outline" as const,
    },
   {
  label: "Share Session",
  icon: <EditIcon className="h-4 w-4" />,
  action: (session: SessionType) => {
    setSessionToShare(session);
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
            {isActive ? "Active" : "Inactive"}
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
              type="button"
              className="inline-flex items-center gap-2 bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] font-medium hover:bg-gray-900 transition"
            >
              <DeleteIcon className="h-4 w-4" />
              Delete Selected ({selectedSessions.length})
            </button>
          )}

          <button
            onClick={() => setOpenModal(true)}
            type="button"
            className="inline-flex items-center gap-2 bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] font-medium hover:bg-gray-900 transition"
          >
            <Plus className="h-4 w-4" />
            Create New Session
          </button>
        </div>
      </div>

      <Table<SessionType>
        data={sessions}
        columns={columns}
        onRowClick={(row) => {}}
        onRowSelect={(selectedRows) =>
          console.log("Selected rows:", selectedRows)
        }
        pageSize={5}
        showCheckbox={true}
        showActions={true}
        isSelectable={true}
        actions={sessionActions}
        isLoading={loading}
        onSelectionChange={(selected: any) => setSelectedSessions(selected)}
      />

<IframeModal
  sessionId={sessionToShare?.id || ""}
  open={isShareModalOpen}
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
            setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
            setSessionToDelete(null);
            setIsconfirmModalOpen(false);
          }
        }}
        onCancel={() => setIsconfirmModalOpen(false)}
      />
      <ConfirmModal
        open={isBulkDeleteModalOpen}
        title="Delete selected sessions?"
        description={`You are about to delete ${selectedSessions.length} session(s). This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
      />

      <CreateSessionModal open={openModal} setOpen={setOpenModal} />
    </>
  );
};

export default SessionsTable;
