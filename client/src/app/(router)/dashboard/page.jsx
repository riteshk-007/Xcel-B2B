"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  Users,
  FileText,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
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
  CartesianGrid,
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAuth } from "../../../../context/AuthContext";

const INITIAL_DASHBOARD_DATA = {
  recentLeads: [],
  stats: { products: 0, categories: 0, leads: 0 },
  chartData: { products: [], categories: [], leads: [] },
  loading: {
    recentLeads: true,
    products: true,
    categories: true,
    leads: true,
    productsChart: true,
    categoriesChart: true,
    leadsChart: true,
  },
  error: {
    recentLeads: null,
    products: null,
    categories: null,
    leads: null,
    productsChart: null,
    categoriesChart: null,
    leadsChart: null,
  },
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
      { key: "productsChart", func: fetchProductsChart },
      { key: "categoriesChart", func: fetchCategoriesChart },
      { key: "leadsChart", func: fetchLeadsChart },
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
      ...(key !== "recentLeads" &&
        !key.includes("Chart") && {
          stats: { ...prev.stats, [key]: isError ? 0 : data },
        }),
      ...(key.includes("Chart") && {
        chartData: { ...prev.chartData, [key.replace("Chart", "")]: data },
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
  const fetchProductsChart = () =>
    fetchData("productsChart", "/product/length-date");
  const fetchCategoriesChart = () =>
    fetchData("categoriesChart", "/category/length-date");
  const fetchLeadsChart = () => fetchData("leadsChart", "/leads/length-date");

  const { recentLeads, stats, chartData, loading, error } = dashboardData;

  const formatChartData = (data) => {
    if (!data || !data.creationDates) return [];
    return data.creationDates.map((date, index) => ({
      date: new Date(date).toLocaleDateString(),
      count: index + 1,
    }));
  };

  const productsData = formatChartData(chartData.products);
  const categoriesData = formatChartData(chartData.categories);
  const leadsData = formatChartData(chartData.leads);

  const combinedChartData = productsData.map((item) => ({
    date: item.date,
    products: item.count,
    categories: categoriesData.find((c) => c.date === item.date)?.count || 0,
    leads: leadsData.find((l) => l.date === item.date)?.count || 0,
  }));

  return (
    <div className="flex-1 space-y-6 p-6 md:p-8 lg:p-10">
      <h1 className="text-3xl font-bold tracking-tight text-primary">
        Dashboard
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {STAT_CARDS.map(({ key, title, icon }) => (
          <StatCard
            key={key}
            title={title}
            value={
              loading[key] ? (
                <Skeleton className="h-8 w-20" />
              ) : error[key] ? (
                <span className="text-destructive">Error</span>
              ) : (
                stats[key]
              )
            }
            icon={icon}
          />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overview</CardTitle>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.products || loading.categories || loading.leads ? (
              <Skeleton className="h-[300px] w-full" />
            ) : error.products || error.categories || error.leads ? (
              <p className="text-destructive">Error loading data</p>
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
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: "Products", value: stats.products },
                      { name: "Categories", value: stats.categories },
                      { name: "Leads", value: stats.leads },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Trend Over Time
            </CardTitle>
            <LineChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading.productsChart ||
            loading.categoriesChart ||
            loading.leadsChart ? (
              <Skeleton className="h-[300px] w-full" />
            ) : error.productsChart ||
              error.categoriesChart ||
              error.leadsChart ? (
              <p className="text-destructive">Error loading data</p>
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
                className="h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={combinedChartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend />
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

      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading.recentLeads ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          ) : error.recentLeads ? (
            <p className="text-destructive">{error.recentLeads}</p>
          ) : recentLeads.length > 0 ? (
            <div className="space-y-4">
              {recentLeads.map((item, index) => (
                <LeadItem key={index} {...item} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No recent leads available.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
