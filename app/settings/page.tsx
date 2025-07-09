"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "@/components/session-provider";
import { showToast } from "@/components/toast";
import Heading from "@/components/Heading";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EyeOffIcon } from "lucide-react";
import { EyeIcon } from "@/components/icons";

export default function SettingsPage() {
  const { user } = useSession();
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Basic info form state
  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleBasicInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const resetBasicInfo = () => {
    setFormData({
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    });
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const updateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // Update in auth metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          first_name: formData.first_name,
          last_name: formData.last_name,
        }
      });
      
      if (authError) throw authError;
      
      // Update in users table
      const { error: dbError } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
        })
        .eq("id", user.id);
        
      if (dbError) throw dbError;
      
      showToast("success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast("error", "New passwords don't match");
      return;
    }
    
    setPasswordLoading(true);
    try {
      // First reauthenticate with current password
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });
      
      if (authError) throw authError;
      
      // Then update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      
      if (updateError) throw updateError;
      
      showToast("success", "Password updated successfully!");
      resetPasswordForm();
    } catch (error) {
      console.error("Error updating password:", error);
      showToast("error", "Failed to update password. Please check your current password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Heading>General Settings</Heading>
        <p className="mt-2 text-[16px] font-normal text-[#5F6D7E] max-w-md">
Your current Primary email address is <span className="text-[#ccdeea]">{user?.email}</span>.      </p>
      </div>

      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-[22px] font-bold mb-1">Basic Information</h2>
          <p className="mb-4 text-[#5F6D7E] text-[14px] font-normal">Update some personal information. </p>
          <form onSubmit={updateBasicInfo} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleBasicInfoChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleBasicInfoChange}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleBasicInfoChange}
                disabled
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetBasicInfo}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>

        {/* Change Password Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-[22px] font-bold mb-1">Change Your Password</h2>
          <p className="mb-4 text-[#5F6D7E] text-[14px] font-normal">Your current Primary email address is <span className="text-[#ccdeea]">{user?.email}</span>. </p>
          <form onSubmit={updatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  placeholder="Enter Your Current Password"
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? (
                    <EyeOffIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                     placeholder="Enter Your Password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                     placeholder="Enter Your Password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOffIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetPasswordForm}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}