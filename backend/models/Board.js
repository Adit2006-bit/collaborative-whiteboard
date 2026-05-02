const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema(
  {
    boardId: {
      type: String,
      required: true,
      unique: true,
    },
    canvasData: {
      type: Object,
      default: {},
    },
    permission: {
      type: String,
      default: "edit",
    },
    revisionHistory: [
      {
        canvasData: Object,
        savedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Board", boardSchema);