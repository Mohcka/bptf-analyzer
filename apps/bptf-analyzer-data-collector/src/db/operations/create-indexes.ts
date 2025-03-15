import { db } from "@/db/database";
import { sql } from "drizzle-orm";

async function createIndexIfNotExists(
  indexName: string,
  createIndexSql: string
): Promise<boolean> {
  try {
    // Check if index exists
    const result = await db.execute(sql`
      SELECT 1 FROM pg_indexes 
      WHERE indexname = ${indexName}
    `);

    if (result.rowCount === 0) {
      console.log(`Creating index: ${indexName}`);
      await db.execute(sql.raw(createIndexSql));
      console.log(`Index ${indexName} created successfully`);
      return true;
    } else {
      console.log(`Index ${indexName} already exists, skipping`);
      return false;
    }
  } catch (error) {
    console.error(`Failed to create index ${indexName}:`, error);
    throw error;
  }
}

export async function createRecommendedIndexes(): Promise<number> {
  try {
    console.log('Creating recommended indexes...');
    let createdCount = 0;

    // For the items table - quality filtering
    if (await createIndexIfNotExists(
      'idx_items_quality',
      `CREATE INDEX IF NOT EXISTS idx_items_quality ON bptf_items (item_quality_name)`
    )) createdCount++;

    // For hourly stats - timestamp + price filtering
    if (await createIndexIfNotExists(
      'idx_hourly_stats_timestamp_price',
      `CREATE INDEX IF NOT EXISTS idx_hourly_stats_timestamp_price ON bptf_item_hourly_stats (hour_timestamp DESC, avg_price_value)`
    )) createdCount++;

    // For individual item lookups by name + time
    if (await createIndexIfNotExists(
      'idx_hourly_stats_item_timestamp',
      `CREATE INDEX IF NOT EXISTS idx_hourly_stats_item_timestamp ON bptf_item_hourly_stats (item_name, hour_timestamp DESC)`
    )) createdCount++;
    
    // For high update count items
    if (await createIndexIfNotExists(
      'idx_hourly_stats_update_count',
      `CREATE INDEX IF NOT EXISTS idx_hourly_stats_update_count ON bptf_item_hourly_stats (update_count DESC)`
    )) createdCount++;

    // For filtered queries with price ranges
    if (await createIndexIfNotExists(
      'idx_hourly_stats_price_timestamp',
      `CREATE INDEX IF NOT EXISTS idx_hourly_stats_price_timestamp ON bptf_item_hourly_stats (avg_price_value, hour_timestamp DESC)`
    )) createdCount++;

    if (createdCount > 0) {
      console.log(`Created ${createdCount} new indexes successfully`);
    } else {
      console.log('All indexes already exist, none created');
    }

    return createdCount;
  } catch (error) {
    console.error('Failed to create recommended indexes:', error);
    throw error;
  }
}

// Run this function to create all indexes
if (require.main === module) {
  createRecommendedIndexes()
    .then((count) => {
      console.log(`Index creation complete. Created ${count} new indexes.`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Index creation failed:', error);
      process.exit(1);
    });
}