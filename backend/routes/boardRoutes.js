const express = require("express");
const Board = require("../models/Board");

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const boardId = Date.now().toString();

    const board = new Board({
      boardId,
      canvasData: {},
      permission: "edit",
      revisionHistory: [],
    });

    await board.save();

    res.status(201).json({
      boardId: board.boardId,
      canvasData: board.canvasData,
      permission: board.permission,
    });
  } catch (error) {
    console.error("Create board error:", error);

    res.status(500).json({
      message: "Error creating board",
      error: error.message,
      details: error,
    });
  }
});

router.get("/:boardId", async (req, res) => {
  try {
    const board = await Board.findOne({ boardId: req.params.boardId });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: "Error fetching board", error });
  }
});

router.post("/:boardId/save", async (req, res) => {
  try {
    const { canvasData } = req.body;

    const board = await Board.findOneAndUpdate(
      { boardId: req.params.boardId },
      {
        canvasData,
        $push: {
          revisionHistory: {
            canvasData,
            savedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: "Error saving board", error });
  }
});

module.exports = router;