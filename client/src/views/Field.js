import { IP_SERVER, PORT_SERVER } from './env/Environement';
import './Style.css';
import React, { useState, useEffect } from "react";
import BallRow from "./BallRow";
import socketIOClient from 'socket.io-client';

const ENDPOINT = `http://localhost:3002`;

/*export enum Colors {
  none,
  red,
  orange,
  yellow,
  green,
  blue,
  purple,
}*/

function colorConverter(turn) {
  switch (turn) {
    case 5:
      return ("blue");
    case 4:
      return ("green");
    case 1:
      return ("red");
    case 3:
      return ("black");
    case 2:
      return ("orange");
    case 6:
      return ("purple");
    default:
      return ("empty");
  }
}

function Field(props) {
    const search = props.location.search; // returns the URL query String
    const params = new URLSearchParams(search);
    const username = params.get('username');
    const roomId = params.get('roomId');
    const [field, setField] = useState([]);
    const [joined, setJoined] = useState(false);
    const [turn, setTurn] = useState(null);
    const [coordinate, setCoordinate] = useState(null);
    const [socket, setSocket] = useState(null);
    const [color, setColor] = useState("");

    if (socket == null) {
      setSocket(socketIOClient(ENDPOINT));

      fetch(`http://localhost:3001/games/${roomId}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      })
        .then((response) => response.json())
        .then(async (answer) => {
          if (answer) {
            console.log("answer = ", answer);
            setField(answer.board);
            setTurn(answer.nextColorToPlay);
            for (let i = 0; i < answer.players.length; i++) {
              if (answer.players[i].name == username) {
                setColor(answer.players[i].color);
              }
            }
          } else {
            console.log("error");
          }
        })
        .catch((error) => {
          console.error('error :', error);
        });
    }

    useEffect(() => {
      console.log("useEffect call");
      if (socket != null) {
        if (joined == false) {
          setJoined(true);
          socket.emit('join', { sender: username, room: roomId, color: color },
          (data) => {
            if (data.status == "success") {
              console.log(data);
            } else {
              alert("join error " + data.message);
            }
          });
        }

        socket.on('play', (data) => {
        console.log("received play: " + JSON.stringify(data));
        setField(data.game.board);
        setTurn(data.game.nextColorToPlay);
        });

        socket.on('end', (data) => {
          console.log("received end: " + JSON.stringify(data));
          props.history.push(`/gameOver?roomId=${roomId}`);
        });


      }
    }, [socket]);

    return (
      <div className="Style">
        <header className="Style-header">
          <div>
            <p>{"It's the turn of " + colorConverter(turn)}</p>
            <p>{username + " your color is " + colorConverter(color)}</p>
          </div>
          <div>
            {field.map((item, index) => (
              <BallRow item={item} roomId={roomId} username={username} socket={socket} coordinate={coordinate}
              setField={setField} setTurn={setTurn} color={color}
              setCoordinate={setCoordinate} key={`row-${item[0].coordinate.y}`}/>
            ))}
          </div>
        </header>
      </div>
    );
  }

export default Field;
