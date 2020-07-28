const os = require("os");
const ws = require("ws");

const pty= require("node-pty"); // Using microsoft's version instead of the older original

const shell = os.platform() === "win32" ? "powershell.exe" : "bash"; // Semi-cross platform for the sake of it
const server_port = 1927;

let seeking = true; // Only one connection at a time

const wss = new ws.Server({port:server_port});
wss.on("connection", (ws) => {
  if (!seeking) {ws.close();return}
  seeking = false;
  current_connection = ws;
  console.log("Client Connected");

  var ptyprocess = pty.spawn(shell, [], {
    name : "websocket-shell",
    cols : 80,
    rows : 30,
    cwd : process.env.HOME,
    env : process.env
  });

  ptyprocess.on("data", (data) => {
    ws.send(data);
  });

  ptyprocess.write("ls -l\r");

  ws.on("message", (message) => {
    ptyprocess.write(message + "\r");
  });
  ws.on("close", () => {
    seeking = true;
    console.log("Client Disconnected");
  });
  ws.send("Websocket SSH");
});
console.log("Server started on port " + server_port);
