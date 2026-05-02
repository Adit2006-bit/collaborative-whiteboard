import React, { useState } from "react";
import axios from "axios";
import Whiteboard from "./Whiteboard";
import "./App.css";

function App() {
  const [boardId, setBoardId] = useState("");
  const [joinedBoard, setJoinedBoard] = useState(false);
  const [permission, setPermission] = useState("edit");

  const createBoard = async () => {
    const res = await axios.post("https://collaborative-whiteboard-backend-3aio.onrender.com");
    setBoardId(res.data.boardId);
    setJoinedBoard(true);
  };

  const joinBoard = () => {
    if (boardId.trim() !== "") {
      setJoinedBoard(true);
    }
  };

  if (joinedBoard) {
    return <Whiteboard boardId={boardId} permission={permission} />;
  }

  return (
    <div className="home">
      <h1>Collaborative Whiteboard</h1>

      <button onClick={createBoard}>Create New Board</button>

      <div className="join-box">
        <input
          type="text"
          placeholder="Enter Board ID"
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
        />

        <select value={permission} onChange={(e) => setPermission(e.target.value)}>
          <option value="edit">Edit Permission</option>
          <option value="view">View Only</option>
        </select>

        <button onClick={joinBoard}>Join Board</button>
      </div>
    </div>
  );
}

export default App;