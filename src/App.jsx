import { Routes, Route } from 'react-router-dom'
import { useRoomSync } from './hooks/useRoomSync'
import { ConnectionContext } from './contexts/connection'

import HomeScreen from './screens/HomeScreen'
import ModeScreen from './screens/ModeScreen'
import JoinScreen from './screens/JoinScreen'
import WaitingScreen from './screens/WaitingScreen'
import LobbyScreen from './screens/LobbyScreen'
import GameHubScreen from './screens/GameHubScreen'
import GameScreen from './screens/GameScreen'
import RoundEndScreen from './screens/RoundEndScreen'
import ScoreboardScreen from './screens/ScoreboardScreen'

function App() {
  const { status } = useRoomSync()

  return (
    <ConnectionContext.Provider value={status}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/mode" element={<ModeScreen />} />
        <Route path="/join" element={<JoinScreen />} />
        <Route path="/waiting" element={<WaitingScreen />} />
        <Route path="/lobby" element={<LobbyScreen />} />
        <Route path="/hub" element={<GameHubScreen />} />
        <Route path="/game/:gameId" element={<GameScreen />} />
        <Route path="/round-end" element={<RoundEndScreen />} />
        <Route path="/scoreboard" element={<ScoreboardScreen />} />
      </Routes>
    </ConnectionContext.Provider>
  )
}

export default App
