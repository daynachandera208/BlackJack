import http from "http";
import express from "express";
import cors from "cors";

import { Server, LobbyRoom } from "colyseus";
import socialRoutes from "@colyseus/social/express";

import { GameRoom } from "./Utils/GameRoom";
import { Table1,Table2,Table3 } from "./rooms/Tables";


const PORT = Number(process.env.PORT || 2567);

const app = express();

/**
 * CORS should be used during development only.
 * Please remove CORS on production, unless you're hosting the server and client on different domains.
 */
app.use(cors());

const gameServer = new Server({
  server: http.createServer(app),
  pingInterval: 0,
});

// Register DemoRoom as "demo"
gameServer.define("Game", GameRoom);
gameServer.define("Table1", Table1);
gameServer.define("Table2", Table2);
gameServer.define("Table3", Table3);



app.use("/", socialRoutes);

app.get("/something", function (req, res) {
  console.log("something!", process.pid);
  res.send("Hey!");
});

// Listen on specified PORT number
gameServer.listen(PORT);

console.log("Running on ws://localhost:" + PORT);
