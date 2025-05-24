"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import UserManModal from "@/components/Modal/UserManModal";
import { UserType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@/components/Table/types";
import { toast } from "sonner";

const UsersTable = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserCreated = (newUser: UserType) => {
    setUsers((prevUsers) => [newUser, ...prevUsers]);
    toast.success("User created successfully!");
  };

  const handleUserUpdated = (updatedUser: UserType) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );
    toast.success("User updated successfully!");
  };

  const handleDeleteUser = async (user: UserType) => {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);
      
      if (error) throw error;
      
      setUsers(prevUsers => prevUsers.filter((u) => u.id !== user.id));
      toast.success("User deleted successfully!");
    } catch (error) {
      toast.error("Error deleting user");
      console.error("Error deleting user:", error);
    }
  };

  const userActions = [
    {
      label: "View",
      icon: <Eye className="h-4 w-4" />,
      action: (user: UserType) => router.push(`/user-management/${user.id}`),
    },
    {
      label: "Edit",
      icon: <Pencil className="h-4 w-4" />,
      action: (user: UserType) => {
        setEditingUser(user);
        setOpenModal(true);
      },
    },
    {
      label: "Delete",
      icon: <Trash2 className="h-4 w-4" />,
      action: handleDeleteUser,
      variant: "destructive" as const,
    },
  ];

  const columns: ColumnDef<UserType>[] = [
    {
      accessorKey: "first_name",
      header: "First Name",
      enableSorting: true,
    },
    {
      accessorKey: "last_name",
      header: "Last Name",
      enableSorting: true,
    },
    {
      accessorKey: "email",
      header: "Email",
      enableSorting: true,
    },
    {
      accessorKey: "role",
      header: "Role",
      enableSorting: true,
    },
    {
      accessorKey: "status",
      header: "Status",
      enableSorting: true,
    },
  ];

  const handleRowSelect = (selectedRows: UserType[]) => {
    console.log("Selected rows:", selectedRows);
  };

  const handleRowClick = (row: UserType) => {
    console.log("Row clicked:", row);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <div>
          <Heading>User Management</Heading>
          <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md">
            Create and manage users in one place.
          </p>
        </div>

        <div>
          <button
            onClick={() => {
              setEditingUser(null);
              setOpenModal(true);
            }}
            type="button"
            className="inline-flex items-center gap-2 bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] font-medium hover:bg-gray-900 transition"
          >
            <Plus className="h-4 w-4" />
            Add New User
          </button>
        </div>
      </div>

      <Table<UserType>
        data={users}
        columns={columns}
        onRowSelect={handleRowSelect}
        onRowClick={handleRowClick}
        pageSize={5}
        showCheckbox={true}
        showActions={true}
        isSelectable={true}
        actions={userActions}
      />

      <UserManModal
        open={openModal}
        setOpen={setOpenModal}
        mode={editingUser ? "edit" : "create"}
        user={editingUser}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    </>
  );
};

export default UsersTable;