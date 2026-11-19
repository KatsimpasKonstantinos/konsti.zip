import { useLayoutEffect, useRef, type ReactNode } from 'react';
import './ZipReveal.css';

type Props = {
    children: ReactNode;
    /** Elemente, die am Ende vollständig innerhalb der Öffnung liegen müssen. */
    fitTo?: string;
};

// Geometrie (CSS-Pixel)
const PITCH = 12; // Abstand zweier Zähne einer Reihe
const TOOTH_LEN = 10; // quer zur Laufrichtung
const TOOTH_THICK = 7; // in Laufrichtung
const OVERLAP = 3; // wie weit die Zähne geschlossen ineinandergreifen
const SLIDER_W = 24;
const SLIDER_H = 32;
const TAB_W = 12;
const TAB_LEN = 28;

const START_DELAY = 250;
const DURATION = 2000;
const FIT_MARGIN = 28; // Abstand der Öffnung zum Inhalt

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Spark = { x: number; y: number; vx: number; vy: number; life: number; size: number };

/**
 * Löst eine Farb-Variable zu einem konkreten Farbwert auf.
 * Nötig, weil Tokens wie `light-dark(…)` als Rohtext in der Variable stehen
 * und erst der Browser sie abhängig von `color-scheme` zu einer Farbe macht.
 */
