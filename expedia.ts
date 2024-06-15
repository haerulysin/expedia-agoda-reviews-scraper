import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";
async function parse(data: any) {
  let reviewSummary = data.propertyReviewSummaries[0];
  let reviewList = data.propertyInfo.reviewInfo.reviews;
  let reviewData: { [k: string]: any } = {
    hotelName: "",
    aggregatedRating: Number(
      reviewSummary.overallScoreWithDescriptionA11y.value.split("/")[0] || 0
    ),
    totalRating: reviewSummary.totalCount.raw | 0,
    reviews: [],
  };
  reviewList.map((d: { [objKey: string]: any }) => {
    let revd: { [k: string]: any } = {};
    revd.id = d.id;
    revd.title = d.superlative;
    revd.author = d.reviewAuthorAttribution.text;
    revd.date = d.submissionTime.longDateFormat;
    revd.text = d.text;
    revd.ownerResponse = d.managementResponses[0]
      ? d.managementResponses[0].response
      : "";
    revd.ownerResponseDate = d.managementResponses[0]
      ? d.managementResponses[0].header.text.match(/\s+on+\s+(.*)/)![1]
      : "";

    reviewData.reviews.push(revd);
  });

  return reviewData;
}

async function scrapeExpediaGraphql(hotelId: number | string, cookie: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Content-Type": "application/json",
    "client-info": "blossom-flex-ui,a,us-west-2",
    // "cookie": cookie,
  });

  let duaid = cookie.match(/DUAID=(\S*\d+\w+)/)![1];
  let postData = JSON.stringify([
    {
      operationName: "PropertyFilteredReviewsQuery",
      variables: {
        context: {
          siteId: 1,
          locale: "en_US",
          eapid: 0,
          currency: "USD",
          device: {
            type: "DESKTOP",
          },
          identity: {
            duaid,
            authState: "ANONYMOUS",
          },
          privacyTrackingState: "CAN_TRACK",
          debugContext: {
            abacusOverrides: [],
          },
        },
        propertyId: `${hotelId}`,
        searchCriteria: {
          primary: {
            dateRange: null,
            rooms: [
              {
                adults: 2,
              },
            ],
            destination: {
              regionId: "553248635358954983",
            },
          },
          secondary: {
            booleans: [
              {
                id: "includeRecentReviews",
                value: true,
              },
              {
                id: "includeRatingsOnlyReviews",
                value: true,
              },
              {
                id: "overrideEmbargoForIndividualReviews",
                value: true,
              },
              {
                id: "isFilteredSummary",
                value: true,
              },
            ],
            counts: [
              {
                id: "startIndex",
                value: 0,
              },
              {
                id: "size",
                value: 10000,
              },
            ],
            selections: [
              {
                id: "sortBy",
                value: "NEWEST_TO_OLDEST",
              },
              {
                id: "searchTerm",
                value: "",
              },
              {
                id: "popularMention",
                value: "",
              },
            ],
          },
        },
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "f5be675837353ba644f02298c3e9d962c0a376b3414b1f9b2d7f0b21a0ced4e5",
        },
      },
    },
  ]);

  await page.setRequestInterception(true);
  page.on("request", (req) => {
    let override = {};
    if (req.url() === "https://www.expedia.com/graphql") {
      override = {
        method: "POST",
        postData,
      };
    }
    req.continue(override);
  });
  const resp = await page.goto("https://www.expedia.com/graphql", {
    waitUntil: "domcontentloaded",
  });
  await page.setViewport({ width: 1080, height: 1924 });
  if (resp?.status() === 200) {
    await page.waitForSelector("pre", { timeout: 0 });
    let data = JSON.parse(await page.$eval("pre", (el) => el.innerText));
    return data;
  }

  if (resp?.status() !== 200) {
    return { error: resp?.statusText(), code: resp?.status() };
  }
  await browser.close();
}

export default async function startExpedia(url: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "client-info": "blossom-flex-ui,a,us-west-2",
  });
  // await page.setJavaScriptEnabled(true);
  await page.setViewport({ width: 1080, height: 1924 });
  const resp = await page.goto(url, {
    waitUntil: "domcontentloaded",
  });

  let title = await page.$eval("title", (el) => el.innerText);
  let hotelName = title.match(/^(.*?).Reviews/)![1] || "";
  const cookie = resp?.headers()["set-cookie"];
  let hotelId = url.match(/.h+(\d+)/)![1];
  browser.close();
  const data = await scrapeExpediaGraphql(hotelId, cookie!);
  return await parse(data[0].data);
}

// let sampleHotel =
//   "https://www.expedia.com/Zurich-Hotels-Leoneck-Swiss-Hotel.h41157.Hotel-Information";
// let sampleHotel2 =
//   "https://www.expedia.com/Zurich-Hotels-AMERON-Zurich-Bellerive-Au-Lac.h47162.Hotel-Information";

// // let hotelId = sampleHotel.match(/.h+(\d+)/)![1];

// let res = init(sampleHotel2).then((d) => console.log(d));