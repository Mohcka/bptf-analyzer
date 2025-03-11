"use server";

import { getTopItemsActivityForChart } from "@/db/queries/get-item-activity";

export async function getTrendingItems(count = 9, hours = 24) {
  return getTopItemsActivityForChart(count, hours);
}
