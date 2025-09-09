// index.mjs
import http from "http";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/todo_db";
const MONGO_DB = process.env.MONGO_DB || "todo_db";
const COLLECTION = process.env.MONGO_COLLECTION || "tasks";

if (!MONGO_URI) {
  console.error("MONGO_URI is required in environment");
  process.exit(1);
}

let mongoClient;
let collection;

async function connectMongo() {
  mongoClient = new MongoClient(MONGO_URI, { useUnifiedTopology: true });
  await mongoClient.connect();
  const db = mongoClient.db(MONGO_DB);
  collection = db.collection(COLLECTION);
  console.log(
    "Connected to MongoDB:",
    MONGO_URI,
    " DB:",
    MONGO_DB,
    " Collection:",
    COLLECTION
  );
}
await connectMongo();

// helper to read request body
function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(200, { ...headers, "Content-Length": "0" });
    return res.end();
  }

  try {
    if (req.method === "POST" && req.url === "/") {
      const bodyStr = await readRequestBody(req);
      const body = bodyStr ? JSON.parse(bodyStr) : {};

      if (!body.task) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: "task required" }));
      }

      // If user provides id, use it as _id (string). Otherwise let Mongo create ObjectId.
      const doc = {
        task: body.task,
      };

      if (body.id) {
        doc._id = body.id; // use client provided id (string)
      }

      const result = await collection.insertOne(doc);

      // return created id
      const createdId = doc._id ?? result.insertedId;
      res.writeHead(200, headers);
      return res.end(JSON.stringify({ message: "Task added", id: createdId }));
    } else if (req.method === "GET" && req.url === "/") {
      const items = await collection.find({}).toArray();

      // normalize output to match your previous shape (id, task)
      const out = items.map((it) => {
        return {
          id: it._id,
          task: it.task,
        };
      });

      res.writeHead(200, headers);
      return res.end(JSON.stringify(out));
    } else if (req.method === "DELETE" && req.url === "/") {
      const bodyStr = await readRequestBody(req);
      const body = bodyStr ? JSON.parse(bodyStr) : {};

      if (!body.id) {
        res.writeHead(400, headers);
        return res.end(JSON.stringify({ error: "id required" }));
      }

      // Try to delete either by string _id or ObjectId - support both:
      const id = body.id;
      let filter;

      // if id looks like a 24-hex string, treat as ObjectId
      if (typeof id === "string" && id.match(/^[0-9a-fA-F]{24}$/)) {
        try {
          filter = { _id: new ObjectId(id) };
        } catch {
          filter = { _id: id };
        }
      } else {
        filter = { _id: id };
      }

      const result = await collection.deleteOne(filter);

      if (result.deletedCount === 0) {
        res.writeHead(404, headers);
        return res.end(JSON.stringify({ error: "Task not found" }));
      }

      res.writeHead(200, headers);
      return res.end(JSON.stringify({ message: "Task deleted" }));
    } else {
      res.writeHead(405, headers);
      return res.end(JSON.stringify({ error: "Method not allowed" }));
    }
  } catch (err) {
    console.error("Handler error:", err);
    res.writeHead(500, { ...headers, "Content-Type": "application/json" });
    return res.end(JSON.stringify({ error: err.message }));
  }
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await mongoClient?.close();
  process.exit(0);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
