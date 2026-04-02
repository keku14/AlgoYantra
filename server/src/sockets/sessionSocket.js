import { normalizeTreeType } from "@algoyantra/shared";

const sessions = new Map();

function createSessionCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getSessionSnapshot(session) {
  return {
    sessionCode: session.sessionCode,
    title: session.title,
    treeType: session.treeType,
    tree: session.tree,
    highlights: session.highlights,
    traversal: session.traversal,
    poll: session.poll,
    attendees: Array.from(session.attendees.values()),
  };
}

export function initializeSocket(io) {
  io.on("connection", (socket) => {
    socket.on("session:create", (payload, callback) => {
      const sessionCode = createSessionCode();
      const session = {
        sessionCode,
        title: payload.title || "Live Tree Session",
        treeType: normalizeTreeType(payload.treeType),
        tree: payload.tree || null,
        highlights: [],
        traversal: [],
        poll: null,
        teacherId: payload.user?._id,
        attendees: new Map(),
      };

      session.attendees.set(socket.id, {
        name: payload.user?.name || "Teacher",
        role: "teacher",
      });

      sessions.set(sessionCode, session);
      socket.join(sessionCode);

      callback?.({
        ok: true,
        session: getSessionSnapshot(session),
      });
    });

    socket.on("session:join", (payload, callback) => {
      const session = sessions.get(payload.sessionCode);

      if (!session) {
        callback?.({
          ok: false,
          message: "Live session not found.",
        });
        return;
      }

      session.attendees.set(socket.id, {
        name: payload.user?.name || "Student",
        role: payload.user?.role || "student",
      });

      socket.join(payload.sessionCode);
      io.to(payload.sessionCode).emit("session:state", getSessionSnapshot(session));
      callback?.({
        ok: true,
        session: getSessionSnapshot(session),
      });
    });

    socket.on("tree:update", (payload) => {
      const session = sessions.get(payload.sessionCode);

      if (!session) {
        return;
      }

      session.tree = payload.tree;
      session.highlights = payload.highlights || [];
      io.to(payload.sessionCode).emit("session:state", getSessionSnapshot(session));
    });

    socket.on("node:highlight", (payload) => {
      const session = sessions.get(payload.sessionCode);

      if (!session) {
        return;
      }

      session.highlights = payload.highlights || [];
      io.to(payload.sessionCode).emit("session:state", getSessionSnapshot(session));
    });

    socket.on("traversal:broadcast", (payload) => {
      const session = sessions.get(payload.sessionCode);

      if (!session) {
        return;
      }

      session.traversal = payload.traversal || [];
      io.to(payload.sessionCode).emit("session:state", getSessionSnapshot(session));
    });

    socket.on("quiz:ask", (payload) => {
      const session = sessions.get(payload.sessionCode);

      if (!session) {
        return;
      }

      session.poll = {
        question: payload.question,
        options: payload.options || [],
        answers: [],
      };

      io.to(payload.sessionCode).emit("session:state", getSessionSnapshot(session));
    });

    socket.on("quiz:submit", (payload) => {
      const session = sessions.get(payload.sessionCode);

      if (!session?.poll) {
        return;
      }

      session.poll.answers.push({
        student: payload.user?.name || "Student",
        answer: payload.answer,
      });

      io.to(payload.sessionCode).emit("session:state", getSessionSnapshot(session));
    });

    socket.on("disconnect", () => {
      sessions.forEach((session, sessionCode) => {
        if (session.attendees.has(socket.id)) {
          session.attendees.delete(socket.id);

          if (!session.attendees.size) {
            sessions.delete(sessionCode);
            return;
          }

          io.to(sessionCode).emit("session:state", getSessionSnapshot(session));
        }
      });
    });
  });
}
