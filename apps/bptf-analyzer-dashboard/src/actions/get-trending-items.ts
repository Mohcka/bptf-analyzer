"use server";

import { getTopItemsActivityForChart } from "@/db/queries/get-item-activity";
import { ItemFilterOptions, queryItemsWithFilters } from "@/db/queries/get-items-with-filters";

export async function getTrendingItems(count = 9, hours = 24) {
  return getTopItemsActivityForChart(count, hours);
}

export async function getItemsWithFilters(options: ItemFilterOptions = {}) {
  return queryItemsWithFilters(options);
}
