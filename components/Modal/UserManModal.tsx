"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { UserType } from "@/lib/types";

interface UserManModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode?: "create" | "edit";
  user?: UserType | null;
  defaultRole?: "Admin" | "SuperAdmin" | "User";
  onUserCreated?: (user: UserType) => void;
  onUserUpdated?: (user: UserType) => void;
}

export default function UserManModal({ 
  open, 
  setOpen,
  mode = "create",
  user = null,
  defaultRole = "User",
  onUserCreated,
  onUserUpdated
}: UserManModalProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: defaultRole,
    status: "Active"
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (mode === "edit" && user) {
        setForm({
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          role: user.role as any || defaultRole,
          status: user.status || "Active"
        });
      } else {
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          role: defaultRole,
          status: "Active"
        });
      }
      setError("");
    }
  }, [open, mode, user, defaultRole]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);

    try {
      if (!form.firstName || !form.lastName || !form.email) {
        throw new Error("First name, last name, and email are required");
      }

      if (mode === "create") {
        // Check if email exists first
        const { data: existingUser } = await supabase
          .from("users")
          .select("email")
          .eq("email", form.email)
          .maybeSingle();

        if (existingUser) throw new Error("Email already registered");

        // Create user directly in your users table without auth
        const newUser = {
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          role: form.role,
          status: form.status,
          created_at: new Date().toISOString(),
        };

        const { data, error: dbError } = await supabase
          .from("users")
          .insert(newUser)
          .select()
          .single();

        if (dbError) throw dbError;

        // Optionally send an invite email
        const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(form.email, {
          redirectTo: `${window.location.origin}/set-password`,
          data: {
            first_name: form.firstName,
            last_name: form.lastName
          }
        });

        if (inviteError) {
          console.warn("Invite email failed to send:", inviteError.message);
          // Don't fail the operation - just log it
        }

        onUserCreated?.(data);
        toast.success("User created successfully! Invitation email sent.");
      } else {
        if (!user) throw new Error("No user selected for editing");

        const updatedUser = {
          first_name: form.firstName,
          last_name: form.lastName,
          role: form.role,
          status: form.status,
          updated_at: new Date().toISOString(),
        };

        const { data, error: updateError } = await supabase
          .from("users")
          .update(updatedUser)
          .eq("id", user.id)
          .select();

        if (updateError) throw updateError;

        if (data && data[0]) {
          onUserUpdated?.(data[0]);
        }
      }

      setOpen(false);
    } catch (err: any) {
      setError(err.message);
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} user:`, err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        role: defaultRole,
        status: "Active"
      });
    }
    setOpen(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="max-w-md rounded-lg p-0"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-[#242B42] text-[18px] font-bold">
            {mode === "create" ? "Create New User" : "Edit User"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {error && <div className="text-red-500 text-sm py-2 text-center">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                placeholder="Enter first name"
                value={form.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                placeholder="Enter last name"
                value={form.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={mode === "edit"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="SuperAdmin">Super Admin</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={form.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t px-6 py-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            className="mr-2 text-[14px] font-medium text-[#475569] px-3 py-2 rounded-md"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#2E3545] text-[14px] font-medium text-white px-3 py-2 rounded-md"
          >
            {loading 
              ? mode === "create" ? "Creating..." : "Updating..."
              : mode === "create" ? "Create User" : "Update User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}