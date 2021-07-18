import { IP_SERVER, PORT_SERVER } from './env/Environement';
import './Style.css';
import React, { useState, useEffect } from "react";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";
import PlayerList from "./PlayerList";
import socketIOClient from 'socket.io-client';
//import { io } from "socket.io-client";

const ENDPOINT = `http://localhost:3002`;

function Stanby(props) {
    const [ready, setReady] = useState(false);
    const [color, setColor] = useState(null);
    const [pickedColors, setpickedColors] = useState([]);
    const search = props.location.search; // returns the URL query String
    const params = new URLSearchParams(search);
    const username = params.get('username');
    const roomId = params.get('roomId');
    const roomLink = "http://localhost:3000/login?roomId=" + roomId;
    const [playerList, setPlayerList] = useState(null);
    const [socket, setSocket] = useState(null);

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
            setPlayerList(answer.players);
            setpickedColors([]);
            for (let i = 0; i < answer.players.length; i++) {
              setpickedColors(oldArray => [...oldArray, answer.players[i].color]);
              if (answer.players[i].name == username) {
                setColor(answer.players[i].color);
                setReady(answer.players[i].ready)
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
      if (socket != null) {
        socket.on('join', (data) => {
        console.log("received join: " + JSON.stringify(data));
        setPlayerList(data.game.players);
        setpickedColors([]);
        for (let i = 0; i < data.game.players.length; i++) {
          setpickedColors(oldArray => [...oldArray, data.game.players[i].color]);
        }
        });

        socket.on('ready', (data) => {
          console.log("received ready: " + JSON.stringify(data));
          setPlayerList(data.game.players);
        });

        socket.on('start', (data) => {
          console.log("received start: " + JSON.stringify(data));

          props.history.push(`/field?username=${username}&roomId=${roomId}&color=${color}`);
        });

      }
    }, [socket]);

    function isReady(ready) {
      socket.emit('ready', { sender: username, room: roomId, ready: ready },
      (data) => {
        if (data.status == "success") {
          console.log(data);
          setPlayerList(data.game.players);
          setReady(ready)
        } else {
          alert(data.message);
        }
      });

      setReady(ready);
      //window.location.href = `/field?username=${username}&roomId=${params.get('roomId')}`
    }

    function colorIsPicked(color) {
      for (let i = 0; i < pickedColors.length; i++) {
        if (pickedColors[i] == color) {
          return (true);
        }
      }
      return (false);
    }

    function validateColor(choosedColor) {
      socket.emit('join', { sender: username, room: roomId, color: choosedColor },
      (data) => {
        if (data.status == "success") {
          console.log(data);
          setPlayerList(data.game.players);
          setpickedColors([]);
          for (let i = 0; i < data.game.players.length; i++) {
            setpickedColors(oldArray => [...oldArray, data.game.players[i].color]);
          }
        } else {
          console.log("error in choosing color");
          alert(data.message);
        }
      });

      setColor(choosedColor);
    }

    return (
      <div className="Style">
        <header className="Style-header">
          <div>
            <p>{"Welcome to Chinese-Checker " + username + "!"}</p>
            <p>{"Link of the current room: "} <a href={roomLink} target="_blank">{roomLink}</a></p>
          </div>
          <div>
            {!color && (<p>Choose your color!</p>)}
            <br/>
            <div>
             <a onClick={() => { if (!colorIsPicked(5) && color == null) { validateColor("blue")} }}>
              <Image src="./ball/Blue_ball.png"
              style={colorIsPicked(5) ? {height: 100, width: 100, border: '5px solid blue', borderRightColor: 'blue'} : {height: 100, width: 100}}/>
              </a>
              <a onClick={() => { if (!colorIsPicked(2) && color == null) { validateColor("orange")} }}>
              <Image src="./ball/Orange_ball.png"
              style={colorIsPicked(2) ? {height: 100, width: 100, border: '5px solid orange', borderRightColor: 'orange'} : {height: 100, width: 100}}/>
              </a>
              <a onClick={() => { if (!colorIsPicked(4) && color == null) { validateColor("green")} }}>
              <Image src="./ball/Green_ball.png"
              style={colorIsPicked(4) ? {height: 100, width: 100, border: '5px solid green', borderRightColor: 'green'} : {height: 100, width: 100}}/>
              </a>
              <a onClick={() => { if (!colorIsPicked(6) && color == null) { validateColor("purple")} }}>
              <Image src="./ball/Purple_ball.png"
              style={colorIsPicked(6) ? {height: 100, width: 100, border: '5px solid purple', borderRightColor: 'purple'} : {height: 100, width: 100}}/>
              </a>
              <a onClick={() => { if (!colorIsPicked(1) && color == null) { validateColor("red")} }}>
              <Image src="./ball/Red_ball.png"
              style={colorIsPicked(1) ? {height: 100, width: 100, border: '5px solid red', borderRightColor: 'red'} : {height: 100, width: 100}}/>
              </a>
              <a onClick={() => { if (!colorIsPicked(3) && color == null) { validateColor("yellow")} }}>
              <Image src="./ball/Black_ball.png"
              style={colorIsPicked(3) ? {height: 100, width: 100, border: '5px solid black', borderRightColor: 'black'} : {height: 100, width: 100}}/>
              </a>
            </div>
            <br/>
          </div>
          <div>
            {playerList && (playerList.map((item, index) => (
              <PlayerList index={index + 1} item={item} key={item.name}/>
            )))}
          </div>
          <div>
              {ready && (<p>You are ready! Waiting for other user...</p>)}
              {!ready && (<p>You are not ready yet!</p>)}
              {ready && (<Button block size="lg" onClick={() => {
                isReady(false);
              }}>
                  Unready
              </Button>)}
              {!ready && (<Button block size="lg" onClick={() => {
                if (color) {
                  isReady(true);
                } else {
                  alert("Choose a color!");
                }
              }}>
                  Ready
              </Button>)}
          </div>

        </header>
      </div>
    );
  }

export default Stanby;
