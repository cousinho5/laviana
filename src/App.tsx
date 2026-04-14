import { useGameStore } from './store/gameStore'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import MayorVote from './pages/MayorVote'
import RoleReveal from './pages/RoleReveal'

function App() {
  const { room } = useGameStore()

  if (!room) return <Home />
  if (room.phase === 'lobby') return <Lobby />
  if (room.phase === 'mayor_vote') return <MayorVote />
  if (room.phase === 'role_reveal') return <RoleReveal />
  return <Lobby />
}

export default App