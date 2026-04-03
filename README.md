# AlgoYantra

AlgoYantra is a production-ready MERN workspace for learning, visualizing, and assessing Tree Data Structures. It combines teacher-led lesson authoring, live classroom sessions, student practice, and invariant-based grading for Binary Tree, BST, AVL, and Red-Black Tree workflows.

## Highlights

- JWT authentication with separate teacher and student roles
- Express + MongoDB backend with Mongoose models and role-based middleware
- Shared tree algorithm engine used by both frontend and backend
- D3-powered tree visualization with interactive insert, delete, and traversal controls
- Teacher lesson authoring, assignment publishing, analytics, and live session broadcasting
- Student lessons, practice mode, assignment solver, results, XP/levels/streaks, and leaderboard
- Socket.IO live session support for tree updates, highlights, traversal broadcasts, and polls
- Responsive React + Tailwind UI with gradients, glassmorphism, motion, loaders, and toast feedback

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, Framer Motion, react-d3-tree, Recharts, Socket.IO Client
- Backend: Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Socket.IO
- Shared logic: reusable tree algorithms in `shared/`

## Project Structure

```text
.
├── client/
├── server/
├── shared/
├── package.json
└── README.md
```

## Setup

1. Install dependencies from the workspace root:

```bash
npm install
```

2. Create environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

3. Start both frontend and backend together:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:5001`.

## Environment Variables

### `server/.env`

```env
MONGO_URI=mongodb+srv://sk:algoyantra@algoyantra.m6nexyk.mongodb.net/?appName=AlgoYantra
JWT_SECRET=your_secret_key
PORT=5001
CLIENT_URL=http://localhost:5173
AUTO_SEED=true
```

### `client/.env`

```env
VITE_API_URL=http://localhost:5001/api
VITE_SOCKET_URL=http://localhost:5001
```

## Demo Accounts

If `AUTO_SEED=true`, the backend creates demo data on first startup.

- Teacher
  - Email: `teacher@algoyantra.dev`
  - Password: `Teach123!`
- Student
  - Email: `student@algoyantra.dev`
  - Password: `Learn123!`

## Scripts

### Root

- `npm run dev` starts client and server together
- `npm run dev:client` starts only the React app
- `npm run dev:server` starts only the API
- `npm run build` builds/verifies the workspace
- `npm run seed` seeds MongoDB manually

### Server

- `npm run dev --workspace server`
- `npm run start --workspace server`
- `npm run seed --workspace server`

### Client

- `npm run dev --workspace client`
- `npm run build --workspace client`
- `npm run preview --workspace client`

## Core Feature Map

### Teacher dashboard

- Create and manage lessons
- Build trees interactively
- Publish assignments with algorithm-driven constraints and operations
- Launch live sessions and polls
- Inspect class analytics, mistake buckets, and leaderboard data

### Student dashboard

- Study interactive lessons
- Practice on local tree workspaces with undo/redo
- Solve assignments in an interactive editor
- Receive score, mistakes, correct tree, and suggestions
- Track XP, level, streak, history, and leaderboard rank

## Notes

- The shared algorithm layer supports Binary Tree, BST, AVL Tree, and Red-Black Tree operations and validation.
- Assignment evaluation is based on invariants, node sets, constraints, and traversal correctness instead of rigid static tree matching.
- The app seeds sample lessons, assignments, submissions, and performance records for a ready-to-demo experience.
