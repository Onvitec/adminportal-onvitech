"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { Eye, Pencil, Plus, Share2, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import CreateSessionModal from "../../components/Modal/CreateSessionModal";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { SessionType } from "@/lib/types";
import { Share } from "next/font/google";
import { fetchSessions } from "@/repos/sessions";

const SessionsTable = () => {
  const [openModal, setOpenModal] = useState(false);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSessions().then((sessionsData: any) => {
      setSessions(sessionsData as SessionType[]);
      setLoading(false);
    });
  }, []);

  const sessionActions = [
    {
      label: "View Session",
      icon: <Eye className="h-4 w-4" />,
      action: (session: SessionType) => router.push(`sessions/${session.id}`),
    },
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      action: (session: SessionType) =>
        router.push(`sessions/edit/${session.id}`),
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      action: (session: SessionType) => console.log("Delete", session),
      variant: "outline" as const,
    },
    {
      label: "Share Session",
      icon: <Share2 className="h-4 w-4" />,
      action: (session: SessionType) =>
        navigator.clipboard.writeText(
          `${process.env.NEXT_PUBLIC_FRONTEND_URL}/sessions/embed/${session.id}`
        ),
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
      header: "Start Date",
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

  const handleRowSelect = (selectedRows: SessionType[]) => {
    console.log("Selected rows:", selectedRows);
  };

  const handleRowClick = (row: SessionType) => {
    // router.push(`sessions/${row.id}`);
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

        <div>
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
        onRowSelect={handleRowSelect}
        onRowClick={handleRowClick}
        pageSize={5}
        showCheckbox={true}
        showActions={true}
        isSelectable={true}
        actions={sessionActions}
        isLoading={loading}
      />

      <CreateSessionModal open={openModal} setOpen={setOpenModal} />
    </>
  );
};

export default SessionsTable;
