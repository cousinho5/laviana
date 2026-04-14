export type Room = {
  id: string
  code: string
  host_id: string
  status: 'lobby' | 'night' | 'day' | 'finished'
  phase: 'lobby' | 'mayor_vote' | 'night' | 'day' | 'finished'
  mayor_id: string | null
  config: {
    wolves: number
    has_alpha: boolean
    has_seer: boolean
    has_protector: boolean
    has_hunter: boolean
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
  created_at: string
}