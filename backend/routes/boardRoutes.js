const express = require("express");
const Board = require("../models/Board");

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const boardId = Math.random().toString(36).substring(2, 10);

    const board = await Board.create({
      boardId,
      canvasData: {},
    });

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: "Error creating board", error });
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