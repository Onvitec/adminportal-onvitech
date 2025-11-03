"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { DeleteIcon, EditIcon, Plus } from "@/components/icons";
import { EyeIcon } from "@/components/icons";
import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SessionType } from "@/lib/types";
import { fetchSessions } from "@/repos/sessions";
import { ConfirmModal } from "@/components/Modal/confirmDelete";
import { IframeModal } from "@/components/Modal/IframeModal";
import { showToast } from "@/components/toast";
import CreateSessionModal from "@/components/Modal/CreateSessionModal";
import { RefreshCw } from "lucide-react";

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
  const [deleting, setDeleting] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const router = useRouter();

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Filter sessions when activeFilter or sessions change
  useEffect(() => {
    if (activeFilter === "all") {
      setFiltered(sessions);
    } else {
      setFiltered(sessions.filter((s) => s.session_type === activeFilter));
    }
    // Clear selection when filter changes
    setSelectedSessions([]);
  }, [activeFilter, sessions]);

  // Clean up selected sessions that no longer exist in filtered data
  useEffect(() => {
    if (selectedSessions.length > 0 && filtered.length > 0) {
      const existingIds = new Set(filtered.map((s) => s.id));
      const hasInvalidSelections = selectedSessions.some(
        (s) => !existingIds.has(s.id)
      );

      if (hasInvalidSelections) {
        setSelectedSessions((prev) =>
          prev.filter((s) => existingIds.has(s.id))
        );
      }
    }
  }, [filtered]); // Only depend on filtered data

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
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("sessions")
        .delete()
        .eq("id", sessionId);
      if (error) throw error;

      // Update both sessions and selectedSessions
      setSessions((prev) => prev.filter((x) => x.id !== sessionId));
      setSelectedSessions((prev) => prev.filter((x) => x.id !== sessionId));

      showToast("success", "Session deleted");
    } catch {
      showToast("error", "Failed to delete");
    } finally {
      setDeleting(false);
      setIsconfirmModalOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    const ids = selectedSessions.map((s) => s.id);
    try {
      await supabase.from("sessions").delete().in("id", ids);

      // Update both sessions and selectedSessions
      setSessions((prev) => prev.filter((s) => !ids.includes(s.id)));
      setSelectedSessions([]);

      setIsBulkDeleteModalOpen(false);
      showToast("success", `${ids.length} session(s) deleted`);
    } catch {
      showToast("error", "Bulk delete failed");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleSelectionChange = useCallback(
    (selected: SessionType[]) => {
      const existingIds = new Set(filtered.map((s) => s.id));
      const validSelections = selected.filter((s) => existingIds.has(s.id));

      // Only update if the selection actually changed
      if (
        validSelections.length !== selectedSessions.length ||
        !validSelections.every((s, i) => s.id === selectedSessions[i]?.id)
      ) {
        setSelectedSessions(validSelections);
      }
    },
    [filtered, selectedSessions]
  );

  const sessionActions = useMemo(
    () => [
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
    ],
    [router]
  );

  const columns = useMemo(
    () => [
      {
        accessorKey: "title" as keyof SessionType,
        header: "Session Name",
        enableSorting: true,
      },
      {
        accessorKey: "company_name",
        header: "Company",
        cell: ({ row }: { row: any }) => (
          <span className="capitalize">{row?.company_name || "—"}</span>
        ),
      },
      {
        accessorKey: "total_views",
        header: "Views",
        cell: ({ getValue }: { getValue: () => any }) => {
          const views = getValue() || 0;
          return <span>{views.toLocaleString()}</span>;
        },
      },
      {
        accessorKey: "avg_watch_time",
        header: "Average Watch Time",
        cell: ({ getValue }: { getValue: () => any }) => {
          const seconds = getValue() || 0;
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          return (
            <span>
              {minutes > 0 ? `${minutes}m ` : ""}
              {remainingSeconds.toFixed(1)}s
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
    ],
    []
  );

  const handleRowClick = (row: any) => {
    router.push(`/sessions/${row.id}`);
  };
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <Heading>Session Maker</Heading>
          <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md">
            Create and manage your sessions in one place.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          {selectedSessions.length > 0 && (
            <button
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="inline-flex items-center gap-2 cursor-pointer bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] hover:bg-gray-900"
            >
              <DeleteIcon className="h-4 w-4" />
              Delete Selected ({selectedSessions.length})
            </button>
          )}

          {/* Refresh Button */}
          <button
            onClick={loadSessions}
            disabled={loading}
            className={`inline-flex items-center gap-2 justify-center bg-white border border-gray-300 text-[#2C3444] px-3 py-[10px] rounded-md text-[14px] hover:bg-gray-100 transition ${
              loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
            title="Refresh Sessions"
          >
            Refresh
            <RefreshCw
              className={`h-4 w-4 transform transition ${
                loading ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* Create New Session */}
          <button
            onClick={() => setOpenModal(true)}
            className="inline-flex items-center gap-2 bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] hover:bg-gray-900 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Create New Session
          </button>
        </div>
      </div>

      <div className="flex justify-start mb-6">
        <div className="inline-flex bg-white rounded-md border border-gray-200 px-1 py-0.5 gap-[10px]">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`cursor-pointer py-2 text-[14px] text-[#5F6D7E] font-medium rounded-md focus:outline-none transition-colors duration-150
                whitespace-nowrap w-40 ${
                  activeFilter === f.key
                    ? "bg-[#2C3444] text-white"
                    : "bg-white text-[#5F6D7E] hover:bg-gray-100"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <Table<SessionType>
        data={filtered}
        columns={columns as any}
        onSelectionChange={handleSelectionChange}
        onRowClick={handleRowClick}
        pageSize={10}
        showCheckbox
        showActions
        isSelectable
        actions={sessionActions}
        isLoading={loading}
        key={`table-${filtered.length}`}
      />

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
          }
        }}
        onCancel={() => setIsconfirmModalOpen(false)}
        isLoading={deleting}
      />
      <ConfirmModal
        open={isBulkDeleteModalOpen}
        title="Delete selected sessions?"
        description={`You are about to delete ${selectedSessions.length} session(s). This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleteModalOpen(false)}
        isLoading={bulkDeleting}
      />
      <CreateSessionModal open={openModal} setOpen={setOpenModal} />
    </>
  );
}
