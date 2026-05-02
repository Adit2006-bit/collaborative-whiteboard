import React, { useState } from "react";
import axios from "axios";
import Whiteboard from "./Whiteboard";
import "./App.css";

const API_URL = "https://collaborative-whiteboard-backend-3aio.onrender.com";

function App() {
  const [boardId, setBoardId] = useState("");
  const [joinedBoard, setJoinedBoard] = useState(false);
  const [permission, setPermission] = useState("edit");

  const createBoard = async () => {
    try {
      const res = await axios.post(`${API_URL}/api/boards/create`);
      setBoardId(res.data.boardId);
      setJoinedBoard(true);
    } catch (error) {
      console.error("Error creating board:", error);
      alert("Failed to create board");
    }
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