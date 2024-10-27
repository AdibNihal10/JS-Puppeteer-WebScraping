// const puppeteer = require("puppeteer");

// async function scrapeUTMScholar() {
//   console.log("Starting the scraper...");
//   const browser = await puppeteer.launch({ headless: false });
//   console.log("Browser launched");
//   const page = await browser.newPage();
//   console.log("New page created");

//   try {
//     console.log("Navigating to the UTM Scholar page...");
//     await page.goto("https://utmscholar.utm.my/faculties/28", {
//       waitUntil: "networkidle0",
//       timeout: 60000,
//     });
//     console.log("Page loaded successfully");

//     let pageNumber = 1;
//     let allScholarLinks = [];

//     while (true) {
//       console.log(`Processing page ${pageNumber}...`);

//       console.log("Waiting for the list of scholars to load...");
//       await page.waitForSelector("#FacultyListofScholars", { timeout: 30000 });
//       console.log("Scholar list loaded");

//       // Wait a bit for any dynamic content to load
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       console.log("Extracting scholar links...");
//       const scholarLinks = await page.evaluate(() => {
//         const rows = document.querySelectorAll(
//           "#ListScholarFacultyDashboard tbody tr"
//         );
//         return Array.from(rows)
//           .map((row) => {
//             const linkElement = row.querySelector("td a");
//             return linkElement ? linkElement.href : null;
//           })
//           .filter((link) => link !== null); // Remove null links
//       });

//       console.log(`Extracted ${scholarLinks.length} scholar links`);
//       allScholarLinks = [...allScholarLinks, ...scholarLinks];

//       // Log scholar links for this page
//       scholarLinks.forEach((link, index) => {
//         console.log(`Scholar ${index + 1}: ${link}`);
//       });

//       console.log("Checking for next page...");
//       const nextButton = await page.$("#ListScholarFacultyDashboard_next");
//       if (!nextButton) {
//         console.log("Next button not found. Exiting.");
//         break;
//       }

//       const isDisabled = await page.evaluate(
//         (button) =>
//           button.classList.contains("disabled") ||
//           button.getAttribute("aria-disabled") === "true",
//         nextButton
//       );

//       if (isDisabled) {
//         console.log("Reached the last page. Exiting.");
//         break;
//       }

//       console.log("Scrolling to make the next button visible...");
//       await page.evaluate((button) => {
//         button.scrollIntoView({
//           behavior: "smooth",
//           block: "end",
//           inline: "nearest",
//         });
//       }, nextButton);

//       // Wait a moment for the scroll to complete
//       await new Promise((resolve) => setTimeout(resolve, 1000));

//       console.log("Attempting to click the next button...");
//       try {
//         await Promise.all([
//           page.evaluate((button) => button.click(), nextButton),
//           page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }),
//         ]);
//         console.log("Next button clicked and navigation completed");
//       } catch (navError) {
//         console.error("Navigation error:", navError);
//         console.log("Attempting to continue despite navigation error...");
//       }

//       pageNumber++;
//     }

//     console.log("All scholar links have been extracted:");
//     console.log(allScholarLinks);
//   } catch (error) {
//     console.error("An error occurred during scraping:", error);
//   } finally {
//     console.log("Closing the browser...");
//     await browser.close();
//     console.log("Browser closed. Scraping completed.");
//   }
// }

// scrapeUTMScholar().catch(console.error);

// Solution-2

const puppeteer = require("puppeteer");

async function scrapeUTMScholar() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let allScholarLinks = []; // Array to store all scholar links

  console.log("Navigating to the faculty page...");
  await page.goto("https://utmscholar.utm.my/faculties/28", {
    waitUntil: "networkidle2",
  });

  let pageNumber = 1;

  // Step 1: Gather all links across all pages (pagination)
  while (true) {
    console.log(`Extracting scholar links from page ${pageNumber}...`);

    // Extract the scholar links from the current page
    const scholarLinks = await page.evaluate(() => {
      const rows = Array.from(
        document.querySelectorAll(
          "#FacultyListofScholars #ListScholarFacultyDashboard tbody tr"
        )
      );
      return rows
        .map((row) => {
          const anchorTag = row.querySelector("td a");
          return anchorTag ? anchorTag.href : null;
        })
        .filter((link) => link); // Filter out any null links
    });

    console.log(
      `Found ${scholarLinks.length} scholar links on page ${pageNumber}.`
    );
    allScholarLinks.push(...scholarLinks);
    console.log(scholarLinks); // Add links to the array

    // Check if there's a next page
    const nextButton = await page.$("#ListScholarFacultyDashboard_next");
    if (!nextButton) {
      console.log("Next button not found, all pages processed.");
      break;
    }

    const isDisabled = await page.evaluate(
      (button) =>
        button.classList.contains("disabled") ||
        button.getAttribute("aria-disabled") === "true",
      nextButton
    );

    if (isDisabled) {
      console.log("Reached the last page, stopping pagination.");
      break;
    }

    console.log("Scrolling to make the next button visible...");
    await page.evaluate((button) => {
      button.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }, nextButton);

    // Add a delay to avoid any page-load stalling issues
    await new Promise((resolve) => setTimeout(resolve, 1000));

    console.log("Attempting to click the next button...");

    try {
      // Clicking and handling navigation, with some retry logic
      await Promise.all([
        page.evaluate((button) => button.click(), nextButton),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }),
      ]);
      console.log("Next button clicked and page navigation completed.");
    } catch (navError) {
      console.error("Navigation error:", navError);
      console.log("Retrying next button click...");
    }

    // Increase page number for next iteration
    pageNumber++;
  }

  console.log(`Total scholar links collected: ${allScholarLinks.length}`);

  // Step 2: Visit each scholar link to scrape data
  const scrapedData = [];

  for (const link of allScholarLinks) {
    console.log(`Navigating to scholar page: ${link}`);
    await page.goto(link, { waitUntil: "networkidle2" });

    console.log("Extracting data from scholar page...");
    // Extract data from the scholar's page
    const scholarData = await page.evaluate(() => {
      const extractNumber = (element) => {
        if (element) {
          const number = parseInt(element.textContent.replace(/\D/g, ""), 10);
          return isNaN(number) ? 0 : number; // Return 0 if not a valid number
        }
        return 0;
      };

      const textWhiteDivs = Array.from(
        document.querySelectorAll(".text-white")
      );
      const dataObj = {};

      textWhiteDivs.forEach((div) => {
        const heading = div.querySelector("h6")
          ? div.querySelector("h6").textContent.trim()
          : "";
        const valueElement = div.querySelector("h2");
        const value = extractNumber(valueElement);

        if (heading !== "" && value !== 0) {
          dataObj[heading] = value;
        }
      });

      const hIndexScopus = extractNumber(document.querySelector("#hIndexID"));
      const citations = extractNumber(
        document.querySelector("#CountPublicIndexID")
      );

      dataObj["H-INDEXED (SCOPUS)"] = hIndexScopus;
      dataObj["CITATIONS (SCOPUS)"] = citations;

      return dataObj;
    });

    console.log(`Data extracted from ${link}:`, scholarData);
    scrapedData.push(scholarData); // Save data for each scholar
  }

  console.log("All scholar data has been scraped.");
  console.log("Final scraped data:", scrapedData);

  await browser.close();
}

scrapeUTMScholar().catch(console.error);
