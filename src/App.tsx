import { BrowserRouter, Route, Routes } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import NotFound from './pages/NotFound'
import LandingPage from './pages/LandingPage'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'
import Footer from './components/Footer'


function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
        <Route path="/privacypolicy" element={<Datenschutz />} />
        <Route path="/impress" element={<Impressum />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
