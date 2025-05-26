"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Camera,
  Users,
  Activity,
  ArrowUp,
  ArrowDown,
  Eye,
  Pencil,
  Plus,
  Share2,
  Trash2,
} from "lucide-react";
import Heading from "@/components/Heading";
import { useSession } from "@/components/session-provider";
import CleanBarChart from "@/components/charts/LineChart";
import Table from "@/components/Table/Table";
import { SessionType } from "@/lib/types";
import { ColumnDef } from "@/components/Table/types";
import SessionPieChart from "@/components/charts/PieChart";

export default function DashboardPage() {
  const { user, signOut } = useSession();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionType[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/signup");
      } else {
        setLoading(false);
        fetchSessions();
      }
    });
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      // const { data: { user } } = await supabase.auth.getUser();
      // if (!user) throw new Error('Not authenticated');

      // Fetch sessions
      const { data: sessionsData, error } = await supabase
        .from("sessions")
        .select("*")
        // .eq("created_by", "826e31ef-0431-4762-af43-c501e3898cc3")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // For each session, get stats
      // Uncomment this when you need video count or stuff
      // const sessionsWithStats = await Promise.all(
      //   (sessionsData || []).map(async (session) => {
      //     // For linear sessions, count modules
      //     if (session.session_type === "linear") {
      //       const { count: moduleCount } = await supabase
      //         .from("modules")
      //         .select("id", { count: "exact", head: true })
      //         .eq("session_id", session.id);

      //       const { count: videoCount } = await supabase
      //         .from("videos")
      //         .select("id", { count: "exact", head: true })
      //         .eq("session_id", session.id);

      //       return {
      //         ...session,
      //         module_count: moduleCount || 0,
      //         video_count: videoCount || 0,
      //       };
      //     } else {
      //       // For interactive sessions, count videos
      //       const { count: videoCount } = await supabase
      //         .from("videos")
      //         .select("id", { count: "exact", head: true })
      //         .eq("session_id", session.id);

      //       return {
      //         ...session,
      //         video_count: videoCount || 0,
      //       };
      //     }
      //   })
      // );

      setSessions(sessionsData as SessionType[]);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

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
    router.push(`sessions/${row.id}`);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-4">
      <Heading>Hey there, {user?.username}</Heading>
      <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md">
        Welcome back, we're happy to have you here!{" "}
      </p>
      <div className="grid gap-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1 md:mt-8 mt-4">
        {/* Total Sessions Box */}
        <div className="border rounded-lg px-4 py-6 flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-4">
            <div className="bg-[#6195BA] w-10 h-10 rounded-sm flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#272D37]">850</p>
              <p className="text-sm font-medium text-[#5F6D7E]">
                Total Session
              </p>
            </div>
          </div>
          <div className="flex items-center text-green-500">
            <ArrowUp className="w-4 h-4" />
            <span className="text-[16px] font-semibold ml-1">1.5%</span>
          </div>
        </div>

        {/* Active Sessions Box */}
        <div className="border rounded-lg p-4 flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-4">
            <div className="bg-[#6195BA] w-10 h-10 rounded-sm flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#272D37]">342</p>
              <p className="text-sm text-[#5F6D7E] font-medium">
                Active Session
              </p>
            </div>
          </div>
          <div className="flex items-center text-green-500">
            <ArrowUp className="w-4 h-4" />
            <span className="text-[16px] font-semibold ml-1">2.1%</span>
          </div>
        </div>

        {/* Total Users Box */}
        <div className="border rounded-lg p-4 flex items-center justify-between bg-[#FFFFFF]">
          <div className="flex items-center gap-4">
            <div className="bg-[#6195BA] w-10 h-10 rounded-sm flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#272D37]">1,248</p>
              <p className="text-sm text-[#5F6D7E] font-medium">Total Users</p>
            </div>
          </div>
          <div className="flex items-center text-red-500">
            <ArrowDown className="w-4 h-4" />
            <span className="text-[16px] font-semibold ml-1">0.3%</span>
          </div>
        </div>
      </div>

      {/* charts */}
      <div className="bg-white p-6 rounded-lg shadow-[0_1px_2px_0_rgba(16,24,40,0.04)] md:mt-6 mt-4">
        <h2 className="text-lg font-semibold mb-4">Analytics Overview</h2>
        <CleanBarChart />
      </div>

      {/* table and piechart - Fixed 70-30 split */}
      <div className="flex flex-col md:flex-row gap-4 w-full mt-6">
        {/* Left side - 70% width with Sessions Table */}
        <div className="w-full md:w-[70%] bg-white rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-semibold">Sessions</h2>
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
        </div>

        {/* Right side - 30% width */}
        <div className="w-full md:w-[30%] bg-white rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Session Status</h2>
          <SessionPieChart />
        </div>
      </div>
    </div>
  );
}
