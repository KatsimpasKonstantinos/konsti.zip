import DarkModeToggle from './DarkModeToggle';
import './Navbar.css';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

function Navbar() {
    const [lightMode, setLightMode] = useState(() => {
        return localStorage.getItem('theme') === 'light';
    });

    useEffect(() => {
        document.documentElement.classList.toggle('light', lightMode);
    }, [lightMode]);

    return (
        <nav className="navbar">
            <Link to="/" className="brand">
                Konsti.zip
            </Link>
            <div className="right-section">
                <a className="button" href="https://ko-fi.com/konstantinoskatsimpas">
                    Support me on Ko-fi
                </a>
                <DarkModeToggle checked={lightMode} onChange={() => setLightMode(!lightMode)} />
            </div>
        </nav>
    );
}

export default Navbar;
