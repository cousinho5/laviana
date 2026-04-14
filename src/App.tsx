import Home from './pages/Home'
import Lobby from './pages/Lobby'
import { useGameStore } from './store/gameStore'

function App() {
  const { room } = useGameStore()

  if (room) return <Lobby />
  return <Home />
}

export default App