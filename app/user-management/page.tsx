"use client";

import Heading from "@/components/Heading";
import Table from "@/components/Table/Table";
import { EyeIcon, EditIcon, Plus, DeleteIcon } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import UserManModal from "@/components/Modal/UserManModal";
import { UserType } from "@/lib/types";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@/components/Table/types";
import { toast } from "sonner";
import { showToast } from "@/components/toast";

const UsersTable = () => {
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableKey, setTableKey] = useState(0); 
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setTableLoading(false);
      setLoading(false);
    }
  };

  const handleUserCreated = (newUser: UserType) => {
    setUsers((prevUsers) => [newUser, ...prevUsers]);
    setTableKey(prev => prev + 1); // Update key to force re-render
    showToast("success", "User created successfully!");
  };

  const handleUserUpdated = (updatedUser: UserType) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === updatedUser.id ? { ...user, ...updatedUser } : user
      )
    );
    setTableKey(prev => prev + 1); 
    showToast("success", "User updated successfully!");
    handleCloseModal();
  window.location.reload(); 
  };

  const handleDeleteUser = async (user: UserType) => {
    try {
      const { error } = await supabase
        .from("users")
        .delete()
        .eq("id", user.id);
      
      if (error) throw error;
      
      setUsers(prevUsers => prevUsers.filter((u) => u.id !== user.id));
      setTableKey(prev => prev + 1); // Update key to force re-render
      showToast("success", "User deleted successfully!");
    } catch (error) {
      showToast("error", "Error deleting user");
      console.error("Error deleting user:", error);
    }
  };

  const handleOpenModal = (user: UserType | null = null) => {
    setEditingUser(user);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditingUser(null);
  };

  const userActions = useMemo(() => [
    {
      label: "View",
      icon: <EyeIcon className="h-4 w-4" />,
      action: (user: UserType) => router.push(`/user-management/${user.id}`),
    },
    {
      label: "Edit",
      icon: <EditIcon className="h-4 w-4" />,
      action: (user: UserType) => handleOpenModal(user),
    },
    {
      label: "Delete",
      icon: <DeleteIcon className="h-4 w-4 text-[#505568]" />,
      action: handleDeleteUser,
      variant: "destructive" as const,
    },
  ], [router]);

  const columns: ColumnDef<UserType>[] = useMemo(() => [
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
    // {
    //   accessorKey: "role",
    //   header: "Role",
    //   enableSorting: true,
    // },
    // {
    //   accessorKey: "status",
    //   header: "Status",
    //   enableSorting: true,
    // },
    // {
    //   accessorKey: "updated_at",
    //   header: "Last Updated",
    //   cell: ({ getValue }) => {
    //     const value = getValue() as string;
    //     return value ? new Date(value).toLocaleString() : "Never";
    //   },
    // },
  ], []);

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
          <Heading>Company Management</Heading>
          <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md">
            Create and manage companies in one place.
          </p>
        </div>

        <div>
          <button
            onClick={() => handleOpenModal()}
            type="button"
            className="inline-flex items-center gap-2 bg-[#2C3444] text-white px-3 py-[10px] rounded-md text-[14px] font-medium hover:bg-gray-900 transition"
          >
             
            <Plus className="h-4 w-4" />
            Add New Company {/*TODO:  later we can convert this to users  since we have ot be able to add both company and affiliated users  */}
          </button>
        </div>
      </div>

      <Table<UserType>
        key={`users-table-${tableKey}`}
        data={users}
        columns={columns}
        onRowSelect={handleRowSelect}
        onRowClick={handleRowClick}
        pageSize={10}
        showCheckbox={true}
        showActions={true}
        isSelectable={true}
        actions={userActions}
        isLoading={tableLoading}
      />

      <UserManModal
        open={openModal}
        setOpen={handleCloseModal}
        mode={editingUser ? "edit" : "create"}
        user={editingUser}
        onUserCreated={handleUserCreated}
        onUserUpdated={handleUserUpdated}
      />
    </>
  );
};

export default UsersTable;