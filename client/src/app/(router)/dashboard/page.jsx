"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "../../../../context/AuthContext";
import { StatCard } from "./_components/StatCard";
import { LeadItem } from "./_components/LeadItem";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const INITIAL_DASHBOARD_DATA = {
  recentLeads: [],
  stats: { products: 0, categories: 0, leads: 0 },
  loading: { recentLeads: true, products: true, categories: true, leads: true },
  error: { recentLeads: null, products: null, categories: null, leads: null },
};

const STAT_CARDS = [
  {
    key: "products",
    title: "Total Products",
    icon: <Package className="h-5 w-5 text-muted-foreground" />,
  },
  {
    key: "categories",
    title: "Total Categories",
    icon: <FileText className="h-5 w-5 text-muted-foreground" />,
  },
  {
    key: "leads",
    title: "Total Leads",
    icon: <Users className="h-5 w-5 text-muted-foreground" />,
  },
];

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(INITIAL_DASHBOARD_DATA);
  const router = useRouter();
  const { checkAuth } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    const isAuth = await checkAuth();
    if (!isAuth) {
      router.push("/");
      return;
    }

    const fetchFunctions = [
      { key: "recentLeads", func: fetchRecentLeads },
      { key: "products", func: fetchProductsLength },
      { key: "categories", func: fetchCategoriesLength },
      { key: "leads", func: fetchLeadsLength },
    ];

    fetchFunctions.forEach(({ key, func }) => func(key));
  }, [checkAuth, router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const updateDashboardData = (key, data, isError = false) => {
    setDashboardData((prev) => ({
      ...prev,
      [key]: isError ? prev[key] : data,
      loading: { ...prev.loading, [key]: false },
      error: {
        ...prev.error,
        [key]: isError ? `Failed to fetch ${key}` : null,
      },
      ...(key !== "recentLeads" && {
        stats: { ...prev.stats, [key]: isError ? 0 : data },
      }),
    }));
  };

  const fetchData = async (key, url) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}${url}`
      );
      updateDashboardData(
        key,
        response.data.data || (key === "recentLeads" ? [] : 0)
      );
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      updateDashboardData(key, null, true);
    }
  };

  const fetchRecentLeads = () => fetchData("recentLeads", "/leads/recent");
  const fetchProductsLength = () =>
    fetchData("products", "/product/product-length");
  const fetchCategoriesLength = () =>
    fetchData("categories", "/category/length");
  const fetchLeadsLength = () => fetchData("leads", "/leads/leads-length");

  const { recentLeads, stats, loading, error } = dashboardData;

  const chartData = [
    { name: "Products", value: stats.products },
    { name: "Categories", value: stats.categories },
    { name: "Leads", value: stats.leads },
  ];

  const lineChartData = recentLeads.map((lead, index) => ({
    date: new Date(lead.createdAt).toLocaleDateString(),
    leads: index + 1,
    products: Math.floor(stats.products * ((index + 1) / recentLeads.length)),
    categories: Math.floor(
      stats.categories * ((index + 1) / recentLeads.length)
    ),
  }));

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 md:p-8">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
        Dashboard
      </h2>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map(({ key, title, icon }) => (
          <StatCard
            key={key}
            title={title}
            value={
              loading[key] ? (
                <Skeleton className="h-8 w-20 bg-gray-300" />
              ) : error[key] ? (
                <span className="text-red-500">Error</span>
              ) : (
                stats[key]
              )
            }
            icon={icon}
          />
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Overview (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {loading.recentLeads ||
            loading.products ||
            loading.categories ||
            loading.leads ? (
              <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px] w-full bg-gray-300" />
            ) : error.recentLeads ||
              error.products ||
              error.categories ||
              error.leads ? (
              <p className="text-red-500">Error loading data</p>
            ) : (
              <ChartContainer
                config={{
                  products: {
                    label: "Products",
                    color: "hsl(var(--chart-1))",
                  },
                  categories: {
                    label: "Categories",
                    color: "hsl(var(--chart-2))",
                  },
                  leads: {
                    label: "Leads",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[200px] sm:h-[250px] md:h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="name" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-products)" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Trend Over Time (Line Chart)</CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {loading.recentLeads ||
            loading.products ||
            loading.categories ||
            loading.leads ? (
              <Skeleton className="h-[200px] sm:h-[250px] md:h-[300px] w-full bg-gray-300" />
            ) : error.recentLeads ||
              error.products ||
              error.categories ||
              error.leads ? (
              <p className="text-red-500">Error loading data</p>
            ) : (
              <ChartContainer
                config={{
                  products: {
                    label: "Products",
                    color: "hsl(var(--chart-1))",
                  },
                  categories: {
                    label: "Categories",
                    color: "hsl(var(--chart-2))",
                  },
                  leads: {
                    label: "Leads",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="h-[200px] sm:h-[250px] md:h-[300px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={lineChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="products"
                      stroke="var(--color-products)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="categories"
                      stroke="var(--color-categories)"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="var(--color-leads)"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading.recentLeads ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-16 sm:h-20 w-full bg-gray-300"
                />
              ))}
            </div>
          ) : error.recentLeads ? (
            <p className="text-red-500">{error.recentLeads}</p>
          ) : recentLeads.length > 0 ? (
            recentLeads.map((item, index) => <LeadItem key={index} {...item} />)
          ) : (
            <p>No recent leads available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
