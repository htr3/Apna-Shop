import React, { useState } from "react";
import { useDailySummary } from "../hooks/use-daily-summary";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Loader2, Send, Clock, TrendingUp, TrendingDown } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export function DailySummaryPanel() {
  const {
    todaySummary,
    todaySummaryLoading,
    weeklySummary,
    weeklySummaryLoading,
    sendSummary,
    sendSummaryLoading,
    scheduleSummary,
    scheduleSummaryLoading,
    scheduledTime,
  } = useDailySummary();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [scheduleHour, setScheduleHour] = useState("20");
  const [scheduleMinute, setScheduleMinute] = useState("00");

  const handleSendSummary = () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }
    sendSummary(phoneNumber);
  };

  const handleScheduleSummary = () => {
    if (!phoneNumber.trim()) {
      alert("Please enter a phone number");
      return;
    }
    scheduleSummary(phoneNumber, parseInt(scheduleHour), parseInt(scheduleMinute));
    setPhoneNumber("");
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
        </TabsList>

        {/* Today's Summary Tab */}
        <TabsContent value="today" className="space-y-4">
          {todaySummaryLoading ? (
            <Card className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </Card>
          ) : todaySummary ? (
            <>
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">Today's Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Sales Card */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Sales</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{todaySummary.totalSales.toFixed(2)}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-500" />
                    </div>
                  </div>

                  {/* Expenses Card */}
                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Expenses</p>
                        <p className="text-2xl font-bold text-orange-600">
                          ₹{todaySummary.totalExpenses.toFixed(2)}
                        </p>
                      </div>
                      <TrendingDown className="h-8 w-8 text-orange-500" />
                    </div>
                  </div>

                  {/* Profit Card */}
                  <div
                    className={`p-4 rounded-lg border ${
                      todaySummary.netProfit >= 0
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Net Profit</p>
                        <p
                          className={`text-2xl font-bold ${
                            todaySummary.netProfit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          ₹{todaySummary.netProfit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Collections Card */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div>
                      <p className="text-sm text-gray-600">Collections Made</p>
                      <p className="text-2xl font-bold text-purple-600">
                        ₹{todaySummary.collectionsMade.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* New Borrowings Card */}
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <div>
                      <p className="text-sm text-gray-600">New Borrowings</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        {todaySummary.newBorrowings}
                      </p>
                    </div>
                  </div>

                  {/* Overdue Card */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div>
                      <p className="text-sm text-gray-600">Overdue Payments</p>
                      <p className="text-2xl font-bold text-red-600">
                        {todaySummary.overdueCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Send Summary Section */}
                <div className="border-t pt-4 mt-4 space-y-2">
                  <p className="text-sm font-medium">Send Summary</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendSummary}
                      disabled={sendSummaryLoading}
                      size="sm"
                    >
                      {sendSummaryLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Full Summary Text */}
              <Card className="p-6 bg-gray-50">
                <p className="text-sm whitespace-pre-wrap font-mono text-gray-700">
                  {todaySummary.summary}
                </p>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Weekly Summary Tab */}
        <TabsContent value="weekly" className="space-y-4">
          {weeklySummaryLoading ? (
            <Card className="p-8 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </Card>
          ) : weeklySummary ? (
            <>
              <Card className="p-6 space-y-4">
                <h3 className="text-lg font-semibold">
                  Weekly Summary ({weeklySummary.week})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ₹{weeklySummary.totalSales.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                    <p className="text-sm text-gray-600">Total Expenses</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ₹{weeklySummary.totalExpenses.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600">Total Profit</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{weeklySummary.totalProfit.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <p className="text-sm text-gray-600">Avg Daily Sales</p>
                    <p className="text-2xl font-bold text-purple-600">
                      ₹{weeklySummary.averageDailySales.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                    <p className="text-sm text-gray-600">Best Day</p>
                    <p className="text-sm text-indigo-600">
                      {new Date(weeklySummary.bestDay.date).toLocaleDateString()}
                    </p>
                    <p className="text-xl font-bold text-indigo-600">
                      ₹{weeklySummary.bestDay.totalSales.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <p className="text-sm text-gray-600">Worst Day</p>
                    <p className="text-sm text-red-600">
                      {new Date(weeklySummary.worstDay.date).toLocaleDateString()}
                    </p>
                    <p className="text-xl font-bold text-red-600">
                      ₹{weeklySummary.worstDay.totalSales.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Daily Breakdown */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-3">Daily Breakdown</p>
                  <div className="space-y-2">
                    {weeklySummary.dailySummaries.map((daily: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm">
                          {new Date(daily.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          })}
                        </span>
                        <span className="text-sm font-semibold">
                          ₹{daily.totalSales.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weekly Sales Chart */}
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-4">Daily Sales Trend</p>
                  <div className="h-[300px] w-full bg-gray-50 rounded-lg border">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={weeklySummary.dailySummaries.map((daily: any) => ({
                          date: new Date(daily.date).toLocaleDateString("en-US", {
                            weekday: "short",
                          }),
                          sales: Number(daily.totalSales.toFixed(2)),
                        }))}
                        margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="#94a3b8"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `₹${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                          }}
                          formatter={(value) => [`₹${value}`, 'Sales']}
                        />
                        <Bar
                          dataKey="sales"
                          fill="#3b82f6"
                          radius={[8, 8, 0, 0]}
                          animationDuration={500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </Card>
            </>
          ) : null}
        </TabsContent>

        {/* Schedule Summary Tab */}
        <TabsContent value="schedule" className="space-y-4">
          <Card className="p-6 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Daily Summary
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-2">Phone Number</label>
                <Input
                  placeholder="Enter your phone number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">Hour (0-23)</label>
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={scheduleHour}
                    onChange={(e) => setScheduleHour(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium block mb-2">Minute (0-59)</label>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={scheduleMinute}
                    onChange={(e) => setScheduleMinute(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-blue-700">
                📅 Summary will be sent every day at {scheduleHour.padStart(2, "0")}:
                {scheduleMinute.padStart(2, "0")}
              </div>

              <Button
                onClick={handleScheduleSummary}
                disabled={scheduleSummaryLoading}
                className="w-full"
              >
                {scheduleSummaryLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Schedule Daily Summary
                  </>
                )}
              </Button>

              {scheduledTime && (
                <div className="bg-green-50 p-3 rounded border border-green-200 text-sm text-green-700">
                  ✅ Summary scheduled for {scheduledTime.hour}:{scheduledTime.minute
                    .toString()
                    .padStart(2, "0")} daily
                </div>
              )}
            </div>

            <div className="border-t pt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">About Daily Summaries:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Automated end-of-day reports sent via WhatsApp/SMS</li>
                <li>Includes sales, expenses, collections, and borrowing data</li>
                <li>Helps you track business performance instantly</li>
                <li>Schedule for any time that works best for you</li>
              </ul>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
