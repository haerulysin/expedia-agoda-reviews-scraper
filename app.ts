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
  } else {
    res.setHeader('Content-Type', "text/html")
    let htmlStr = "<h1>Fail to fetch URL!</h1> \n USAGE EXAMPLE : <a href='http://184.168.124.26:8080/?url=https://www.agoda.com/de-de/hotel-laudinella_3/hotel/saint-moritz-ch.html'>http://184.168.124.26:8080/?url=https://www.agoda.com/de-de/hotel-laudinella_3/hotel/saint-moritz-ch.html</a>"
    res.send(
      Buffer.from(htmlStr)
    );
  }
});

app.get("/ping", logFunc, (req, res) => {
  res.send("PONG");
});

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

export default app;