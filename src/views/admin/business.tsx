"use client";

import { AdminLayout } from "../../components/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  PoundSterling,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  adminDashboardStats,
  newsletterAggregateStats,
} from "../../data/admin-data";

const CHART_COLORS = ["#4B5B32", "#B5C49B", "#2E1F33", "#828a6e"];

export function AdminBusiness() {
  const stats = adminDashboardStats;

  return (
    <AdminLayout title="Business Overview - Shruti Turner">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl text-[#2E1F33]">Business Overview</h1>
          <p className="text-muted-foreground mt-1">
            Revenue, membership, and growth metrics.
          </p>
        </div>

        {/* Financial KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Members
                  </p>
                  <p className="text-3xl text-[#2E1F33] mt-1">
                    {stats.activeMembers}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {stats.totalMembers} total
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#4B5B32]/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Monthly Recurring
                  </p>
                  <p className="text-3xl text-[#2E1F33] mt-1">
                    £{stats.monthlyRecurringRevenue}
                  </p>
                  <p className="text-xs text-[#4B5B32] mt-1">
                    +{stats.newMembersThisMonth} new this month
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#4B5B32]/10 flex items-center justify-center">
                  <PoundSterling className="w-6 h-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Newsletter Open Rate
                  </p>
                  <p className="text-3xl text-[#2E1F33] mt-1">
                    {newsletterAggregateStats.avgOpenRate}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {newsletterAggregateStats.totalSubscribers} subscribers
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#4B5B32]/10 flex items-center justify-center">
                  <UserPlus className="w-6 h-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Churn Rate</p>
                  <p className="text-3xl text-[#2E1F33] mt-1">
                    {stats.churnRate}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">monthly</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-[#4B5B32]/10 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#4B5B32]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projected Revenue */}
        <Card className="bg-[#4B5B32] text-[#FAFAF8]">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">
                  Projected Revenue (Next 30 Days)
                </p>
                <p className="text-3xl font-medium mt-1">
                  £{(stats.monthlyRecurringRevenue * 1.05).toFixed(0)}
                </p>
                <p className="text-xs opacity-70 mt-1">
                  Based on current bookings and active memberships
                </p>
              </div>
              <div className="bg-[#FAFAF8]/10 p-3 rounded-full">
                <TrendingUp className="w-6 h-6 text-[#FAFAF8]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue + Membership breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by source */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl text-[#2E1F33] mb-4">
                £{stats.totalRevenue30d.toLocaleString()}
              </p>
              <div className="space-y-3">
                {stats.revenueBySource.map((item) => (
                  <div key={item.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.source}</span>
                      <span>£{item.amount}</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4B5B32] rounded-full"
                        style={{
                          width: `${(item.amount / stats.totalRevenue30d) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Membership breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Membership Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={stats.membershipBreakdown}
                        dataKey="count"
                        nameKey="plan"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={40}
                      >
                        {stats.membershipBreakdown.map((_, i) => (
                          <Cell
                            key={i}
                            fill={CHART_COLORS[i % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-3">
                  {stats.membershipBreakdown.map((item, i) => (
                    <div key={item.plan} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            CHART_COLORS[i % CHART_COLORS.length],
                        }}
                      />
                      <div className="flex-1 flex justify-between">
                        <span className="text-sm">{item.plan}</span>
                        <span className="text-sm text-muted-foreground">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance + Subscriber growth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance trends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Weekly Attendance vs Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.classAttendance}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(46,31,51,0.1)"
                    />
                    <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar
                      dataKey="capacity"
                      fill="#B5C49B"
                      name="Capacity"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="attendance"
                      fill="#4B5B32"
                      name="Attendance"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Subscriber growth */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subscriber Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={newsletterAggregateStats.subscriberGrowth}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(46,31,51,0.1)"
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#4B5B32"
                      strokeWidth={2}
                      dot={{ fill: "#4B5B32", r: 4 }}
                      name="Subscribers"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top referrers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Top Referrers</CardTitle>
            <Link href="/admin/members">
              <Button variant="ghost" size="sm">
                View all <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stats.topReferrers.map((ref, i) => (
                <div
                  key={ref.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#4B5B32] text-[#FAFAF8] flex items-center justify-center text-xs">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-sm">{ref.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {ref.count} referral{ref.count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-[#4B5B32]">
                    £{ref.earned} earned
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
