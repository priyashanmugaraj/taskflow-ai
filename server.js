const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
//const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors());
let dbConnectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
  }

  await dbConnectionPromise;
}

app.use(async (req, res, next) => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await connectDB();
    next();
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    res.status(500).json({
      success: false,
      message: "Database connection failed",
    });
  }
});

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// MongoDB task schema
const taskSchema = new mongoose.Schema(
  {
    taskId: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const Task = mongoose.model("Task", taskSchema);

// Keep the existing API response format
function formatTask(task) {
  return {
    id: task.taskId,
    title: task.title,
    completed: task.completed,
  };
}

// Health check
app.get("/", (req, res) => {
  res.send("AI Task Agent backend is running!");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Task Agent API is healthy",
  });
});

// Create a task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title } = req.body;

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const task = await Task.create({
      taskId: Date.now(),
      title: title.trim(),
      completed: false,
    });

    res.status(201).json({
      success: true,
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Create task error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
    });
  }
});

// Get all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: 1 });

    res.json({
      success: true,
      tasks: tasks.map(formatTask),
    });
  } catch (error) {
    console.error("Get tasks error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tasks",
    });
  }
});

// Complete or undo a task
app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isSafeInteger(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOne({ taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    task.completed = !task.completed;
    await task.save();

    res.json({
      success: true,
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Update completion error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
    });
  }
});

// Edit a task
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const { title } = req.body;

    if (!Number.isSafeInteger(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    if (typeof title !== "string" || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Task title is required",
      });
    }

    const task = await Task.findOneAndUpdate(
      { taskId },
      { title: title.trim() },
      { new: true, runValidators: true },
    );

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Edit task error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to edit task",
    });
  }
});

// Delete all completed tasks
app.delete("/api/tasks/completed", async (req, res) => {
  try {
    const result = await Task.deleteMany({ completed: true });

    res.json({
      success: true,
      message: `${result.deletedCount} completed tasks deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Clear completed tasks error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete completed tasks",
    });
  }
});

// Delete one task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    if (!Number.isSafeInteger(taskId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid task ID",
      });
    }

    const task = await Task.findOneAndDelete({ taskId });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
      task: formatTask(task),
    });
  } catch (error) {
    console.error("Delete task error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
    });
  }
});

// Generate an AI plan
app.post("/api/ai/plan", async (req, res) => {
  try {
    const { goal } = req.body;

    if (typeof goal !== "string" || !goal.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a goal",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-5.4-mini",
      input: `Break this goal into 3 practical tasks:
${goal.trim()}

Return only a numbered list of tasks.`,
    });

    res.json({
      success: true,
      plan: response.output_text,
    });
  } catch (error) {
    console.error("AI planning error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to generate an AI plan",
    });
  }
});

// Connect to MongoDB before starting the server
// async function startServer() {
//   try {
//     if (!process.env.MONGODB_URI) {
//       throw new Error("MONGODB_URI is missing from the .env file");
//     }

//     await mongoose.connect(process.env.MONGODB_URI);

//     console.log("MongoDB connected successfully");

//     app.listen(PORT, () => {
//       console.log(`Server is running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error("Server startup error:", error.message);
//     process.exit(1);
//   }
// }
// Connect to MongoDB before handling API requests

//startServer();
module.exports = app;
