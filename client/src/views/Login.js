import './Style.css';
import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Image from "react-bootstrap/Image";

function Login(props) {
    const [username, setUsername] = useState("");
    const search = props.location.search; // returns the URL query String
    const params = new URLSearchParams(search);
    const roomId = params.get('roomId');

    let randId = () => {
      let s4 = () => {
          return Math.floor((1 + Math.random()) * 0x10000)
              .toString(16)
              .substring(1);
      }
      //return id of format 'aaaaaaaa'-'aaaa'-'aaaa'-'aaaa'-'aaaaaaaaaaaa'
      return s4() + s4() + '-' + s4() + '-' + s4();
    }

    console.log("id = ", roomId);
    function validateForm() {
      return username.length > 0;
    }

    function handleSubmit(event) {
      console.log("Logged as ", username);

      event.preventDefault();
      if (roomId == null) {
        //request to create new room
        fetch(`http://localhost:3001/games/new`, {
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
              props.history.push(`/stanby?username=${username}&roomId=${answer.id}`);
            } else {
              console.log("error");
            }
          })
          .catch((error) => {
            console.error('error :', error);
          });
      } else {
        //request to join a specific room
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
              props.history.push(`/stanby?username=${username}&roomId=${roomId}`);
            } else {
              console.log("error");
            }
          })
          .catch((error) => {
            console.error('error :', error);
          });
      }
    }

    return (
      <div className="Style">
        <header className="Style-header">
          <Image src="./ball/Green_ball.png" style={{height: 100, width: 100}}/>
          <br/>
          <p>Welcome to Chinese Checker!</p>
          <br/>
          <Form onSubmit={handleSubmit}>
            <Form.Group size="lg" controlId="username">
              <Form.Label>Choose your Username</Form.Label>
            </Form.Group>
            <Form.Control
                autoFocus
                type="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            <div>
              <Button block size="lg" type="submit" disabled={!validateForm()}>
                  Go to game!
              </Button>
            </div>
          </Form>

        </header>
      </div>
    );
  }

export default Login;
