"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import CreateSessionModal from "../../components/Modal/CreateSessionModal";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
type Sessions = {
  id: string;
  title: string;
  session_type: string;
  created_by: string;
  created_at: string;
};
const SessionsTable = () => {
  const [openModal, setOpenModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  const router = useRouter();
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user) throw new Error('Not authenticated');

      // Fetch sessions
      const { data: sessionsData, error } = await supabase
        .from("sessions")
        .select("id, title, session_type, created_at")
        .eq("created_by", "826e31ef-0431-4762-af43-c501e3898cc3")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each session, get stats
      const sessionsWithStats = await Promise.all(
        (sessionsData || []).map(async (session) => {
          // For linear sessions, count modules
          if (session.session_type === "linear") {
            const { count: moduleCount } = await supabase
              .from("modules")
              .select("id", { count: "exact", head: true })
              .eq("session_id", session.id);

            const { count: videoCount } = await supabase
              .from("videos")
              .select("id", { count: "exact", head: true })
              .eq("session_id", session.id);

            return {
              ...session,
              module_count: moduleCount || 0,
              video_count: videoCount || 0,
            };
          } else {
            // For interactive sessions, count videos
            const { count: videoCount } = await supabase
              .from("videos")
              .select("id", { count: "exact", head: true })
              .eq("session_id", session.id);

            return {
              ...session,
              video_count: videoCount || 0,
            };
          }
        })
      );

      setSessions(sessionsWithStats);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "title" as keyof Session,
      header: "Session Name",
      enableSorting: true,
    },
    {
      accessorKey: "id" as keyof Session,
      header: "Session Name",
      enableSorting: true,
    },
    {
      accessorKey: "type" as keyof Session,
      header: "Type",
      cell: ({ getValue }: { getValue: () => any }) => (
        <span className="capitalize">{getValue()}</span>
      ),
    },
    {
      accessorKey: "status" as keyof Session,
      header: "Status",
      enableSorting: true,
    },
    {
      accessorKey: "startDate" as keyof Session,
      header: "Start Date",
      enableSorting: true,
    },
    {
      accessorKey: "endDate" as keyof Session,
      header: "End Date",
      enableSorting: true,
    },
  ];

  const handleRowSelect = (selectedRows: Sessions[]) => {
    console.log("Selected rows:", selectedRows);
  };

  const handleRowClick = (row: Sessions) => {
    router.push(`sessions/${row.id}`);
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

      <Table<Sessions>
        data={sessions}
        columns={columns}
        onRowSelect={handleRowSelect}
        onRowClick={handleRowClick}
        pageSize={5}
        showCheckbox={true}
        showActions={true}
        isSelectable={true}
      />

      <CreateSessionModal open={openModal} setOpen={setOpenModal} />
    </>
  );
};

export default SessionsTable;
