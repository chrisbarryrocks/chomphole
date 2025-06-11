import { useEffect, useRef, useState } from "react";
import monsterImg from "/chompo.png";
import {
    Engine,
    World,
    Bodies,
    Runner,
    Body,
} from "matter-js";

interface FoodItem {
    id: number;
    body: Body;
}

const App = () => {
    const engineRef = useRef<Engine | null>(null);
    const runnerRef = useRef<Runner | null>(null);
    const foodRef = useRef<FoodItem[]>([]);
    const [frameTick, setFrameTick] = useState(0); // triggers rerender

    useEffect(() => {
        const engine = Engine.create();
        engine.gravity.y = 1;
        engineRef.current = engine;

        const runner = Runner.create();
        Runner.run(runner, engine);
        runnerRef.current = runner;

        // Ground
        const floor = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight,
            window.innerWidth,
            50,
            { isStatic: true }
        );
        World.add(engine.world, [floor]);

        let id = 0;
        const interval = setInterval(() => {
            const x = Math.random() * (window.innerWidth - 100) + 50;
            const body = Bodies.circle(x, 0, 20, {
                restitution: 0.6,
                friction: 0.1,
            });

            World.add(engine.world, body);
            id++;
            foodRef.current.push({ id, body });
        }, 1000);

        const animate = () => {
            Engine.update(engine);
            setFrameTick((tick) => tick + 1); // force re-render
            requestAnimationFrame(animate);
        };
        animate();

        return () => {
            clearInterval(interval);
            Runner.stop(runner);
            World.clear(engine.world, false);
            Engine.clear(engine);
        };
    }, []);

    return (
        <div className="h-screen w-screen bg-[#0d0d0f] relative overflow-hidden">
            {/* Food */}
            {foodRef.current.map((item) => (
                <div
                    key={item.id}
                    className="absolute w-8 h-8 rounded-full bg-yellow-300"
                    style={{
                        transform: `translate(${item.body.position.x}px, ${item.body.position.y}px)`,
                    }}
                />
            ))}

            {/* Chompo */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-20">
                <img
                    src={monsterImg}
                    alt="Chompo"
                    className="w-64 md:w-80 lg:w-96 pointer-events-none select-none"
                />
            </div>
        </div>
    );
};

export default App;
