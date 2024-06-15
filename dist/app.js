"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const expedia_1 = __importDefault(require("./expedia"));
const agoda_1 = __importDefault(require("./agoda"));
const app = (0, express_1.default)();
app.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (req.query.url) {
        const { url } = req.query;
        let travelName = url.toString().match(/https:\/\/www\.(\w+)/)[1];
        let data = null;
        if (travelName === 'expedia') {
            data = yield (0, expedia_1.default)(url.toString());
        }
        if (travelName === 'agoda') {
            data = yield (0, agoda_1.default)(url.toString());
        }
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
    }
    if (!req.query) {
        res.sendFile(path_1.default.join(__dirname, "/static/index.html"));
    }
    //   res.send("A");
}));
const port = 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
