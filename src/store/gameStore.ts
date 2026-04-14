import { create } from 'zustand'
import type { Room, Player } from '../types/game'

type GameStore = {
  room: Room | null
  players: Player[]
  currentPlayer: Player | null
  setRoom: (room: Room) => void
  setPlayers: (players: Player[]) => void
  setCurrentPlayer: (player: Player) => void
}

export const useGameStore = create<GameStore>((set) => ({
  room: null,
  players: [],
  currentPlayer: null,
  setRoom: (room) => set({ room }),
  setPlayers: (players) => set({ players }),
  setCurrentPlayer: (player) => set({ currentPlayer: player }),
}))