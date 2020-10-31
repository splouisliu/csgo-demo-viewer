import React, {useState, useEffect} from 'react'


export const GameContext = React.createContext();

export function GameProvider(props){
    const [game, setGame] = useState(null);

    return(
        <GameContext.Provider value={{game, setGame}}>
            {props.children}
        </GameContext.Provider>
    );
}
