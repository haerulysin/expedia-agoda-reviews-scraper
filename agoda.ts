import axios from "axios";
import puppeteer from "puppeteer";
import fs from "fs";


async function scrapeAgodaReviews(hotelId: number) {
    console.log(hotelId)
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

  const resp = await axios.post(
    "https://www.agoda.com/api/cronos/property/review/HotelReviews",
    postData,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Content-Type": "application/json",
      },
    }
  );

  let respData = await resp.data;
  let reviewData: { [k: string]: any } = {};
  const reviewList = respData.commentList.comments;
  let aggregateData = respData.score.demographics.filter(
    (v: any) => v.name === "All guests" && v.providerId === 332
  )[0];
  reviewData.hotelName = respData.hotelName;
  reviewData.aggregatedRating = aggregateData.score;
  reviewData.totalRating = aggregateData.count;

  let commentListArray: any[] = [];
  reviewList.map((d: any) => {
    let revd: { [k: string]: any } = {};
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
}

export default async function startAgoda(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const resp = await page.goto(url);
  await page.waitForSelector('[data-selenium*="script-initparam"]');
  const jsonInit = await page.$eval(
    `[data-selenium*="script-initparam"]`,
    (el) => el.innerHTML
  );
  const hotelId = jsonInit.match(/hotelId:+(\d+)/)![1];

  return await scrapeAgodaReviews(Number(hotelId));
}

