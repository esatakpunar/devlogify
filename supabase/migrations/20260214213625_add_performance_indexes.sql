-- Performance indexes for frequently used task and notification queries

CREATE INDEX IF NOT EXISTS idx_tasks_project_order
  ON public.tasks (project_id, order_index);

CREATE INDEX IF NOT EXISTS idx_tasks_company_updated_desc
  ON public.tasks (company_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_company_status_completed_desc
  ON public.tasks (company_id, status, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_company_assignee_updated_desc
  ON public.tasks (company_id, assignee_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_company_responsible_review_updated_desc
  ON public.tasks (company_id, responsible_id, review_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_company_created_desc
  ON public.notifications (user_id, company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_company_is_read
  ON public.notifications (user_id, company_id, is_read);
