const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const WebSocket = require("ws");
const GGGrantModel = require("../models/gggrants");
const { extractNIHData } = require("./nih_server"); // imported the function to scrape NIH data
const app = express();

// Enable CORS for all routes
app.use(cors());

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8081 });

let wsClient = null;

// Handle WebSocket connection
wss.on("connection", (ws) => {
  wsClient = ws;
  ws.on("close", () => {
    wsClient = null;
  });
});

async function extractGrantGovData() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });
  const page = await browser.newPage();
  const targetUrl = "https://www.grants.gov/search-grants";
  await page.goto(targetUrl, { timeout: 60000 });

  await page.waitForSelector("tbody > tr > td", { timeout: 60000 });

  // Initialize data array
  const grantsData = [];
  let GGgrantsCount = 0;
  let currentPage = 1;
  let lastPageReached = false;
  let totalCellCount = 0;

  while (!lastPageReached) {
    // Extract table data for the current page
    const tableRows = await page.$$("tbody > tr");
    for (const row of tableRows) {
      const cells = await row.$$("td");
      let rowData = [];
      let opportunityLink = "";

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];

        if (i === 0) {
          // Extract the OpportunityId and its link
          const anchor = await cell.$("a");
          const cellText = await page.evaluate(
            (el) => el.textContent.trim(),
            cell
          );
          if (anchor) {
            opportunityLink = await page.evaluate((el) => el.href, anchor);
          }
          rowData.push(cellText);
        } else {
          const cellText = await page.evaluate(
            (el) => el.textContent.trim(),
            cell
          );
          rowData.push(cellText);
        }
      }
      totalCellCount += rowData.length;

      // Add grant data to array
      grantsData.push({
        OpportunityId: rowData[0],
        OpportunityLink: opportunityLink, // Gets the link of each of the grants
        Title: rowData[1],
        Department: rowData[2],
        Status: rowData[3],
        PostedDate: rowData[4],
        ClosingDate: rowData[5],
      });

      // Increment the grants count and send update via WebSocket
      GGgrantsCount++;
      if (wsClient) {
        wsClient.send(JSON.stringify({ GGgrantsCount }));
      }
    }

    // Check for the last page
    const lastPageSelector =
      "tfoot nav ul li a.usa-pagination__button.bg-white.usa-current";
    const lastPageElement = await page.$(lastPageSelector);
    if (lastPageElement) {
      const pgnumber = await page.evaluate(
        (el) => el.textContent.trim(),
        lastPageElement
      );
      if (pgnumber === "95") {
        lastPageReached = true;
        console.log("Reached the last page (page 95). Stopping extraction.");
        if (wsClient) {
          wsClient.send(
            JSON.stringify({ message: "Scraping Completed", GGgrantsCount })
          );
        }
      } else {
        // Navigate to the next page
        await page.click("tfoot nav ul li button.usa-pagination__next-page");
        await page.waitForSelector("tbody > tr:first-child", {
          timeout: 60000,
        }); // Wait for the first table row to appear
        currentPage++;
      }
      console.log(pgnumber);
    } else {
      // No "Next" button, likely reached the last page
      lastPageReached = true;
      console.log("Reached the last page. Stopping extraction.");
      if (wsClient) {
        wsClient.send(
          JSON.stringify({ message: "Scraping Completed", GGgrantsCount })
        );
      }
    }
  }

  // Check if data exists before deleting
  const existingDataCount = await GGGrantModel.countDocuments({});
  if (existingDataCount > 0) {
    await GGGrantModel.deleteMany({});
    console.log(`Deleted ${existingDataCount} old records.`);
  }

  // Insert new data
  await GGGrantModel.insertMany(grantsData);

  console.log(totalCellCount);

  // Save data to JSON file
  const filePath = path.join(__dirname, "grantsGov.json");
  fs.writeFileSync(filePath, JSON.stringify(grantsData, null, 2), "utf8");

  console.log(grantsData); // Print in the console
  await browser.close();
}

module.exports = { extractGrantGovData };
