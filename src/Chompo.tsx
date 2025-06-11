import { useEffect, useRef, useState } from "react";

const MAX_OFFSET = 10; // how far pupils can move

const Chompo = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const leftEyeRef = useRef<HTMLDivElement>(null);
    const rightEyeRef = useRef<HTMLDivElement>(null);
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    const [offsets, setOffsets] = useState({
        left: { x: 0, y: 0 },
        right: { x: 0, y: 0 },
    });

    // track mouse
    useEffect(() => {
        const handle = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handle);
        return () => window.removeEventListener("mousemove", handle);
    }, []);

    // update offsets on mouse move
    useEffect(() => {
        const updateOffsets = () => {
            if (!leftEyeRef.current || !rightEyeRef.current) return;

            const calc = (eyeEl: HTMLDivElement) => {
                const rect = eyeEl.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = mouse.x - cx;
                const dy = mouse.y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const scale = Math.min(MAX_OFFSET, dist) / (dist || 1); // avoid divide by 0
                return { x: dx * scale, y: dy * scale };
            };

            setOffsets({
                left: calc(leftEyeRef.current),
                right: calc(rightEyeRef.current),
            });
        };

        updateOffsets();
    }, [mouse]);

    return (
        <div
            ref={containerRef}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20 w-[256px] h-[256px]"
        >
            <img
                src="/chompo_base.png"
                alt="Chompo"
                className="w-full h-full pointer-events-none select-none"
            />

            {/* LEFT EYE SOCKET */}
            <div
                ref={leftEyeRef}
                className="absolute w-10 h-10"
                style={{ top: 90, left: 80 }}
            >
                <img
                    src="/pupil.png"
                    alt="left pupil"
                    className="w-6 h-6 transition-transform duration-50 ease-linear"
                    style={{
                        transform: `translate(${offsets.left.x}px, ${offsets.left.y}px)`,
                    }}
                />
            </div>

            {/* RIGHT EYE SOCKET */}
            <div
                ref={rightEyeRef}
                className="absolute w-10 h-10"
                style={{ top: 90, left: 156 }}
            >
                <img
                    src="/pupil.png"
                    alt="right pupil"
                    className="w-6 h-6 transition-transform duration-50 ease-linear"
                    style={{
                        transform: `translate(${offsets.right.x}px, ${offsets.right.y}px)`,
                    }}
                />
            </div>
        </div>
    );
};

export default Chompo;
