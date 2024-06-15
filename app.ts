import express, { NextFunction, Request, Response } from "express";
import path from "path";
import startExpedia from "./expedia";
import startAgoda from "./agoda";
import fs from "fs";
const app = express();

function logFunc(req: Request, res: Response, next: NextFunction) {
  let logObj: { [k: string]: any } = {};
  logObj.url = req.originalUrl;
  logObj.userAgent = req.get("User-Agent");
  logObj.ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  fs.appendFile("./log.txt", `${JSON.stringify(logObj)}\n`, (err) => {
    if (err) console.log(err);
  });
  next();
}

app.get("/", logFunc, async (req: Request, res: Response) => {
  if (req.query.url) {
    const { url } = req.query;
    let travelName = url.toString().match(/https:\/\/www\.(\w+)/)![1];
    let data = null;
    if (travelName === "expedia") {
      data = await startExpedia(url.toString());
    }

    if (travelName === "agoda") {
      data = await startAgoda(url.toString());
    }

    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(data));
  }
  if (!req.query) {
    res.sendFile(path.join(__dirname, "/static/index.html"));
  }

  //   res.send("A");
});

app.get("/ping", logFunc, (req, res) => {
  res.send("PONG");
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;
