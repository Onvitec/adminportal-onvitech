"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  Calendar,
  Clock,
  User,
  Video,
  Building,
} from "lucide-react";
import { UserType } from "@/lib/types";
import { exportLeadsToCSV, exportLeadToPDF } from "@/lib/helper";

interface FormSubmission {
  id: string;
  session_id: string;
  company_id: string;
  form_title: string;
  form_data: Record<string, any>;
  user_journey: {
    sessionId: string;
    steps: Array<{
      videoId: string;
      videoTitle: string;
      clickedElement?: {
        id: string;
        label: string;
        type: "button" | "form" | "restart";
      };
      timestamp: number;
    }>;
  };
  journey_summ: string;
  created_at: string;
  sessions: {
    title: string;
    created_at: string;
    total_views: number;
  };
}

interface Session {
  id: string;
  title: string;
  created_at: string;
  total_views: number;
}

interface Company {
  id: string;
  name: string;
  email: string;
}

export default function CompanyLeadsPage({ companyId }: { companyId: string }) {
  const [leads, setLeads] = useState<FormSubmission[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string>("all");

  useEffect(() => {
    fetchCompanyData();
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);

      // Fetch company details
      const { data: companyData, error: companyError } = await supabase
        .from("users")
        .select("id, first_name, email")
        .eq("id", companyId)
        .single();

      if (companyError) throw companyError;
      setCompany(companyData as any);

      // Fetch all sessions for this company
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select("id, title, created_at, total_views")
        .eq("associated_with", companyId)
        .order("created_at", { ascending: false });

      if (sessionsError) throw sessionsError;
      setSessions(sessionsData || []);

      // Fetch all leads for company's sessions
      await fetchLeads(companyId, "all");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async (
    companyId: string,
    sessionFilter: string = "all"
  ) => {
    try {
      let query = supabase
        .from("leads")
        .select(
          `
          *,
          sessions (
            title,
            created_at,
            total_views
          )
        `
        )
        .eq("company_id", companyId);

      // Filter by specific session if needed
      if (sessionFilter !== "all") {
        query = query.eq("session_id", sessionFilter);
      }

      const { data: leadsData, error: leadsError } = await query.order(
        "created_at",
        { ascending: false }
      );
      console.log("DATAAA", leadsData);

      if (leadsError) throw leadsError;
      setLeads(leadsData || []);
    } catch (err) {
      console.error("Error fetching leads:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch leads");
    }
  };

  const handleSessionFilter = (sessionId: string) => {
    setSelectedSession(sessionId);
    fetchLeads(companyId, sessionId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getDuration = (start: number, end: number) => {
    const durationMs = end - start;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-lg font-semibold">Error</p>
          <p className="mt-2">{error}</p>
          <button
            onClick={fetchCompanyData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Building className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Leads Management
            </h1>
          </div>
          {company && (
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{company.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{company.email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Stats and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {leads.length}
                </p>
                <p className="text-sm text-gray-600">Total Leads</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {sessions.length}
                </p>
                <p className="text-sm text-gray-600">Active Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {sessions.reduce(
                    (total, session) => total + (session.total_views || 0),
                    0
                  )}
                </p>
                <p className="text-sm text-gray-600">Total Views</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-4">
                {/* Export Controls */}

                <label className="text-sm font-medium text-gray-700">
                  Filter by Session:
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => handleSessionFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Sessions</option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() =>
                    exportLeadsToCSV(
                      leads,
                      selectedSession === "all"
                        ? "all-leads"
                        : `session-${selectedSession}-leads`
                    )
                  }
                  className="flex items-center gap-2 border px-3 py-2 cursor-pointer rounded text-sm font-medium transition-colors"
                >
                  {/* CSV Icon */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="16"
                      rx="2"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                    />
                    <text
                      x="7"
                      y="16"
                      fontSize="8"
                      fill="currentColor"
                      fontFamily="Arial, Helvetica, sans-serif"
                    >
                      CSV
                    </text>
                  </svg>
                  Export Leads
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {leads.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No leads found
              </h3>
              <p className="text-gray-600">
                {selectedSession === "all"
                  ? "No form submissions have been received for any of your sessions yet."
                  : "No form submissions have been received for this session yet."}
              </p>
            </div>
          ) : (
            leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Lead Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    setExpandedLead(expandedLead === lead.id ? null : lead.id)
                  }
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {expandedLead === lead.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {lead.form_title || "Form Submission"}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Video className="h-4 w-4" />
                            <span>{lead.sessions?.title}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(lead.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          exportLeadToPDF(lead);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 rounded-md text-sm font-medium text-blue-700 transition-colors border border-blue-200 shadow-sm"
                        title="Download PDF"
                      >
                        {/* PDF Icon */}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <rect
                            x="4"
                            y="3"
                            width="16"
                            height="18"
                            rx="2"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                          />
                          <text
                            x="8"
                            y="17"
                            fontSize="7"
                            fill="currentColor"
                            fontFamily="Arial, Helvetica, sans-serif"
                          >
                            PDF
                          </text>
                        </svg>
                        Download PDF
                      </button>
                      <div className="text-xs text-gray-500 mt-1">
                        {lead.user_journey?.steps?.length || 0} steps
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedLead === lead.id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Form Data */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Mail className="h-5 w-5" />
                          Form Submission Data
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          {lead.form_data &&
                          Object.keys(lead.form_data).length > 0 ? (
                            <div className="space-y-3">
                              {Object.entries(lead.form_data).map(
                                ([key, value]) => (
                                  <div
                                    key={key}
                                    className="border-b border-gray-100 pb-2 last:border-0"
                                  >
                                    <div className="text-sm font-medium text-gray-900 capitalize">
                                      {key.replace(/_/g, " ")}
                                    </div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      {Array.isArray(value)
                                        ? value.join(", ")
                                        : String(value)}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              No form data available
                            </p>
                          )}
                        </div>
                      </div>

                      {/* User Journey */}
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Clock className="h-5 w-5" />
                          User Journey
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          {lead.user_journey?.steps &&
                          lead.user_journey.steps.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {lead.user_journey.steps.map((step, index) => (
                                <div
                                  key={index}
                                  className="flex gap-3 border-b border-gray-100 pb-3 last:border-0"
                                >
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-medium text-blue-600">
                                      {index + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="text-sm font-medium text-gray-900">
                                          {step.videoTitle}
                                        </p>
                                        {step.clickedElement && (
                                          <p className="text-sm text-gray-600 mt-1">
                                            Clicked:{" "}
                                            <span className="font-medium">
                                              {step.clickedElement.label}
                                            </span>
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                        {formatTimestamp(step.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              No journey data available
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Journey Summary */}
                    {lead.journey_summ && (
                      <div className="mt-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">
                          Journey Summary
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <p className="text-sm text-gray-700">
                            {lead.journey_summ}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
