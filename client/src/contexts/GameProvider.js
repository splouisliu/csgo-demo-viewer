import React, {useState} from 'react'
//import game from '../pages/123.json';


export const GameContext = React.createContext();

export function GameProvider(props){
    const [game, setGame] = useState(null);

    return(
        <GameContext.Provider value={{game, setGame}}>
            {props.children}
        </GameContext.Provider>
    );
}

//{game, setGame}