function resolveColor(host: Element, variable: string, fallback: string) {
    const probe = document.createElement('span');
    probe.style.display = 'none';
    probe.style.color = `var(${variable}, ${fallback})`;
    host.append(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    return resolved || fallback;
}

/**
 * Vertikaler Reißverschluss, der sich beim Laden selbst öffnet.
 * Der Inhalt wird genau innerhalb der Öffnung sichtbar; die Zahnreihen lösen
 * sich beim Aufgehen auf, sodass am Ende nur der Inhalt übrig bleibt.
 */
export default function ZipReveal({ children, fitTo }: Props) {
    const rootRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const root = rootRef.current;
        const canvas = canvasRef.current;
        const content = contentRef.current;
        const ctx = canvas?.getContext('2d');
        if (!root || !canvas || !content || !ctx) return;

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion) return;

        const color = resolveColor(root, '--color-primary', '#dc2626');
        const colorLight = resolveColor(root, '--color-primary-text', '#ef4444');

        // Layout
        let W = 0;
        let H = 0;
        let dpr = 1;
        let cx = 0;
        let offsetX = 0; // Canvas -> Inhalt
        let offsetY = 0;
        let finalOpen = 0;
        let ramp = 200;
        let yStart = 0;
        let yEnd = 0;

        // Zustand
        let pos = 0;
        let swing = 0;
        let swingVel = -2.5; // kleiner Ruck vor dem Losziehen
        let lastPos = 0;
        let startAt = 0;
        let done = false;
        let raf = 0;
        let last = 0;
        const sparks: Spark[] = [];

        const sliderY = () => yStart + pos * (yEnd - yStart);

        /** Öffnung (pro Seite) an Höhe y. */
        function openAt(y: number, sy: number) {
            const d = sy - SLIDER_H / 2 - y;
            if (d <= 0) return 0;
            return finalOpen * smoothstep(Math.min(d / ramp, 1));
        }

        function layout() {
            const page = root!.closest('.page');
            const pageStyle = page ? getComputedStyle(page) : null;
            offsetX = pageStyle ? parseFloat(pageStyle.paddingLeft) : 0;
            offsetY = pageStyle ? parseFloat(pageStyle.paddingTop) : 0;

            dpr = window.devicePixelRatio || 1;
            W = root!.clientWidth + 2 * offsetX;
            H = root!.clientHeight + offsetY;
            cx = W / 2;

            // Öffnung muss am Ende den Inhalt vollständig freigeben
            let half = cx;
            if (fitTo) {
                const rootRect = root!.getBoundingClientRect();
                const center = rootRect.left + rootRect.width / 2;
                half = 0;
                content!.querySelectorAll(fitTo).forEach((el) => {
                    const r = el.getBoundingClientRect();
                    half = Math.max(half, center - r.left, r.right - center);
                });
                if (half === 0) half = cx;
            }
            finalOpen = half + FIT_MARGIN;
            ramp = clamp(finalOpen * 0.9, 120, 520);
            yStart = 2;
            yEnd = H + ramp + SLIDER_H + TAB_LEN;

            canvas!.style.left = `${-offsetX}px`;
            canvas!.style.top = `${-offsetY}px`;
            canvas!.style.width = `${W}px`;
            canvas!.style.height = `${H}px`;
            canvas!.width = Math.round(W * dpr);
            canvas!.height = Math.round(H * dpr);

            render();
        }

        /** Inhalt auf die Öffnung zuschneiden (Koordinaten relativ zum Inhalt). */
        function clipContent(sy: number) {
            if (done) {
                content!.style.clipPath = '';
                return;
            }
            const step = 12;
            const left: string[] = [];
            const right: string[] = [];
            for (let y = 0; y <= H + step; y += step) {
                const off = openAt(y, sy);
                const cy = (y - offsetY).toFixed(1);
                left.push(`${(cx - off - offsetX).toFixed(1)}px ${cy}px`);
                right.push(`${(cx + off - offsetX).toFixed(1)}px ${cy}px`);
            }
            content!.style.clipPath = `polygon(${[...left, ...right.reverse()].join(', ')})`;
        }

        function drawTooth(c: CanvasRenderingContext2D, side: -1 | 1, fade: number) {
            const s = 1 - fade * 0.45;
            c.scale(s, s);
            // Körper
            c.fillStyle = color;
            c.beginPath();
            c.roundRect(-TOOTH_LEN / 2, -TOOTH_THICK / 2, TOOTH_LEN, TOOTH_THICK, 2.2);
            c.fill();
            // Kopf (greift in die Gegenseite) – heller
            c.fillStyle = colorLight;
            const headX = side < 0 ? TOOTH_LEN / 2 - 4 : -TOOTH_LEN / 2;
            c.beginPath();
            c.roundRect(headX, -TOOTH_THICK / 2 + 1, 4, TOOTH_THICK - 2, 1.6);
            c.fill();
            // Glanz oben, Schatten unten
            c.fillStyle = 'rgba(255, 255, 255, 0.35)';
            c.fillRect(-TOOTH_LEN / 2 + 1.5, -TOOTH_THICK / 2 + 0.8, TOOTH_LEN - 3, 1.2);
            c.fillStyle = 'rgba(0, 0, 0, 0.28)';
            c.fillRect(-TOOTH_LEN / 2 + 1.5, TOOTH_THICK / 2 - 1.6, TOOTH_LEN - 3, 1.1);
        }

        function drawSlider(c: CanvasRenderingContext2D, sy: number) {
            const top = sy - SLIDER_H / 2;
            const bottom = sy + SLIDER_H / 2;

            // Leuchten an der Stelle, an der die Zähne aufgehen
            const GLOW_R = 36;
            const glow = c.createRadialGradient(cx, top - 4, 0, cx, top - 4, GLOW_R);
            glow.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
            glow.addColorStop(1, 'rgba(239, 68, 68, 0)');
            c.fillStyle = glow;
            c.fillRect(cx - GLOW_R, top - 4 - GLOW_R, GLOW_R * 2, GLOW_R * 2);

            c.save();
            c.shadowColor = 'rgba(0, 0, 0, 0.4)';
            c.shadowBlur = 10;
            c.shadowOffsetY = 3;

            // Körper: oben breit, nach unten verjüngt
            const body = c.createLinearGradient(cx - SLIDER_W / 2, 0, cx + SLIDER_W / 2, 0);
            body.addColorStop(0, color);
            body.addColorStop(0.38, colorLight);
            body.addColorStop(0.55, colorLight);
            body.addColorStop(1, color);
            c.fillStyle = body;
            const wTop = SLIDER_W / 2;
            const wBottom = SLIDER_W * 0.32;
            c.beginPath();
            c.moveTo(cx - wTop + 5, top);
            c.lineTo(cx + wTop - 5, top);
            c.quadraticCurveTo(cx + wTop, top, cx + wTop, top + 5);
            c.lineTo(cx + wBottom, bottom - 4);
            c.quadraticCurveTo(cx + wBottom, bottom, cx + wBottom - 4, bottom);
            c.lineTo(cx - wBottom + 4, bottom);
            c.quadraticCurveTo(cx - wBottom, bottom, cx - wBottom, bottom - 4);
            c.lineTo(cx - wTop, top + 5);
            c.quadraticCurveTo(cx - wTop, top, cx - wTop + 5, top);
            c.closePath();
            c.fill();
            c.restore();

            // Mittelgrat
            c.save();
            c.strokeStyle = 'rgba(255, 255, 255, 0.35)';
            c.lineWidth = 1.5;
            c.beginPath();
            c.moveTo(cx, top + 5);
            c.lineTo(cx, bottom - 8);
            c.stroke();
            c.restore();

            // Griff: Öse + Lasche, pendelt um den Aufhängepunkt
            const pivotY = bottom - 6;
            c.save();
            c.translate(cx, pivotY);
            c.rotate(swing);
            c.strokeStyle = color;
            c.lineWidth = 2.5;
            c.beginPath();
            c.ellipse(0, 4, 3.5, 5, 0, 0, Math.PI * 2);
            c.stroke();

            c.shadowColor = 'rgba(0, 0, 0, 0.35)';
            c.shadowBlur = 6;
            c.shadowOffsetY = 2;
            const tab = c.createLinearGradient(-TAB_W / 2, 0, TAB_W / 2, 0);
            tab.addColorStop(0, color);
            tab.addColorStop(0.45, colorLight);
            tab.addColorStop(1, color);
            c.fillStyle = tab;
            c.beginPath();
            c.roundRect(-TAB_W / 2, 8, TAB_W, TAB_LEN, [3, 3, TAB_W / 2, TAB_W / 2]);
            c.fill();
            c.shadowColor = 'transparent';
            c.fillStyle = 'rgba(0, 0, 0, 0.4)';
            c.beginPath();
            c.roundRect(-2.2, 8 + TAB_LEN - 12, 4.4, 7, 2.2);
            c.fill();
            c.restore();
        }

        function draw(sy: number) {
            const c = ctx!;
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            c.clearRect(0, 0, W, H);
            if (done) return;

            // Zähne – gleichmäßig entlang der Kurve verteilt und an ihr ausgerichtet.
            // Je weiter sie aufgehen, desto mehr lösen sie sich auf.
            const step = 2;
            for (const side of [-1, 1] as const) {
                const xAt = (y: number) => cx + side * (TOOTH_LEN / 2 - OVERLAP + openAt(y, sy));
                let px = xAt(-PITCH);
                let py = -PITCH;
                let travelled = 0;
                let next = side < 0 ? 0 : PITCH / 2;
                for (let y = -PITCH + step; y <= H + PITCH; y += step) {
                    const x = xAt(y);
                    const dx = x - px;
                    const dy = y - py;
                    const seg = Math.hypot(dx, dy);
                    while (travelled + seg >= next) {
                        const f = (next - travelled) / seg;
                        const ty = py + dy * f;
                        const fade = smoothstep(
                            clamp((openAt(ty, sy) / finalOpen - 0.12) / 0.6, 0, 1),
                        );
                        if (fade < 1) {
                            c.save();
                            c.globalAlpha = 1 - fade;
                            c.translate(px + dx * f, ty);
                            c.rotate(Math.atan2(-dx, dy));
                            drawTooth(c, side, fade);
                            c.restore();
                        }
                        next += PITCH;
                    }
                    travelled += seg;
                    px = x;
                    py = y;
                }
            }

            // Funken an der Trennstelle
            for (const p of sparks) {
                c.globalAlpha = clamp(p.life, 0, 1);
                c.fillStyle = colorLight;
                c.beginPath();
                c.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                c.fill();
            }
            c.globalAlpha = 1;

            if (sy - SLIDER_H / 2 - 80 < H) drawSlider(c, sy);
        }

        function render() {
            const sy = sliderY();
            draw(sy);
            clipContent(sy);
        }

        function frame(now: number) {
            const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
            last = now;

            const t = clamp((now - startAt) / DURATION, 0, 1);
            pos = easeInOutCubic(t);
            const sy = sliderY();

            // Griff pendelt der Bewegung hinterher
            const speed = ((pos - lastPos) * (yEnd - yStart)) / dt;
            lastPos = pos;
            const swingTarget = clamp(-speed * 0.0005, -0.45, 0.45);
            swingVel += (90 * (swingTarget - swing) - 6 * swingVel) * dt;
            swing += swingVel * dt;

            // Funken: entstehen an der Trennstelle, fliegen nach außen
            const tipY = sy - SLIDER_H / 2 - 2;
            if (speed > 60 && tipY > 0 && tipY < H) {
                for (let i = 0; i < 2; i++) {
                    const side = Math.random() < 0.5 ? -1 : 1;
                    sparks.push({
                        x: cx + side * 4,
                        y: tipY,
                        vx: side * (40 + Math.random() * 90),
                        vy: -20 - Math.random() * 70,
                        life: 1,
                        size: 1 + Math.random() * 1.6,
                    });
                }
            }
            for (let i = sparks.length - 1; i >= 0; i--) {
                const p = sparks[i];
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 160 * dt;
                p.life -= dt * 2.2;
                if (p.life <= 0) sparks.splice(i, 1);
            }

            if (t >= 1) done = true;
            render();

            if (!done) raf = requestAnimationFrame(frame);
        }

        const resizeObserver = new ResizeObserver(layout);
        resizeObserver.observe(root);

        layout();
        startAt = performance.now() + START_DELAY;
        raf = requestAnimationFrame(frame);

        return () => {
            cancelAnimationFrame(raf);
            resizeObserver.disconnect();
            content.style.clipPath = '';
        };
    }, [fitTo]);

    return (
        <div className="ZipReveal" ref={rootRef}>
            <canvas ref={canvasRef} aria-hidden="true" />
            <div className="ZipReveal-content" ref={contentRef}>
                {children}
            </div>
        </div>
    );
}
