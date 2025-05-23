"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { Plus } from "lucide-react";
import { useState } from "react";
import CreateSessionModal from "../../components/Modal/CreateSessionModal";

interface Session {
  id: string;
  name: string;
  type: "linear" | "flow";
  status: "completed" | "in progress";
  startDate: string;
  endDate: string;
}

const SessionsTable = () => {
  const [openModal, setOpenModal] = useState(false);

  const sessions: Session[] = [
    {
      id: "1",
      name: "Introduction to React",
      type: "linear",
      status: "completed",
      startDate: "2023-05-01",
      endDate: "2023-05-10",
    },
    {
      id: "2",
      name: "Advanced State Management",
      type: "flow",
      status: "in progress",
      startDate: "2023-05-15",
      endDate: "2023-05-25",
    },
  ];

  const columns = [
    {
      accessorKey: "name" as keyof Session,
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

  const handleRowSelect = (selectedRows: Session[]) => {
    console.log("Selected rows:", selectedRows);
  };

  const handleRowClick = (row: Session) => {
    console.log("Row clicked:", row);
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

      <Table<Session>
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
