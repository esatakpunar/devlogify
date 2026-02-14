-- Batch update task order in a single DB round-trip
CREATE OR REPLACE FUNCTION public.bulk_update_task_order(order_updates jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.tasks AS t
  SET
    order_index = u.order_index,
    updated_at = NOW()
  FROM (
    SELECT
      (item->>'id')::uuid AS id,
      (item->>'order_index')::integer AS order_index
    FROM jsonb_array_elements(order_updates) AS item
  ) AS u
  WHERE t.id = u.id;
END;
$$;
