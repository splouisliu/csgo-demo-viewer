import React from 'react'
import io from 'socket.io-client'

export const SocketContext = React.createContext();

export function SocketProvider(props){
    return(
        <SocketContext.Provider value={io("localhost:5000")}>
            {props.children}
        </SocketContext.Provider>
    );
}
