"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../../../../../context/AuthContext";
import { LeadCard } from "../_components/LeadCard";
import { SearchComponent } from "../_components/SearchInput";

const ITEMS_PER_PAGE = 20;

const LeadStatus = {
  OnProgress: "onprocess",
  Converted: "Converted",
  NotInterested: "notinterested",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState([]);
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { checkAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setError("");
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/leads?page=${currentPage}&limit=${ITEMS_PER_PAGE}&filter=${filter}`
      );
      setLeads(response.data.data.leads);
      setTotalPages(response.data.data.totalPages);
    } catch (error) {
      console.error("Error fetching leads:", error);
      setError("Failed to fetch leads");
      toast({
        title: "Error",
        description: "Failed to fetch leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter, checkAuth, router, toast]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (slug, newStatus) => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/leads/${slug}`, {
        type: newStatus,
      });
      setLeads(
        leads.map((lead) =>
          lead.slug === slug ? { ...lead, type: newStatus } : lead
        )
      );
      toast({
        title: "Success",
        description: "Lead status updated successfully",
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (slug) => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/leads/${slug}`);
      setLeads(leads.filter((lead) => lead.slug !== slug));
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    }
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setCurrentPage(1);
    // fetchLeads();
  };

  const renderLeadCard = (lead) => (
    <LeadCard
      key={lead.id}
      lead={lead}
      onStatusChange={handleStatusChange}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Leads</h1>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="w-full md:w-2/3">
          <SearchComponent
            apiEndpoint={`${process.env.NEXT_PUBLIC_API_URL}/leads/search`}
            renderCard={renderLeadCard}
            placeholder="Search leads by name, email, or phone."
          />
        </div>
        <Select onValueChange={handleFilterChange} value={filter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value={LeadStatus.OnProgress}>On Progress</SelectItem>
            <SelectItem value={LeadStatus.NotInterested}>
              Not Interested
            </SelectItem>
            <SelectItem value={LeadStatus.Converted}>Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ScrollArea className="h-[calc(100vh-200px)]">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-80 w-full bg-gray-300" />
            ))}
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : leads.length === 0 ? (
          <p className="text-gray-500">No leads found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {leads.map(renderLeadCard)}
          </div>
        )}
      </ScrollArea>
      <div className="flex justify-between items-center mt-6">
        <p className="text-sm text-gray-600">
          Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
          {Math.min(currentPage * ITEMS_PER_PAGE, leads.length)} of{" "}
          {leads.length} results
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
