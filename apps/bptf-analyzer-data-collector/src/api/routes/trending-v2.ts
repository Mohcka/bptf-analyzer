import { Hono } from "hono";
import { and, desc, eq, gte, sql, inArray } from 'drizzle-orm';
import { bptfItemsTable, bptfItemHourlyStatsTable } from '@/db/schema';
import { db } from '@/db/database';

export function setupItemActivityRoutes(app: Hono) {
  // GET endpoint for item activity chart data
  app.get("/item-activity", async (c) => {
    try {
      // Get query parameters with defaults
      const topItemsCount = Number(c.req.query('topItems') || '10');
      const hoursToShow = Number(c.req.query('hours') || '24');

      // Validate parameters
      if (isNaN(topItemsCount) || topItemsCount < 1 || topItemsCount > 50) {
        return c.json({ error: "topItems must be a number between 1 and 50" }, 400);
      }
      if (isNaN(hoursToShow) || hoursToShow < 1 || hoursToShow > 168) {
        return c.json({ error: "hours must be a number between 1 and 168" }, 400);
      }

      // Get chart data
      const chartData = await getTopItemsActivityForChart(topItemsCount, hoursToShow);

      // Set cache control headers
      c.header("Cache-Control", "public, max-age=300"); // 5 minutes cache

      return c.json({
        meta: {
          topItemsCount,
          hoursToShow,
          generatedAt: new Date().toISOString()
        },
        items: chartData
      });
    } catch (error: unknown) {
      console.error("Failed to fetch item activity data:", error);
      return c.json({ error: "Internal server error" }, 500);
    }
  });

  return app;
}

/**
 * Fetches top active items with hourly activity data for charting
 * 
 * @param topItemsCount Number of most active items to retrieve
 * @param hoursToShow Number of most recent hours to include in the chart
 * @returns Array of items with their hourly activity data
 */
async function getTopItemsActivityForChart(topItemsCount: number, hoursToShow: number) {
  // Calculate the timestamp for the beginning of our data window
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hoursToShow);

  // STEP 1: Get the most active items based on total update count (optimized two-step approach)
  // First, find the top item names by activity
  const topItemNames = await db
    .select({
      itemName: bptfItemHourlyStatsTable.itemName,
      totalActivityCount: sql<number>`sum(${bptfItemHourlyStatsTable.updateCount})`.as('total_activity'),
    })
    .from(bptfItemHourlyStatsTable)
    .where(
      gte(bptfItemHourlyStatsTable.hourTimestamp, startTime)
    )
    .groupBy(bptfItemHourlyStatsTable.itemName)
    .orderBy(desc(sql`total_activity`))
    .limit(topItemsCount);

  // Second, get item details for the top items
  const itemNames = topItemNames.map(item => item.itemName);
  const itemDetails = await db
    .select({
      itemName: bptfItemsTable.itemName,
      qualityName: bptfItemsTable.itemQualityName,
      imageUrl: bptfItemsTable.itemImageUrl,
      qualityColor: bptfItemsTable.itemColor,
    })
    .from(bptfItemsTable)
    .where(inArray(bptfItemsTable.itemName, itemNames));

  // Combine the results
  const mostActiveItems = topItemNames.map(topItem => {
    const details = itemDetails.find(detail => detail.itemName === topItem.itemName);
    return {
      itemName: topItem.itemName,
      totalActivityCount: topItem.totalActivityCount,
      qualityName: details?.qualityName,
      imageUrl: details?.imageUrl,
      qualityColor: details?.qualityColor,
    };
  });

  // STEP 2: Fetch hourly data for all top items in a single optimized query
  const hourlyDataForAllItems = await db
    .select({
      itemName: bptfItemHourlyStatsTable.itemName,
      timestamp: bptfItemHourlyStatsTable.hourTimestamp,
      updates: bptfItemHourlyStatsTable.updateCount,
      avgPrice: bptfItemHourlyStatsTable.avgPriceValue,
      avgUsdPrice: bptfItemHourlyStatsTable.avgPriceUsd,
      avgKeys: bptfItemHourlyStatsTable.avgKeysAmount,
      avgMetal: bptfItemHourlyStatsTable.avgMetalAmount,
    })
    .from(bptfItemHourlyStatsTable)
    .where(
      and(
        inArray(bptfItemHourlyStatsTable.itemName, itemNames),
        gte(bptfItemHourlyStatsTable.hourTimestamp, startTime)
      )
    )
    .orderBy(bptfItemHourlyStatsTable.itemName, bptfItemHourlyStatsTable.hourTimestamp);

  // Group hourly data by item name for efficient lookup
  const hourlyDataByItem = hourlyDataForAllItems.reduce((acc, row) => {
    if (!acc[row.itemName]) {
      acc[row.itemName] = [];
    }
    acc[row.itemName].push({
      timestamp: row.timestamp,
      updates: row.updates,
      avgPrice: row.avgPrice,
      avgUsdPrice: row.avgUsdPrice,
      avgKeys: row.avgKeys,
      avgMetal: row.avgMetal,
    });
    return acc;
  }, {} as Record<string, any[]>);

  // STEP 3: Combine all data efficiently
  const itemsWithHourlyBreakdown = mostActiveItems.map((item) => ({
    itemDetails: {
      name: item.itemName,
      quality: item.qualityName,
      image: item.imageUrl,
      color: item.qualityColor,
      totalActivity: item.totalActivityCount,
    },
    hourlyData: hourlyDataByItem[item.itemName] || []
  }));

  return itemsWithHourlyBreakdown;
}