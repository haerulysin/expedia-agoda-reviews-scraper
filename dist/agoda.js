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
const axios_1 = __importDefault(require("axios"));
const puppeteer_1 = __importDefault(require("puppeteer"));
function scrapeAgodaReviews(hotelId) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(hotelId);
        let postData = JSON.stringify({
            hotelId,
            hotelProviderId: 332,
            demographicId: 0,
            pageNo: 0,
            pageSize: 11115,
            sorting: 1,
            isReviewPage: false,
            isCrawlablePage: true,
            paginationSize: 5,
        });
        const resp = yield axios_1.default.post("https://www.agoda.com/api/cronos/property/review/HotelReviews", postData, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
                "Content-Type": "application/json",
            },
        });
        let respData = yield resp.data;
        let reviewData = {};
        const reviewList = respData.commentList.comments;
        let aggregateData = respData.score.demographics.filter((v) => v.name === "All guests" && v.providerId === 332)[0];
        reviewData.hotelName = respData.hotelName;
        reviewData.aggregatedRating = aggregateData.score;
        reviewData.totalRating = aggregateData.count;
        let commentListArray = [];
        reviewList.map((d) => {
            let revd = {};
            if (d.providerId === 332) {
                revd.id = d.hotelReviewId;
                revd.title = d.reviewTitle;
                revd.author = d.reviewerInfo.displayMemberName;
                revd.date = d.reviewDate;
                revd.text = d.reviewComments;
                revd.ownerResponse = d.responseText;
                revd.ownerResponseDate = d.formattedResponseDate;
                commentListArray.push(revd);
            }
        });
        reviewData.reviews = commentListArray;
        return reviewData;
    });
}
function startAgoda(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const browser = yield puppeteer_1.default.launch();
        const page = yield browser.newPage();
        const resp = yield page.goto(url);
        yield page.waitForSelector('[data-selenium*="script-initparam"]');
        const jsonInit = yield page.$eval(`[data-selenium*="script-initparam"]`, (el) => el.innerHTML);
        const hotelId = jsonInit.match(/hotelId:+(\d+)/)[1];
        return yield scrapeAgodaReviews(Number(hotelId));
    });
}
exports.default = startAgoda;
