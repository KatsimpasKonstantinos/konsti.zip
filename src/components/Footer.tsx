import { Link } from 'react-router-dom';
import './Footer.css';


function Footer() {
    return (
        <footer className="Footer">
            <nav aria-label="Rechtliches">
                <Link to="/impressum">Impressum</Link>
                <span aria-hidden="true">|</span>
                <Link to="/datenschutz">Datenschutz</Link>
            </nav>
        </footer>
    )
}

export default Footer
