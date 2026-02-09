import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "./use-toast";

interface DailySummary {
  date: Date;
  totalSales: number;
  totalExpenses: number;
  netProfit: number;
  newBorrowings: number;
  collectionsMade: number;
  overdueCount: number;
  summary: string;
}

export function useDailySummary() {
  const { toast } = useToast();
  const [scheduledTime, setScheduledTime] = useState<{ hour: number; minute: number } | null>(null);

  // Fetch today's summary
  const todaySummaryQuery = useQuery({
    queryKey: ["daily-summary", "today"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/daily-summary/today", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch today's summary");
      return res.json() as Promise<DailySummary>;
    },
  });

  // Fetch weekly summary
  const weeklySummaryQuery = useQuery({
    queryKey: ["daily-summary", "weekly"],
    queryFn: async () => {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/daily-summary/weekly", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch weekly summary");
      return res.json();
    },
  });

  // Send summary mutation
  const sendSummaryMutation = useMutation({
    mutationFn: async (phoneNumber: string) => {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/daily-summary/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ phoneNumber }),
      });
      if (!res.ok) throw new Error("Failed to send summary");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Daily summary sent successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send daily summary",
        variant: "destructive",
      });
    },
  });

  // Schedule daily summary mutation
  const scheduleSummaryMutation = useMutation({
    mutationFn: async (data: { phoneNumber: string; hour: number; minute: number }) => {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/daily-summary/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to schedule summary");
      return res.json();
    },
    onSuccess: (data: any) => {
      setScheduledTime({ hour: 20, minute: 0 }); // Default time
      toast({
        title: "Success",
        description: `Daily summary scheduled for ${data.scheduling.scheduledFor}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule daily summary",
        variant: "destructive",
      });
    },
  });

  // Auto-refresh today's summary every minute
  useEffect(() => {
    const interval = setInterval(() => {
      todaySummaryQuery.refetch();
    }, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [todaySummaryQuery]);

  return {
    // Today's summary
    todaySummary: todaySummaryQuery.data,
    todaySummaryLoading: todaySummaryQuery.isLoading,
    todaySummaryError: todaySummaryQuery.error,
    refetchToday: todaySummaryQuery.refetch,

    // Weekly summary
    weeklySummary: weeklySummaryQuery.data,
    weeklySummaryLoading: weeklySummaryQuery.isLoading,
    weeklySummaryError: weeklySummaryQuery.error,
    refetchWeekly: weeklySummaryQuery.refetch,

    // Send summary
    sendSummary: sendSummaryMutation.mutate,
    sendSummaryLoading: sendSummaryMutation.isPending,

    // Schedule summary
    scheduleSummary: (phoneNumber: string, hour: number = 20, minute: number = 0) => {
      scheduleSummaryMutation.mutate({ phoneNumber, hour, minute });
    },
    scheduleSummaryLoading: scheduleSummaryMutation.isPending,
    scheduledTime,
  };
}
