// src/components/Game.tsx

import React from 'react';
import Canvas from './Canvas';

const Game: React.FC = () => {
    return (
        <div>
            <h1>Billiards Game</h1>
            <Canvas />
        </div>
    );
}

export default Game;