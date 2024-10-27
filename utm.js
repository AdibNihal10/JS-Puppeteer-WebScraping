const puppeteer = require("puppeteer");

async function scrapeUTMScholar() {
  console.log("Starting the scraper...");
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("Navigating to the UTM Scholar page...");
    await page.goto("https://utmscholar.utm.my/faculties/28", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    console.log("Page loaded successfully");

    let pageNumber = 1;
    let allScrapedData = [];

    while (true) {
      console.log(`Processing page ${pageNumber}...`);

      console.log("Waiting for the list of scholars to load...");
      await page.waitForSelector("#FacultyListofScholars", { timeout: 30000 });
      console.log("Scholar list loaded");

      // Extract scholar links
      console.log("Extracting scholar links...");
      const scholarLinks = await page.evaluate(() => {
        const rows = Array.from(
          document.querySelectorAll(
            "#FacultyListofScholars #ListScholarFacultyDashboard tbody tr"
          )
        );
        return rows
          .map((row) => row.querySelector("td a").href)
          .filter((link) => link);
      });
      console.log(`Found ${scholarLinks.length} scholar links on this page.`);

      // Process each scholar link
      for (const link of scholarLinks) {
        console.log(`Navigating to scholar page: ${link}`);
        await page.goto(link, { waitUntil: "networkidle0", timeout: 30000 });

        console.log("Extracting data from scholar page...");
        const scholarData = await page.evaluate(() => {
          const extractNumber = (element) => {
            if (element) {
              const number = parseInt(
                element.textContent.replace(/\D/g, ""),
                10
              );
              return isNaN(number) ? 0 : number;
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

          dataObj["H-INDEXED (SCOPUS)"] = extractNumber(
            document.querySelector("#hIndexID")
          );
          dataObj["CITATIONS (SCOPUS)"] = extractNumber(
            document.querySelector("#CountPublicIndexID")
          );

          return dataObj;
        });

        console.log(`Data extracted from ${link}:`, scholarData);
        allScrapedData.push(scholarData);
      }

      // Check for next page
      console.log("Checking for next page...");
      const nextButton = await page.$("#ListScholarFacultyDashboard_next");
      if (!nextButton) {
        console.log("Next button not found. Exiting.");
        break;
      }

      const isDisabled = await page.evaluate(
        (button) =>
          button.classList.contains("disabled") ||
          button.getAttribute("aria-disabled") === "true",
        nextButton
      );

      if (isDisabled) {
        console.log("Reached the last page. Exiting.");
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

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Attempting to click the next button...");
      try {
        await Promise.all([
          page.evaluate((button) => button.click(), nextButton),
          page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }),
        ]);
        console.log("Next button clicked and navigation completed");
      } catch (navError) {
        console.error("Navigation error:", navError);
        console.log("Attempting to continue despite navigation error...");
      }

      pageNumber++;
    }

    console.log("All data has been scraped.");
    console.log("Final scraped data:", allScrapedData);
  } catch (error) {
    console.error("An error occurred during scraping:", error);
  } finally {
    console.log("Closing the browser...");
    await browser.close();
    console.log("Browser closed. Scraping completed.");
  }
}

scrapeUTMScholar().catch(console.error);
