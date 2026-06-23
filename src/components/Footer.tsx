import { Link } from 'react-router-dom';
import './Footer.css';


function Footer() {
    return (
        <footer className="Footer">
            <p><Link to="/impressum">Impressum</Link></p>
            <p>|</p>
            <p><Link to="/datenschutz">Datenschutz</Link></p>
        </footer>
    )
}

export default Footer