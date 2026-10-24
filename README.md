# TaskFlow AI 🚀

An AI-powered task management application that helps users organize tasks, manage progress, and break goals into actionable steps using AI.

## ✨ Features

- **Task Management** — Create, edit, complete, and delete tasks.
- **AI-Powered Planning** — Convert goals into practical tasks using OpenAI.
- **Search and Filter** — Find tasks and organize your workflow.
- **Persistent Storage** — Store tasks in MongoDB Atlas.
- **Responsive UI** — A clean, modern interface built with React.
- **Full-Stack Deployment** — Frontend and backend deployed using Vercel.

## 🛠️ Tech Stack

**Frontend**
- React.js
- Vite
- JavaScript
- CSS

**Backend**
- Node.js
- Express.js
- Mongoose

**Database and AI**
- MongoDB Atlas
- OpenAI API

**Deployment**
- Vercel
- GitHub

## ⚙️ Run Locally

### Prerequisites
- Node.js and npm
- MongoDB Atlas account
- OpenAI API key

### 1. Clone the repository

```bash
git clone https://github.com/priyashanmugaraj/taskflow-ai.git
cd taskflow-ai
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your_mongodb_connection_string
OPENAI_API_KEY=your_openai_api_key
```

Never commit your `.env` file or expose your API keys.

### 4. Start the backend

```bash
npm start
```

### 5. Start the frontend

Open a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed in the terminal.

## 🌐 Live Demo

[[Open TaskFlow AI](ADD_YOUR_VERCEL_URL_HERE)](https://taskflow-ai-navy-five.vercel.app/)

## 📂 Repository

[View the source code on GitHub](https://github.com/priyashanmugaraj/taskflow-ai)

## 🎯 Project Goal

TaskFlow AI demonstrates full-stack development skills, REST API integration, database persistence, AI-powered functionality, and cloud deployment.

---

Built with React, Node.js, MongoDB, and OpenAI.
