import './Datenschutz.css';
import { Link } from 'react-router-dom';

export default function Datenschutz() {
    return (
        <div className='Datenschutz'>
            <h1>Datenschutzerklärung</h1>

            <h2>1. Datenschutz auf einen Blick</h2>
            <h3>Allgemeine Hinweise</h3>
            <p>
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem
                Text aufgeführten Datenschutzerklärung.
            </p>

            <h3>Datenerfassung auf dieser Website</h3>
            <p>
                <strong>Wer ist verantwortlich für die Datenerfassung auf dieser Website?</strong><br />
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
                Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
            </p>
            <p>
                <strong>Wie erfassen wir Ihre Daten?</strong><br />
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann
                es sich z. B. um Daten handeln, die Sie uns per E-Mail senden. Andere Daten werden
                automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme
                bzw. unseren Hosting-Provider erfasst. Das sind vor allem technische Daten (z. B.
                Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung dieser
                Daten erfolgt automatisch, sobald Sie diese Website betreten.
            </p>

            <h2>2. Hosting und Content Delivery Networks (CDN)</h2>
            <h3>Cloudflare</h3>
            <p>
                Wir hosten unsere Website und nutzen ein Content Delivery Network (CDN) von Cloudflare.
                Anbieter ist die Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA
                (nachfolgend "Cloudflare").
            </p>
            <p>
                Cloudflare bietet ein weltweit verteiltes Content Delivery Network mit DNS. Dabei wird
                technisch der Informationstransfer zwischen Ihrem Browser und unserer Website über das
                Netzwerk von Cloudflare geleitet. Das versetzt Cloudflare in die Lage, den Datenverkehr
                zwischen Ihrem Browser und unserer Website zu analysieren und als Filter zwischen unseren
                Servern und potenziell bösartigem Datenverkehr aus dem Internet zu dienen. Hierbei kann
                Cloudflare auch Cookies oder sonstige Technologien zur Wiedererkennung von Internetnutzern
                einsetzen, die jedoch allein zum beschriebenen Zweck verwendet werden.
            </p>
            <p>
                Der Einsatz von Cloudflare beruht auf unserem berechtigten Interesse an einer möglichst
                fehlerfreien und sicheren Bereitstellung unseres Webangebotes (Art. 6 Abs. 1 lit. f DSGVO).
            </p>
            <p>
                Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission
                gestützt. Details finden Sie hier: <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">https://www.cloudflare.com/privacypolicy/</a>.
            </p>

            <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
            <h3>Datenschutz</h3>
            <p>
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir
                behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen
                Datenschutzvorschriften sowie dieser Datenschutzerklärung.
            </p>

            <h3>Hinweis zur verantwortlichen Stelle</h3>
            <p>
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
            </p>
            <p>
                Konstantinos Katsimpas<br />
                Vollständige Kontaktdaten siehe <Link to="/impressum">Impressum</Link>.
            </p>
            <p>
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam
                mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten
                (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
            </p>

            <h3>Widerruf Ihrer Einwilligung zur Datenverarbeitung</h3>
            <p>
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung möglich.
                Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die Rechtmäßigkeit
                der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf unberührt.
            </p>

            <h3>Recht auf Auskunft, Löschung und Berichtigung</h3>
            <p>
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
                unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren Herkunft
                und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf Berichtigung
                oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema personenbezogene
                Daten können Sie sich jederzeit an uns wenden.
            </p>
        </div>
    );
}