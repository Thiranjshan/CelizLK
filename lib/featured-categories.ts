/**
 * Featured category ordering helper
 * Ensures deterministic, consistent ordering when inserting, moving, or removing items
 */

export interface FeaturedCategoryOrderItem {
  id: string;
  order: number;
}

/**
 * Resolve the final order list when inserting or moving a featured category
 * @param items - Current items (excluding the one being edited)
 * @param requestedOrder - The desired order position (null = append)
 * @param editingId - The item being inserted/moved (null = new insertion)
 * @returns Normalized list with final order values (1-based, no gaps)
 */
export function resolveFeaturedCategoryOrderList(
  items: FeaturedCategoryOrderItem[],
  requestedOrder: number | null | undefined,
  editingId: string | null,
): FeaturedCategoryOrderItem[] {
  const withoutCurrent = items.filter((item) => item.id !== editingId);

  // Determine the target order position
  const nextOrder =
    requestedOrder !== null &&
    requestedOrder !== undefined &&
    Number.isInteger(requestedOrder) &&
    requestedOrder > 0
      ? requestedOrder
      : withoutCurrent.length > 0
        ? Math.max(...withoutCurrent.map((item) => item.order)) + 1
        : 1;

  // Insert the candidate at the target position
  const insertCandidate = { id: editingId ?? 'new', order: nextOrder };

  // Shift existing items at or after the target position forward by 1
  const shifted = withoutCurrent.map((item) =>
    item.order >= nextOrder ? { ...item, order: item.order + 1 } : item,
  );

  // Merge and sort
  const merged = [...shifted, insertCandidate].sort((a, b) => a.order - b.order);

  // Normalize to 1-based sequential ordering with no gaps
  return merged.map((item, index) => ({ ...item, order: index + 1 }));
}
