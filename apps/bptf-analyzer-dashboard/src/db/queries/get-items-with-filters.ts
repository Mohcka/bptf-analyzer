import { and, desc, eq, gt, lt, gte, lte, sql, SQL } from 'drizzle-orm';
import { db } from "@/db";
import { bptfItemHourlyStatsTable, bptfItemsTable } from "@/db/schema";

export interface ItemFilterOptions {
  timeRangeHours?: number;
  minPrice?: number;
  maxPrice?: number;
  qualityName?: string;
  limit?: number;
}

export async function queryItemsWithFilters(options: ItemFilterOptions = {}) {
  // Set defaults
  const limit = options.limit || 10;
  const timeRangeHours = options.timeRangeHours || 24;
  
  // Calculate the timestamp for the beginning of our data window
  const startTime = new Date();
  startTime.setHours(startTime.getHours() - timeRangeHours, 0, 0, 0); // Round to the hour

  // Calculate the end time (excluding the most recent hour)
  const endTime = new Date();
  endTime.setHours(endTime.getHours() - 1, 0, 0, 0);

  // Store the time range conditions for reuse
  const timeRangeConditions = [
    gte(bptfItemHourlyStatsTable.hourTimestamp, startTime),
    lte(bptfItemHourlyStatsTable.hourTimestamp, endTime)
  ];

  // Initialize conditions array with the time range conditions
  const conditions: SQL[] = [...timeRangeConditions];

  // Apply price minimum if provided
  if (options.minPrice !== undefined) {
    conditions.push(gt(bptfItemHourlyStatsTable.avgPriceValue, options.minPrice.toString()));
  }

  // Apply price maximum if provided
  if (options.maxPrice !== undefined) {
    conditions.push(lt(bptfItemHourlyStatsTable.avgPriceValue, options.maxPrice.toString()));
  }

  // Apply quality filter if provided
  if (options.qualityName) {
    conditions.push(eq(bptfItemsTable.itemQualityName, options.qualityName));
  }

  // STEP 1: Get the most active items based on filters and total update count
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
    .where(and(...conditions))
    .groupBy(
      bptfItemHourlyStatsTable.itemName,
      bptfItemsTable.itemQualityName,
      bptfItemsTable.itemImageUrl,
      bptfItemsTable.itemColor
    )
    .orderBy(desc(sql`total_activity`))
    .limit(limit);

  // STEP 2: For each matched item, fetch the detailed hourly data points
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
            ...timeRangeConditions
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