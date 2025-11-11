import mongoose from "mongoose";

const chatHistorySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Allow anonymous users
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    messages: [
      {
        role: {
          type: String,
          enum: ["user", "assistant", "system"],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        recommendedMovies: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Movie",
          },
        ],
      },
    ],
    preferences: {
      genres: [String],
      mood: String,
      language: String,
      yearRange: {
        min: Number,
        max: Number,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
chatHistorySchema.index({ user: 1, createdAt: -1 });
chatHistorySchema.index({ sessionId: 1 });

const ChatHistory = mongoose.model("ChatHistory", chatHistorySchema);

export default ChatHistory;


