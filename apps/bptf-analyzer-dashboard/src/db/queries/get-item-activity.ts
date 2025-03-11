import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { bptfItemsTable, bptfItemHourlyStatsTable } from '@/db/schema';
import { db } from '@/db';

/**
 * Fetches top active items with hourly activity data for charting
 * 
 * @param topItemsCount Number of most active items to retrieve
 * @param hoursToShow Number of most recent hours to include in the chart
 * @returns Array of items with their hourly activity data
 */
export async function getTopItemsActivityForChart(topItemsCount: number, hoursToShow: number) {
  // Calculate the timestamp for the beginning of our data window
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - hoursToShow);

  // STEP 1: Get the most active items based on total update count
  const mostActiveItems = await db
    .select({
      itemName: bptfItemHourlyStatsTable.itemName,
      totalActivityCount: sql<number>`sum(${bptfItemHourlyStatsTable.updateCount})`.as('total_activity'),
      qualityName: bptfItemsTable.itemQualityName,
      imageUrl: bptfItemsTable.itemImageUrl,
      qualityColor: bptfItemsTable.itemColor,
    })
    .from(bptfItemHourlyStatsTable)
    .innerJoin(
      bptfItemsTable,
      eq(bptfItemHourlyStatsTable.itemName, bptfItemsTable.itemName)
    )
    .where(
      gte(bptfItemHourlyStatsTable.hourTimestamp, startTime)
    )
    .groupBy(
      bptfItemHourlyStatsTable.itemName,
      bptfItemsTable.itemQualityName,
      bptfItemsTable.itemImageUrl,
      bptfItemsTable.itemColor
    )
    .orderBy(desc(sql`total_activity`))
    .limit(topItemsCount);

  // STEP 2: For each top item, fetch the detailed hourly data points
  const itemsWithHourlyBreakdown = await Promise.all(
    mostActiveItems.map(async (item) => {
      const hourlyDataPoints = await db
        .select({
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
            eq(bptfItemHourlyStatsTable.itemName, item.itemName),
            gte(bptfItemHourlyStatsTable.hourTimestamp, startTime)
          )
        )
        .orderBy(bptfItemHourlyStatsTable.hourTimestamp);

      return {
        itemDetails: {
          name: item.itemName,
          quality: item.qualityName,
          image: item.imageUrl,
          color: item.qualityColor,
          totalActivity: item.totalActivityCount,
        },
        hourlyData: hourlyDataPoints
      };
    })
  );

  return itemsWithHourlyBreakdown;
}