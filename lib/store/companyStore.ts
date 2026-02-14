import { create } from 'zustand'
import { getCompany, getCompanyMembers } from '@/lib/supabase/queries/companies'
import { getTeams } from '@/lib/supabase/queries/teams'
import type { Company, CompanyMemberWithProfile, Team } from '@/types/supabase'

interface CompanyStore {
  company: Company | null
  members: CompanyMemberWithProfile[]
  teams: (Team & { team_members: { count: number }[] })[]
  currentTeam: Team | null
  isLoading: boolean
  fetchCompany: (companyId: string) => Promise<void>
  fetchMembers: (companyId: string) => Promise<void>
  fetchTeams: (companyId: string) => Promise<void>
  setCurrentTeam: (team: Team | null) => void
  clearCompany: () => void
  getCurrentUserRole: (userId: string) => 'admin' | 'member' | null
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  company: null,
  members: [],
  teams: [],
  currentTeam: null,
  isLoading: false,

  fetchCompany: async (companyId: string) => {
    const current = get().company
    if (current && current.id === companyId) return

    set({ isLoading: true })
    try {
      const company = await getCompany(companyId)
      set({ company, isLoading: false })
    } catch (error) {
      console.error('Error fetching company:', error)
      set({ company: null, isLoading: false })
    }
  },

  fetchMembers: async (companyId: string) => {
    try {
      const members = await getCompanyMembers(companyId)
      set({ members })
    } catch (error) {
      console.error('Error fetching company members:', error)
      set({ members: [] })
    }
  },

  fetchTeams: async (companyId: string) => {
    try {
      const teams = await getTeams(companyId)
      set({ teams: teams as any })
    } catch (error) {
      console.error('Error fetching teams:', error)
      set({ teams: [] })
    }
  },

  setCurrentTeam: (team: Team | null) => {
    set({ currentTeam: team })
  },

  clearCompany: () => {
    set({
      company: null,
      members: [],
      teams: [],
      currentTeam: null,
      isLoading: false,
    })
  },

  getCurrentUserRole: (userId: string) => {
    const member = get().members.find(m => m.user_id === userId)
    return member?.role || null
  },
}))
