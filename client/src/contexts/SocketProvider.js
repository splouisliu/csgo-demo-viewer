import React, {useRef} from 'react';

const WS_URL = "wss://5recwfvlb2.execute-api.us-east-2.amazonaws.com/production";

export const SocketContext = React.createContext();

export function SocketProvider(props){
    const ws = useRef(null);
    const messageHandlers = useRef({})

    const waitForConnection = (callback, interval) => {
        if (ws.current.readyState === 1) {
            callback();
            return;
        }
        setTimeout(() => {
            waitForConnection(callback, interval);
        }, interval);
    }

    function emitMessage(name, message){
        if(ws.current == null)
            return;

        waitForConnection(() => {
            ws.current.send(JSON.stringify({
                action: "emitMessage",
                data: {
                    eventName: name,
                    message: message
                }
            }));
        }, 1000);
    }

    function addMessageHandler(name, handler){
        messageHandlers.current[name] = handler;
    }

    function initSocket(roomId){
        ws.current = new WebSocket(WS_URL);

        ws.current.onopen = function(event){
            ws.current.send(JSON.stringify({
                action: "joinRoom",
                data: {
                    roomId: roomId
                }
            }));

            alert("Connected");
        }
    
        ws.current.onmessage = function(event){
            const data = JSON.parse(event.data);

            console.log(data.message);

            for(const [name, handler] of Object.entries(messageHandlers.current))
                if(data.eventName === name)
                    handler(data.message);
        }
    }

    return(
        <SocketContext.Provider value={{initSocket, addMessageHandler, emitMessage}}>
            {props.children}
        </SocketContext.Provider>
    );
}
