import { useEffect, useRef } from 'react'
import './Zipper.css'

type Props = {
    /** Wird einmalig aufgerufen, sobald der Reißverschluss weit genug offen ist. */
    onOpen?: () => void
}

// Geometrie (CSS-Pixel)
const HEIGHT = 96
const CY = 36           // Mittellinie der Zähne
const PAD = 56          // Start-/Endposition des Schiebers vom Rand
const PITCH = 14        // Abstand zweier Zähne einer Seite
const TOOTH_W = 9
const TOOTH_H = 10
const OVERLAP = 3       // wie weit die Zähne geschlossen ineinandergreifen
const TAPE_H = 8
const MAX_OPEN = 16     // maximale Öffnung pro Seite
const RAMP = 110        // Länge des „V“ hinter dem Schieber
const SLIDER_W = 30
const SLIDER_H = 34
const TAB_LEN = 38
const TAB_W = 16

const INTRO_DELAY = 450
const INTRO_DURATION = 1700
const OPEN_THRESHOLD = 0.55

type Colors = {
    primary: string
    primaryText: string
    surface: string
    border: string
    tooth: string
    shadow: string
}

function readColors(): Colors {
    const s = getComputedStyle(document.documentElement)
    const v = (name: string) => s.getPropertyValue(name).trim()
    return {
        primary: v('--color-primary'),
        primaryText: v('--color-primary-text'),
        surface: v('--color-surface'),
        border: v('--color-border'),
        tooth: v('--color-text-secondary'),
        shadow: v('--color-shadow'),
    }
}

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x))
const smoothstep = (t: number) => t * t * (3 - 2 * t)
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export default function Zipper({ onOpen }: Props) {
    const wrapRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const onOpenRef = useRef(onOpen)

    useEffect(() => {
        onOpenRef.current = onOpen
    }, [onOpen])

    useEffect(() => {
        const wrap = wrapRef.current
        const canvas = canvasRef.current
        const input = inputRef.current
        const ctx = canvas?.getContext('2d')
        if (!wrap || !canvas || !input || !ctx) return

        const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

        let width = 0        // logische Breite (CSS-Pixel / scale)
        let scale = 1
        let dpr = 1
        let colors = readColors()

        // Zustand: Fortschritt 0..1 (Feder folgt dem Ziel), Pendel des Griffs
        let pos = reduceMotion ? 1 : 0
        let vel = 0
        let target = pos
        let swing = 0
        let swingVel = 0
        let introStart: number | null = reduceMotion ? null : performance.now() + INTRO_DELAY
        let opened = false
        let raf = 0
        let last = 0

        const track = () => Math.max(0, width - 2 * PAD)
        const sliderX = () => PAD + pos * track()

        /** Öffnung (pro Seite) eines Zahns an Position x. */
        const openAt = (x: number, sx: number) => {
            const d = sx - SLIDER_W / 2 - x
            if (d <= 0) return 0
            return MAX_OPEN * smoothstep(Math.min(d / RAMP, 1))
        }

        function syncInput() {
            const pct = Math.round(target * 100)
            input!.value = String(pct)
            input!.setAttribute('aria-valuetext', `${pct}% unzipped`)
        }

        function draw() {
            const c = ctx!
            c.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0)
            c.clearRect(0, 0, width, HEIGHT)

            const sx = sliderX()
            const step = 4

            // 1) Glühen im geöffneten Spalt
            const glowEnd = sx - SLIDER_W / 2 + 2
            if (glowEnd > 0) {
                c.save()
                c.beginPath()
                for (let x = 0; x <= glowEnd; x += step) c.lineTo(x, CY - openAt(x, sx) * 1.15)
                for (let x = glowEnd; x >= 0; x -= step) c.lineTo(x, CY + openAt(x, sx) * 1.15)
                c.closePath()
                c.fillStyle = colors.primary
                c.shadowColor = colors.primary
                c.shadowBlur = 22
                c.globalAlpha = 0.9
                c.fill()

                // Tiefe: zu den Rändern hin dunkler
                const depth = MAX_OPEN * 1.15
                const shade = c.createLinearGradient(0, CY - depth, 0, CY + depth)
                shade.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
                shade.addColorStop(0.5, 'rgba(0, 0, 0, 0)')
                shade.addColorStop(1, 'rgba(0, 0, 0, 0.55)')
                c.shadowBlur = 0
                c.globalAlpha = 1
                c.fillStyle = shade
                c.fill()
                c.restore()
            }

            // 2) Stoffbänder oben und unten
            const tapeEdge = TOOTH_H - OVERLAP // Abstand Mittellinie -> Bandkante
            for (const side of [-1, 1] as const) {
                const inner = (x: number) => CY + side * (tapeEdge - 2 + openAt(x, sx))
                const outer = (x: number) => CY + side * (tapeEdge + TAPE_H + openAt(x, sx))

                c.beginPath()
                for (let x = 0; x <= width + step; x += step) c.lineTo(x, outer(x))
                for (let x = width + step; x >= 0; x -= step) c.lineTo(x, inner(x))
                c.closePath()
                c.fillStyle = colors.surface
                c.fill()
                c.strokeStyle = colors.border
                c.lineWidth = 1
                c.stroke()

                // Naht
                c.save()
                c.beginPath()
                for (let x = 0; x <= width + step; x += step) {
                    c.lineTo(x, CY + side * (tapeEdge + TAPE_H / 2 + 1 + openAt(x, sx)))
                }
                c.setLineDash([3, 4])
                c.strokeStyle = colors.border
                c.stroke()
                c.restore()
            }

            // 3) Zähne
            c.fillStyle = colors.tooth
            for (let x = -PITCH; x <= width + PITCH; x += PITCH) {
                for (const side of [-1, 1] as const) {
                    const tx = side < 0 ? x : x + PITCH / 2
                    const off = openAt(tx, sx)
                    const cy = CY + side * (TOOTH_H / 2 - OVERLAP + off)
                    const tilt = side * (off / MAX_OPEN) * 0.22

                    c.save()
                    c.translate(tx, cy)
                    c.rotate(tilt)
                    c.beginPath()
                    c.roundRect(-TOOTH_W / 2, -TOOTH_H / 2, TOOTH_W, TOOTH_H, 2.5)
                    c.fill()
                    // Glanzkante
                    c.globalAlpha = 0.35
                    c.fillStyle = '#ffffff'
                    c.fillRect(-TOOTH_W / 2 + 2, -TOOTH_H / 2 + 1.5, TOOTH_W - 4, 1.5)
                    c.restore()
                    c.fillStyle = colors.tooth
                }
            }

            // 4) Schieber + Griff
            c.save()
            c.shadowColor = colors.shadow
            c.shadowBlur = 10
            c.shadowOffsetY = 3

            const top = CY - SLIDER_H / 2
            const body = c.createLinearGradient(0, top, 0, top + SLIDER_H)
            body.addColorStop(0, colors.primaryText)
            body.addColorStop(1, colors.primary)
            c.fillStyle = body
            c.beginPath()
            c.roundRect(sx - SLIDER_W / 2, top, SLIDER_W, SLIDER_H, 9)
            c.fill()

            // Griff (pendelt um den Aufhängepunkt)
            const pivotY = CY + SLIDER_H / 2 - 4
            c.translate(sx, pivotY)
            c.rotate(swing)
            c.fillStyle = colors.primary
            c.beginPath()
            c.roundRect(-TAB_W / 2, 0, TAB_W, TAB_LEN, TAB_W / 2)
            c.fill()
            c.restore()

            // Loch im Griff ausstanzen
            c.save()
            c.globalCompositeOperation = 'destination-out'
            c.translate(sx, pivotY)
            c.rotate(swing)
            c.beginPath()
            c.roundRect(-3.5, TAB_LEN - 17, 7, 11, 3.5)
            c.fill()
            c.restore()

            c.save()
            c.globalAlpha = 0.25
            c.strokeStyle = '#000000'
            c.lineWidth = 1.5
            c.beginPath()
            c.moveTo(sx - SLIDER_W / 2 + 6, CY)
            c.lineTo(sx + SLIDER_W / 2 - 6, CY)
            c.stroke()
            c.restore()

            // Aufhängung
            c.save()
            c.strokeStyle = colors.primaryText
            c.lineWidth = 2
            c.beginPath()
            c.arc(sx, pivotY, 3.5, 0, Math.PI * 2)
            c.stroke()
            c.restore()
        }

        function frame(now: number) {
            const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60
            last = now

            if (introStart !== null) {
                const t = clamp((now - introStart) / INTRO_DURATION, 0, 1)
                target = easeInOutCubic(t)
                syncInput()
                if (t >= 1) introStart = null
            }

            if (reduceMotion) {
                pos = target
                vel = 0
            } else {
                // Feder für den Schieber
                const k = 180
                const damping = 2 * Math.sqrt(k) * 0.9
                vel += (k * (target - pos) - damping * vel) * dt
                pos += vel * dt

                // Pendel: Griff hängt der Bewegung hinterher und schwingt nach
                const swingTarget = clamp(vel * track() * 0.0022, -1.1, 1.1)
                swingVel += (110 * (swingTarget - swing) - 4.5 * swingVel) * dt
                swing += swingVel * dt
            }

            draw()

            if (!opened && pos >= OPEN_THRESHOLD) {
                opened = true
                onOpenRef.current?.()
            }

            const settled =
                introStart === null &&
                Math.abs(target - pos) < 1e-4 &&
                Math.abs(vel) < 1e-4 &&
                Math.abs(swing) < 1e-3 &&
                Math.abs(swingVel) < 1e-3

            if (settled) {
                raf = 0
                last = 0
                return
            }
            raf = requestAnimationFrame(frame)
        }

        function kick() {
            if (!raf) raf = requestAnimationFrame(frame)
        }

        function resize() {
            dpr = window.devicePixelRatio || 1
            const cssWidth = wrap!.clientWidth
            scale = cssWidth < 640 ? 1.2 : 1.7
            width = cssWidth / scale
            canvas!.width = Math.round(cssWidth * dpr)
            canvas!.height = Math.round(HEIGHT * scale * dpr)
            canvas!.style.width = `${cssWidth}px`
            canvas!.style.height = `${HEIGHT * scale}px`
            // Range-Input exakt auf die Schieberbahn legen
            wrap!.style.setProperty('--zipper-height', `${HEIGHT * scale}px`)
            wrap!.style.setProperty('--zipper-pad', `${PAD * scale}px`)
            draw()
        }

        function handleInput() {
            introStart = null
            target = Number(input!.value) / 100
            input!.setAttribute('aria-valuetext', `${Math.round(target * 100)}% unzipped`)
            kick()
        }

        const resizeObserver = new ResizeObserver(resize)
        resizeObserver.observe(wrap)

        // Theme-Wechsel (Klasse "light" auf <html>) -> Farben neu lesen
        const themeObserver = new MutationObserver(() => {
            colors = readColors()
            draw()
        })
        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

        input.addEventListener('input', handleInput)

        syncInput()
        resize()
        kick()

        return () => {
            cancelAnimationFrame(raf)
            resizeObserver.disconnect()
            themeObserver.disconnect()
            input.removeEventListener('input', handleInput)
        }
    }, [])

    return (
        <div className="Zipper" ref={wrapRef}>
            <canvas ref={canvasRef} aria-hidden="true" />
            <input
                ref={inputRef}
                type="range"
                min={0}
                max={100}
                step={1}
                defaultValue={0}
                aria-label="Zipper"
                title="Drag me"
            />
        </div>
    )
}
