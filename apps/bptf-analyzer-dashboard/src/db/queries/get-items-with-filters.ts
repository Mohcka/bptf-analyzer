import { eq, gte, lte, sql, SQL } from 'drizzle-orm';
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

  // Build conditions array for filtering
  const conditions: SQL[] = [
    gte(bptfItemHourlyStatsTable.hourTimestamp, startTime),
    lte(bptfItemHourlyStatsTable.hourTimestamp, endTime)
  ];

  // Apply price filters
  if (options.minPrice !== undefined) {
    conditions.push(gte(bptfItemHourlyStatsTable.avgPriceValue, options.minPrice.toString()));
  }
  if (options.maxPrice !== undefined) {
    conditions.push(lte(bptfItemHourlyStatsTable.avgPriceValue, options.maxPrice.toString()));
  }

  // Apply quality filter
  if (options.qualityName) {
    conditions.push(eq(bptfItemsTable.itemQualityName, options.qualityName));
  }

  // OPTIMIZED: Single query using CTE and window functions to leverage idx_hourly_stats_main_query
  const results = await db.execute(sql`
    WITH ranked_items AS (
      SELECT 
        h.item_name,
        i.item_quality_name,
        i.image_url,
        i.item_quality_color,
        SUM(h.update_count) as total_activity,
        ROW_NUMBER() OVER (ORDER BY SUM(h.update_count) DESC) as rn
      FROM bptf_item_hourly_stats h
      INNER JOIN bptf_items i ON h.item_name = i.item_name
      WHERE h.hour_timestamp >= ${startTime} 
        AND h.hour_timestamp <= ${endTime}
        ${options.minPrice ? sql`AND h.avg_price_value >= ${options.minPrice}` : sql``}
        ${options.maxPrice ? sql`AND h.avg_price_value <= ${options.maxPrice}` : sql``}
        ${options.qualityName ? sql`AND i.item_quality_name = ${options.qualityName}` : sql``}
      GROUP BY h.item_name, i.item_quality_name, i.image_url, i.item_quality_color
    ),
    top_items AS (
      SELECT * FROM ranked_items WHERE rn <= ${limit}
    )
    SELECT 
      t.item_name,
      t.item_quality_name,
      t.image_url,
      t.item_quality_color,
      t.total_activity,
      h.hour_timestamp,
      h.update_count,
      h.avg_price_value,
      h.avg_price_usd,
      h.avg_keys_amount,
      h.avg_metal_amount
    FROM top_items t
    LEFT JOIN bptf_item_hourly_stats h ON t.item_name = h.item_name
      AND h.hour_timestamp BETWEEN ${startTime} AND ${endTime}
    ORDER BY t.total_activity DESC, t.item_name, h.hour_timestamp
  `);

  // Process results efficiently into the expected format
  const itemsMap = new Map();
  
  for (const row of results.rows) {
    const itemName = row.item_name;
    
    if (!itemsMap.has(itemName)) {
      itemsMap.set(itemName, {
        itemDetails: {
          name: itemName,
          quality: row.item_quality_name,
          image: row.image_url,
          color: row.item_quality_color,
          totalActivity: Number(row.total_activity),
        },
        hourlyData: []
      });
    }
    
    if (row.hour_timestamp) {
      itemsMap.get(itemName).hourlyData.push({
        timestamp: row.hour_timestamp,
        updates: row.update_count,
        avgPrice: row.avg_price_value,
        avgUsdPrice: row.avg_price_usd,
        avgKeys: row.avg_keys_amount,
        avgMetal: row.avg_metal_amount,
      });
    }
  }

  return Array.from(itemsMap.values());
}