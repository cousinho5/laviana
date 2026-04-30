import { useState } from 'react'
import { useGameStore } from './store/gameStore'
import Landing from './pages/Landing'
import Home from './pages/Home'
import Historia from './pages/Historia'
import Roles from './pages/Roles'
import Lobby from './pages/Lobby'
import MayorVote from './pages/MayorVote'
import MayorReplace from './pages/MayorReplace'
import RoleReveal from './pages/RoleReveal'
import Night from './pages/Night'
import Day from './pages/Day'
import Dead from './pages/Dead'
import Finished from './pages/Finished'
import Hunter from './pages/Hunter'
import Intro from './pages/Intro'

export type AppPage = 'landing' | 'home' | 'historia' | 'roles'

function App() {
  const { room, players, currentPlayer } = useGameStore()
  const [page, setPage] = useState<AppPage>('landing')

  if (!room) {
    if (page === 'landing') return <Landing onNavigate={setPage} />
    if (page === 'historia') return <Historia onBack={() => setPage('landing')} />
    if (page === 'roles') return <Roles onBack={() => setPage('landing')} />
    return <Home onBack={() => setPage('landing')} />
  }

  if (room.phase === 'finished') return <Finished />
  if (room.phase === 'intro') return <Intro />

  const myPlayer = players.find(p => p.id === currentPlayer?.id)
  const isDead = myPlayer && !myPlayer.is_alive

  if (room.phase === 'hunter') return isDead ? <Dead /> : <Hunter />

  if (room.phase === 'mayor_replace') {
    return isDead ? <Dead /> : <MayorReplace />
  }

  if (isDead) return <Dead />

  if (room.phase === 'lobby') return <Lobby />
  if (room.phase === 'mayor_vote') return <MayorVote />
  if (room.phase === 'role_reveal') return <RoleReveal />
  if (room.phase === 'night') return <Night />
  if (room.phase === 'day') return <Day />

  return <Lobby />
}

export default App