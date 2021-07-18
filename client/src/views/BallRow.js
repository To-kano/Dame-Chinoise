import React from 'react';
import Image from "react-bootstrap/Image";


function ballPath(color) {
  switch (color) {
    case 5:
      return ("./ball/Blue_ball.png");
    case 4:
      return ("./ball/Green_ball.png");
    case 1:
      return ("./ball/Red_ball.png");
    case 3:
      return ("./ball/Black_ball.png");
    case 2:
      return ("./ball/Orange_ball.png");
    case 6:
      return ("./ball/Purple_ball.png");
    default:
      return ("./ball/Empty_circle.png");
  }
}

function BallRow(props) {

  return (
    <div>
    {props.item.map((item, index) => (
    <a onClick={() => {
      if (item.color != 0 && item.color == props.color) {
        props.setCoordinate(item.coordinate);
      } else if (item.color == 0) {
        console.log("username = ", props.username);
        console.log("roomdId = ", props.roomId);
        console.log("move = ", [props.coordinate, item.coordinate]);
        if (props.coordinate) {
          props.socket.emit('play', { sender: props.username, room: props.roomId, move: [props.coordinate, item.coordinate] },
          (data) => {
            if (data.status == "success") {
              console.log("play emit response = ", data);
              props.setField(data.game.board);
              props.setTurn(data.game.nextColorToPlay);
            } else {
              alert(data.message);
              props.setCoordinate(null);
            }
          });
        }
      } }}  key={`ball-${item.coordinate.x}-${item.coordinate.y}`}>
      <Image src={ballPath(item.color)} style={{height: 40, width: 40}}/> {" "}
    </a>
    ))}
    </div>
  );
}

export default BallRow;