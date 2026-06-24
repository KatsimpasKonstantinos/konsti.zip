import DarkModeToggle from './DarkModeToggle'
import './Navbar.css'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function Navbar() {

    const [lightMode, setDarkMode] = useState(() => {
        return localStorage.getItem("theme") === "light";
    });

    useEffect(() => {
        document.documentElement.classList.toggle("light", lightMode);
    }, [lightMode]);


    return (
        <nav className="navbar">
            <h1><Link to="/">Konsti.zip</Link></h1>
            <div className="right-section">
                <a className="button" href="https://ko-fi.com/konstantinoskatsimpas" target="_blank" rel="noopener noreferrer">Support me on Ko-fi</a>
                <DarkModeToggle checked={lightMode} onChange={() => setDarkMode(!lightMode)} />
            </div>
        </nav>
    )
}

export default Navbar