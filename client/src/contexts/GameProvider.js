import React, {useState} from 'react'
//import game from '../pages/123.json';


export const GameContext = React.createContext();

export function GameProvider(props){
    const [game, setGame] = useState(null);
    const [joinCode, setJoinCode] = useState("")

    return(
        <GameContext.Provider value={{game, setGame, joinCode, setJoinCode}}>
            {props.children}
        </GameContext.Provider>
    );
}