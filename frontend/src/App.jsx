import './App.css'
import {Route, BrowserRouter as Router, Routes} from 'react-router-dom';
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/authContext';
import VideoMeetComponent from './pages/videoMeet';
import HomeComponent from './pages/home';
import HistoryComponent from './pages/history.jsx'

function App(){
  return (
    <>
      <Router>
        <AuthProvider>
        <Routes>
          <Route path='/' element={<LandingPage/>}></Route>
          <Route path='/auth' element={<Authentication/>}></Route>
          <Route path='/home' element={<HomeComponent/>}></Route>
          <Route path='/:url' element={<VideoMeetComponent/>}></Route>
          <Route path="/history" element={<HistoryComponent/>} />
        </Routes>
        </AuthProvider>
      </Router>
    </>
  )
}

export default App
