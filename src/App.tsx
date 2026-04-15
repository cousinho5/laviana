import { useGameStore } from './store/gameStore'
import Home from './pages/Home'
import Lobby from './pages/Lobby'
import MayorVote from './pages/MayorVote'
import RoleReveal from './pages/RoleReveal'
import Night from './pages/Night'
import Day from './pages/Day'
import Dead from './pages/Dead'
import Finished from './pages/Finished'

function App() {
  const { room, players, currentPlayer } = useGameStore()

  if (!room) return <Home />
  if (room.phase === 'finished') return <Finished />

  const myPlayer = players.find(p => p.id === currentPlayer?.id)
  if (myPlayer && !myPlayer.is_alive) return <Dead />

  if (room.phase === 'lobby') return <Lobby />
  if (room.phase === 'mayor_vote') return <MayorVote />
  if (room.phase === 'role_reveal') return <RoleReveal />
  if (room.phase === 'night') return <Night />
  if (room.phase === 'day') return <Day />
  return <Lobby />
}

export default App