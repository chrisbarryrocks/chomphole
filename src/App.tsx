import { useEffect, useRef, useState } from "react";
import monsterImg from "/chompo.png";
import {
    Engine,
    World,
    Bodies,
    Runner,
    Body,
    Events,
} from "matter-js";

type Shape = "circle" | "square" | "triangle";

interface FoodTemplate {
    id: string;
    shape: Shape;
    color: string;
}

interface FoodItem {
    id: number;
    body: Body;
    template: FoodTemplate;
}

const TEMPLATES: FoodTemplate[] = [
    { id: "ball", shape: "circle", color: "#FACC15" },   // yellow
    { id: "square", shape: "square", color: "#EF4444" }, // red
    { id: "tri", shape: "triangle", color: "#22C55E" },  // green
];

const App = () => {
    const engineRef = useRef<Engine>();
    const runnerRef = useRef<Runner>();
    const foodRef = useRef<FoodItem[]>([]);
    const [tick, setTick] = useState(0);
    const [chomped, setChomped] = useState(false);

    // Sidebar drag state
    const [dragTemplate, setDragTemplate] = useState<FoodTemplate | null>(null);
    const [dragPos, setDragPos] = useState({ x: 0, y: 0 });

    // Existing-item drag state
    const [draggingId, setDraggingId] = useState<number | null>(null);

    // Initialize Matter.js world
    useEffect(() => {
        const engine = Engine.create();
        engine.gravity.y = 1;
        engineRef.current = engine;

        const runner = Runner.create();
        Runner.run(runner, engine);
        runnerRef.current = runner;

        // Floor
        const floor = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight + 25,
            window.innerWidth,
            50,
            { isStatic: true }
        );
        // Chompo mouth sensor
        const mouth = Bodies.rectangle(
            window.innerWidth / 2,
            window.innerHeight - 100,
            200,
            20,
            { isStatic: true, isSensor: true, label: "chompo-mouth" }
        );

        World.add(engine.world, [floor, mouth]);

        // Collisions: remove eaten food & trigger animation
        Events.on(engine, "collisionStart", (e) => {
            e.pairs.forEach((pair) => {
                const labels = [pair.bodyA.label, pair.bodyB.label];
                if (
                    labels.includes("chompo-mouth") &&
                    labels.some((l) => l.startsWith("food-"))
                ) {
                    const eatenLabel = labels.find((l) => l.startsWith("food-"))!;
                    const eatenId = parseInt(eatenLabel.replace("food-", ""), 10);
                    const eaten = foodRef.current.find((f) => f.id === eatenId);
                    if (eaten) {
                        World.remove(engine.world, eaten.body);
                        foodRef.current = foodRef.current.filter((f) => f.id !== eatenId);
                    }
                    setChomped(true);
                    setTimeout(() => setChomped(false), 150);
                }
            });
        });

        // Render loop
        const update = () => {
            Engine.update(engine);
            setTick((t) => t + 1);
            requestAnimationFrame(update);
        };
        update();

        return () => {
            Runner.stop(runner);
            World.clear(engine.world, false);
            Engine.clear(engine);
        };
    }, []);

    // Global pointer handlers for dragging
    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (dragTemplate) {
                setDragPos({ x: e.clientX, y: e.clientY });
            }
            if (draggingId != null) {
                const item = foodRef.current.find((f) => f.id === draggingId);
                if (item) {
                    Body.setStatic(item.body, true);
                    Body.setPosition(item.body, { x: e.clientX, y: e.clientY });
                }
            }
        };
        const onUp = (e: MouseEvent) => {
            // drop from sidebar → spawn new
            if (dragTemplate) {
                spawnFood(dragTemplate, e.clientX, e.clientY);
                setDragTemplate(null);
            }
            // drop existing → re-enable physics
            if (draggingId != null) {
                const item = foodRef.current.find((f) => f.id === draggingId);
                if (item) Body.setStatic(item.body, false);
                setDraggingId(null);
            }
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
        };
    }, [dragTemplate, draggingId]);

    // Spawn helper
    const nextId = useRef(0);
    const spawnFood = (
        template: FoodTemplate,
        x: number,
        y: number
    ) => {
        const id = nextId.current++;
        let body: Body;
        switch (template.shape) {
            case "circle":
                body = Bodies.circle(x, y, 20, {
                    restitution: 0.6,
                    friction: 0.1,
                    label: `food-${id}`,
                });
                break;
            case "square":
                body = Bodies.rectangle(x, y, 40, 40, {
                    restitution: 0.6,
                    friction: 0.1,
                    label: `food-${id}`,
                });
                break;
            case "triangle":
                body = Bodies.polygon(x, y, 3, 30, {
                    restitution: 0.6,
                    friction: 0.1,
                    label: `food-${id}`,
                });
                break;
        }
        World.add(engineRef.current!.world, body);
        foodRef.current.push({ id, body, template });
    };

    return (
        <div className="h-screen w-screen bg-[#0d0d0f] relative overflow-hidden">
            {/* Sidebar */}
            <div className="absolute top-0 left-0 bottom-0 w-20 bg-gray-800 flex flex-col items-center py-4 space-y-4 z-30">
                {TEMPLATES.map((t) => (
                    <div
                        key={t.id}
                        className="cursor-pointer"
                        onMouseDown={(e) => {
                            setDragTemplate(t);
                            setDragPos({ x: e.clientX, y: e.clientY });
                        }}
                    >
                        {t.shape === "circle" && (
                            <div
                                className="w-8 h-8 rounded-full"
                                style={{ backgroundColor: t.color }}
                            />
                        )}
                        {t.shape === "square" && (
                            <div
                                className="w-8 h-8"
                                style={{ backgroundColor: t.color }}
                            />
                        )}
                        {t.shape === "triangle" && (
                            <div
                                style={{
                                    width: 0,
                                    height: 0,
                                    borderLeft: "16px solid transparent",
                                    borderRight: "16px solid transparent",
                                    borderBottom: `32px solid ${t.color}`,
                                }}
                            />
                        )}
                    </div>
                ))}
            </div>

            {/* Ghost preview */}
            {dragTemplate && (
                <div
                    className="pointer-events-none z-40"
                    style={{
                        position: "fixed",
                        left: dragPos.x - 20,
                        top: dragPos.y - 20,
                    }}
                >
                    {dragTemplate.shape === "circle" && (
                        <div
                            className="w-10 h-10 rounded-full opacity-75"
                            style={{ backgroundColor: dragTemplate.color }}
                        />
                    )}
                    {dragTemplate.shape === "square" && (
                        <div
                            className="w-10 h-10 opacity-75"
                            style={{ backgroundColor: dragTemplate.color }}
                        />
                    )}
                    {dragTemplate.shape === "triangle" && (
                        <div
                            style={{
                                width: 0,
                                height: 0,
                                opacity: 0.75,
                                borderLeft: "20px solid transparent",
                                borderRight: "20px solid transparent",
                                borderBottom: `40px solid ${dragTemplate.color}`,
                            }}
                        />
                    )}
                </div>
            )}

            {/* Food items */}
            {foodRef.current.map((f) => {
                // compute actual bounds-based size
                const width = f.body.bounds.max.x - f.body.bounds.min.x;
                const height = f.body.bounds.max.y - f.body.bounds.min.y;
                return (
                    <div
                        key={f.id}
                        className="absolute cursor-grab z-30"
                        style={{
                            width,
                            height,
                            transform: `translate(${
                                f.body.position.x - width / 2
                            }px, ${f.body.position.y - height / 2}px)`,
                        }}
                        onMouseDown={() => setDraggingId(f.id)}
                    >
                        {f.template.shape === "circle" && (
                            <div
                                className="w-full h-full rounded-full"
                                style={{ backgroundColor: f.template.color }}
                            />
                        )}
                        {f.template.shape === "square" && (
                            <div
                                className="w-full h-full"
                                style={{ backgroundColor: f.template.color }}
                            />
                        )}
                        {f.template.shape === "triangle" && (
                            <svg
                                width="100%"
                                height="100%"
                                viewBox="0 0 40 40"
                                className="pointer-events-none"
                            >
                                <polygon
                                    points="20,0 40,40 0,40"
                                    fill={f.template.color}
                                />
                            </svg>
                        )}
                    </div>
                );
            })}

            {/* Chompo */}
            <div
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 z-20 transition-transform duration-150 ${
                    chomped ? "scale-110" : "scale-100"
                }`}
            >
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
