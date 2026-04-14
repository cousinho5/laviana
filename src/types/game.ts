export type Room = {
  id: string
  code: string
  host_id: string
  status: 'lobby' | 'night' | 'day' | 'finished'
  created_at: string
}

export type Player = {
  id: string
  room_id: string
  name: string
  is_host: boolean
  created_at: string
}