import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Sprint = Database['public']['Tables']['sprints']['Row']
export type SprintInsert = Database['public']['Tables']['sprints']['Insert']
export type SprintUpdate = Database['public']['Tables']['sprints']['Update']

export interface SprintMetrics {
  totalTasks: number
  completedTasks: number
  completionRatio: number
  completedMinutes: number
  carryOverCount: number
}

export interface CloseSprintResult {
  closedSprint: Sprint
  targetSprint: Sprint
  movedTaskCount: number
  createdTargetSprint: boolean
}

function getMonthStartEnd(monthValue: string): { startDate: string; endDate: string } {
  const [yearStr, monthStr] = monthValue.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Invalid month value')
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

function getMonthValueFromDate(dateValue: string): string {
  const [yearStr, monthStr] = dateValue.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Invalid date value')
  }

  return `${yearStr}-${monthStr}`
}

function getNextMonthValue(monthValue: string): string {
  const [yearStr, monthStr] = monthValue.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  if (!year || !month || month < 1 || month > 12) {
    throw new Error('Invalid month value')
  }

  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1

  return `${nextYear}-${String(nextMonth).padStart(2, '0')}`
}

function getSprintNameFromMonthValue(monthValue: string): string {
  const [yearStr, monthStr] = monthValue.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)

  if (!year || !month || month < 1 || month > 12) {
    return monthValue
  }

  return `${month}/${year}`
}

export async function getSprints(
  companyId: string,
  options: { status?: Sprint['status'] } = {},
  supabaseClient?: SupabaseClient<Database>
): Promise<Sprint[]> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  let query = supabase
    .from('sprints')
    .select('*')
    .eq('company_id', companyId)
    .order('start_date', { ascending: false })

  if (options.status) {
    query = query.eq('status', options.status)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Sprint[]
}

export async function getActiveSprint(
  companyId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<Sprint | null> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) throw error
  return (data as Sprint | null) || null
}

export async function createMonthlySprint(
  companyId: string,
  monthValue: string,
  name: string,
  createdBy: string,
  makeActive: boolean,
  supabaseClient?: SupabaseClient<Database>
): Promise<Sprint> {
  const supabase = (supabaseClient || createBrowserClient()) as any
  const { startDate, endDate } = getMonthStartEnd(monthValue)

  const payload: SprintInsert = {
    company_id: companyId,
    name: name.trim(),
    start_date: startDate,
    end_date: endDate,
    status: makeActive ? 'active' : 'planned',
    created_by: createdBy,
  }

  const { data, error } = await supabase
    .from('sprints')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as Sprint
}

export async function updateSprint(
  sprintId: string,
  updates: Partial<SprintUpdate>,
  supabaseClient?: SupabaseClient<Database>
): Promise<Sprint> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('sprints')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sprintId)
    .select()
    .single()

  if (error) throw error
  return data as Sprint
}

export async function closeSprint(
  sprintId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<Sprint> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('sprints')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', sprintId)
    .select()
    .single()

  if (error) throw error
  return data as Sprint
}

export async function closeSprintAndCarryOver(
  companyId: string,
  sprintId: string,
  actorId: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<CloseSprintResult> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data: sprintData, error: sprintError } = await supabase
    .from('sprints')
    .select('*')
    .eq('id', sprintId)
    .eq('company_id', companyId)
    .single()

  if (sprintError) throw sprintError

  const sprint = sprintData as Sprint
  const nowIso = new Date().toISOString()
  const currentMonthValue = getMonthValueFromDate(sprint.start_date)
  const nextMonthValue = getNextMonthValue(currentMonthValue)
  const { startDate: nextStartDate, endDate: nextEndDate } = getMonthStartEnd(nextMonthValue)

  const { data: existingTargetRows, error: existingTargetError } = await supabase
    .from('sprints')
    .select('*')
    .eq('company_id', companyId)
    .eq('start_date', nextStartDate)
    .eq('end_date', nextEndDate)
    .order('created_at', { ascending: false })
    .limit(1)

  if (existingTargetError) throw existingTargetError

  let targetSprint: Sprint
  let createdTargetSprint = false

  if (existingTargetRows && existingTargetRows.length > 0) {
    targetSprint = existingTargetRows[0] as Sprint
  } else {
    const { data: insertedTarget, error: insertTargetError } = await supabase
      .from('sprints')
      .insert({
        company_id: companyId,
        name: getSprintNameFromMonthValue(nextMonthValue),
        start_date: nextStartDate,
        end_date: nextEndDate,
        status: 'planned',
        created_by: actorId,
      })
      .select()
      .single()

    if (insertTargetError) throw insertTargetError
    targetSprint = insertedTarget as Sprint
    createdTargetSprint = true
  }

  const { data: closedSprintData, error: closeError } = await supabase
    .from('sprints')
    .update({
      status: 'closed',
      closed_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', sprint.id)
    .select()
    .single()

  if (closeError) throw closeError

  const { data: activatedSprintData, error: activateError } = await supabase
    .from('sprints')
    .update({
      status: 'active',
      closed_at: null,
      updated_at: nowIso,
    })
    .eq('id', targetSprint.id)
    .select()
    .single()

  if (activateError) throw activateError

  const { count, error: countError } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('sprint_id', sprint.id)
    .in('status', ['todo', 'in_progress'])

  if (countError) throw countError

  const movedTaskCount = count || 0

  if (movedTaskCount > 0) {
    const { error: moveError } = await supabase
      .from('tasks')
      .update({
        sprint_id: targetSprint.id,
        updated_at: nowIso,
      })
      .eq('company_id', companyId)
      .eq('sprint_id', sprint.id)
      .in('status', ['todo', 'in_progress'])

    if (moveError) throw moveError
  }

  return {
    closedSprint: closedSprintData as Sprint,
    targetSprint: activatedSprintData as Sprint,
    movedTaskCount,
    createdTargetSprint,
  }
}

export async function getSprintMetrics(
  companyId: string,
  sprintId: string,
  sprintEndDate: string,
  supabaseClient?: SupabaseClient<Database>
): Promise<SprintMetrics> {
  const supabase = (supabaseClient || createBrowserClient()) as any

  const { data, error } = await supabase
    .from('tasks')
    .select('status, actual_duration')
    .eq('company_id', companyId)
    .eq('sprint_id', sprintId)

  if (error) throw error

  const tasks = (data || []) as Pick<Database['public']['Tables']['tasks']['Row'], 'status' | 'actual_duration'>[]
  const totalTasks = tasks.length
  const completedTasks = tasks.filter((task) => task.status === 'done').length
  const completedMinutes = tasks
    .filter((task) => task.status === 'done')
    .reduce((sum, task) => sum + (task.actual_duration || 0), 0)

  const nowIsoDate = new Date().toISOString().slice(0, 10)
  const carryOverCount =
    sprintEndDate < nowIsoDate ? tasks.filter((task) => task.status !== 'done').length : 0

  return {
    totalTasks,
    completedTasks,
    completionRatio: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    completedMinutes,
    carryOverCount,
  }
}
