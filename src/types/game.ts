export type Room = {
  id: string
  code: string
  host_id: string
  status: 'lobby' | 'night' | 'day' | 'finished'
  phase: 'lobby' | 'mayor_vote' | 'role_reveal' | 'night' | 'day' | 'hunter' | 'mayor_replace' | 'finished'
  mayor_vote_reason: string | null
  day_phase: 'dawn' | 'debate' | 'vote' | 'execution' | 'new_mayor'
  mayor_id: string | null
  last_victim_id: string | null
  last_victim_saved: boolean
  last_victim_infected: boolean
  last_executed_id: string | null
  hunter_id: string | null
  hunter_target_id: string | null
  night: number
  day: number
  winner: string | null
  config: {
    wolves: number
    has_alpha: boolean
    has_seer: boolean
    has_protector: boolean
    has_hunter: boolean
    has_mayor: boolean
    public_votes: boolean
    reveal_role: boolean
  }
  created_at: string
}

export type Player = {
  id: string
  room_id: string
  name: string
  is_host: boolean
  is_alive: boolean
  role: string | null
  voted_for: string | null
  infected: boolean
  last_protected: string | null
  used_infection: boolean
  created_at: string
}