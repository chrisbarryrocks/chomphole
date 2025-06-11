import monsterImg from "/chompo.png";

const App = () => {
    return (
        <div className="h-screen w-screen bg-[#0d0d0f] relative overflow-hidden">
            {/* Space for food / game area */}
            <div className="absolute top-0 left-0 right-0 h-[70%] z-10">
                {/* food will spawn here */}
            </div>

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
