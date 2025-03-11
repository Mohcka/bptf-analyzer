"use server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Define the return types for better type safety
type TrendingItem = {
  itemName: string;
  itemQualityName: string | null;
  itemImageUrl: string;
  itemColor: string | null;
  avgPriceValue: number | null;
  avgPriceUsd: number | null;
  avgKeysAmount: number | null;
  avgMetalAmount: number | null;
  updateCount: number;
  deleteCount: number;
  totalCount: number;
  eventCount: number;
}

type TrendingResponse = {
  items: TrendingItem[];
  hourlyData?: Record<string, number[]>;
  lastUpdated: string;
}

export async function getTopTrendingItems(): Promise<TrendingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/trending`, {
      next: { revalidate: 300 }, // Revalidate every 5 minutes
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return data as TrendingResponse;
  } catch (error) {
    console.error("Failed to fetch trending items:", error);
    // Return empty data on error
    return {
      items: [],
      hourlyData: {},
      lastUpdated: new Date().toISOString()
    };
  }
}
