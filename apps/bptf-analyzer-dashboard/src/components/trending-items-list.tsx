"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns"
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { SkeletonCard } from "./skeleton-card";
import { Badge } from "@/components/ui/badge";
import { Package2 } from "lucide-react";

// Import correct Shadcn chart components
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";

// Import Recharts components directly - these aren't exported from chart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  TooltipProps
} from "recharts";
import { getItemsWithFilters } from "@/actions/get-trending-items";
import FilterForm, { FilterFormData } from "@/components/listings-search/listings-filter-form";
import { ItemFilterOptions } from "@/db/queries/get-items-with-filters";


export function TrendingItemsList() {
  // Default filters
  const defaultFilters = {
    timeRangeHours: 6,
    minPrice: undefined as number | undefined,
    maxPrice: undefined as number | undefined,
    qualityName: undefined as string | undefined,
    limit: 9
  };

  // State for filters with defaults
  const [filters, setFilters] = useState<ItemFilterOptions>(defaultFilters);
  
  // State to track if we've loaded from localStorage
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Load saved filters from localStorage on component mount
  useEffect(() => {
    const storedFormData = localStorage.getItem('listingsFilterForm');
    if (storedFormData) {
      try {
        const parsedFormData = JSON.parse(storedFormData);
        setFilters({
          timeRangeHours: parsedFormData.timeFrame || 6,
          minPrice: parsedFormData.minPrice,
          maxPrice: parsedFormData.maxPrice,
          qualityName: parsedFormData.quality === "any" ? undefined : parsedFormData.quality,
          limit: parsedFormData.limit || 9
        });
      } catch (error) {
        console.error("Error parsing stored filter data:", error);
      }
    }
    setFiltersInitialized(true);
  }, []);

  // Use filters in your query, only enabled after filters are initialized
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['trending-items', filters],
    queryFn: () => getItemsWithFilters(filters),
    placeholderData: (prevData) => prevData,
    enabled: filtersInitialized, // Only run the query after filters are initialized
  });

  // Handle form submission
  const handleSearch = (formData: FilterFormData) => {
    // Map form data to query parameters
    const queryFilters = {
      timeRangeHours: formData.timeFrame,
      minPrice: formData.minPrice,
      maxPrice: formData.maxPrice,
      qualityName: formData.quality === "any" ? undefined : formData.quality,
      limit: formData.limit
    };

    // Update filters state (will trigger query refetch due to queryKey change)
    setFilters(queryFilters);

    console.log("Search with parameters:", queryFilters);
  };

  return (
    <div className="space-y-6">
      {/* Always show the search form */}
      <div className="w-full border rounded-lg p-4 bg-card">
        <FilterForm
          isLoading={isLoading || isFetching}
          onSubmit={handleSearch}
        />
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full px-2 md:px-0">
          {[...Array(9)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : error ? (
        // Error state
        <div className="w-full p-4 text-center">
          <div className="text-destructive">Error loading items</div>
        </div>
      ) : (
        // Success state
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full px-2 md:px-0">
          {isFetching && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex items-center justify-center w-full h-24">
              <span className="text-zinc-600 dark:text-zinc-400 animate-pulse">Fetching data...</span>
            </div>
          )}
          {data && data.map(({ itemDetails, hourlyData }, i) => {
            // Check if we have chart data
            const hasChartData = hourlyData && hourlyData.length > 0;

            // Helper function to determine time format preference
            const usesTwelveHourFormat = () => {
              // Get user locale (or use browser's)
              const locale = navigator.language || "en-US";

              // Locales that typically use 12-hour format
              const twelveHourLocales = ["en-US", "en-GB", "en-CA", "en-AU"];

              return twelveHourLocales.includes(locale);
            };

            // Format data for the charts
            const chartData = hasChartData
              ? hourlyData.map((point: { timestamp: string; updates: number; avgUsdPrice?: number | null; avgKeys?: number | null; avgMetal?: number | null }) => {
                const date = new Date(point.timestamp);
                return {
                  hour: usesTwelveHourFormat() ? format(date, "ha") : format(date, "HH:mm"),
                  date: format(date, `MMM do, yyyy ${usesTwelveHourFormat() ? 'h:mm a' : 'HH:mm'}`),
                  count: point.updates,
                  price: point.avgUsdPrice || 0,
                  keys: point.avgKeys || 0,
                  metal: point.avgMetal || 0,
                };
              })
              : [];

            // Configure chart
            const chartConfig = {
              count: {
                label: "Listings",
                color: itemDetails.color || "#3B82F6"
              }
            };

            // Calculate activity stats
            const totalActivity = itemDetails.totalActivity || 0;
            const latestData = hasChartData ? hourlyData[hourlyData.length - 1] : null;

            return (
              <Card key={i} className="flex flex-col">
                <CardHeader className="flex flex-col items-center justify-center pb-2 px-3 md:px-4">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 flex items-center justify-center">
                    {itemDetails.image && itemDetails.image.startsWith('https://') ? (
                      <img
                        src={itemDetails.image}
                        alt={itemDetails.name}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          // Replace with icon if image fails to load
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-icon-container';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <Package2 
                        size={64} 
                        className="text-muted-foreground"
                        style={{ color: itemDetails.color || undefined }}
                      />
                    )}
                  </div>

                  <div className="text-center mt-2">
                    <h3 className="text-base sm:text-lg font-semibold">{itemDetails.name}</h3>
                    {itemDetails.quality && (
                      <Badge
                        className="mt-1 font-medium"
                        style={{
                          backgroundColor: `${itemDetails.color}20` || '#9da0a120',
                          color: itemDetails.color || '#9da0a1',
                          borderColor: `${itemDetails.color}40` || '#9da0a140'
                        }}
                        variant="outline"
                      >
                        {itemDetails.quality}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-1 text-xs sm:text-sm w-full pt-2 px-3 md:px-4 border-t">
                  <div className="flex justify-between w-full">
                    <span className="text-zinc-600 dark:text-zinc-400">Total Activity:</span>
                    <span className="font-medium">{totalActivity} updates</span>
                  </div>
                  <div className="flex justify-between w-full mt-1 pt-1 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-zinc-600 dark:text-zinc-400">Avg. Price:</span>
                    <span className="font-medium">
                      {latestData && (
                        (latestData.avgKeys && latestData.avgKeys !== "NaN") ||
                        (latestData.avgMetal && latestData.avgMetal !== "NaN")
                      ) ?
                        `${latestData.avgKeys && latestData.avgKeys !== "NaN" ? `${Number(latestData.avgKeys).toFixed(1)} keys` : ''}
                          ${latestData.avgKeys && latestData.avgKeys !== "NaN" && latestData.avgMetal && latestData.avgMetal !== "NaN" ? ', ' : ''}
                          ${latestData.avgMetal && latestData.avgMetal !== "NaN" ? `${Number(latestData.avgMetal).toFixed(2)} ref` : ''}`
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between w-full">
                    <span className="text-zinc-600 dark:text-zinc-400">Avg. USD:</span>
                    <span className="font-medium">
                      {latestData && latestData.avgUsdPrice && latestData.avgUsdPrice !== "NaN" ?
                        `$${Number(latestData.avgUsdPrice).toFixed(2)}` : 'N/A'}
                    </span>
                  </div>
                </CardContent>

                {hasChartData ? (
                  <CardFooter className="pt-3 px-3 md:pt-4 md:px-4 pb-4 flex flex-col">
                    <div className="flex items-center justify-between w-full mb-2">
                      <h4 className="text-sm font-medium text-foreground">Listing Activity</h4>
                      <span className="text-xs text-muted-foreground">{filters.timeRangeHours}h trend</span>
                    </div>
                    <ChartContainer config={chartConfig} className="h-[120px] sm:h-[130px] md:h-[150px] w-full">
                      <LineChart
                        width={500}
                        height={150}
                        data={chartData}
                        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                      >
                        <XAxis
                          dataKey="hour"
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 10 }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                          tick={{ fontSize: 10 }}
                        />
                        <ChartTooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke={itemDetails.color || "#3B82F6"}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ChartContainer>
                  </CardFooter>
                ) : (
                  <CardFooter className="pt-3 px-3 md:pt-4 md:px-4 pb-4">
                    <div className="flex items-center justify-center w-full h-24">
                      <span className="text-zinc-600 dark:text-zinc-400">No hourly data available</span>
                    </div>
                  </CardFooter>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    // Get the color from the payload
    const color = payload[0].stroke || payload[0].payload.fill;

    return (
      <div className="bg-background border border-border p-2 rounded-lg shadow-md text-foreground text-sm">
        <p className="font-medium">{payload[0].payload.date}</p>
        <div className="flex items-center justify-between gap-2 mt-1">
          <span className="flex items-center gap-1.5">
            {/* Color indicator dot */}
            <div
              className="h-2 w-2 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
            Listings:
          </span>
          <span className="font-medium">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};