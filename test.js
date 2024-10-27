// const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({ headless: false }); // Show browser
//   const page = await browser.newPage();

//   console.log("Navigating to the faculty page...");
//   // Navigate to the main page
//   await page.goto("https://utmscholar.utm.my/faculties/28", {
//     waitUntil: "networkidle2",
//   });

//   // Wait for the "Next" button (whether disabled or not) to be loaded in the DOM
//   await page.waitForSelector("#ListScholarFacultyDashboard_next", {
//     visible: true,
//   });

//   // Now check if the button has the class "disabled"
//   const isDisabled = await page.evaluate(() => {
//     const nextButton = document.querySelector("li.next");
//     return nextButton && nextButton.classList.contains("disabled");
//   });

//   console.log("Is 'Next' button disabled?", isDisabled); // Output true if disabled, false otherwise

//   await browser.close();
// })();

const puppeteer = require("puppeteer");

async function scrapeUTMScholar() {
  console.log("Starting the scraper...");
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: false,
    userDataDir: "./tmp",
  });
  console.log("Browser launched");
  const page = await browser.newPage();
  console.log("New page created");

  try {
    console.log("Navigating to the UTM Scholar page...");
    await page.goto("https://utmscholar.utm.my/faculties/28", {
      waitUntil: "networkidle0",
      timeout: 60000,
    });
    console.log("Page loaded successfully");

    let pageNumber = 1;
    while (true) {
      console.log(`Processing page ${pageNumber}...`);

      console.log("Waiting for the list of scholars to load...");
      await page.waitForSelector("#FacultyListofScholars", { timeout: 30000 });
      console.log("Scholar list loaded");

      // Wait a bit for any dynamic content to load
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Extracting scholar data...");
      const scholars = await page.evaluate(() => {
        const scholarItems = document.querySelectorAll(
          "#FacultyListofScholars .scholar-item"
        );
        console.log("Number of scholar items found:", scholarItems.length);
        return Array.from(scholarItems).map((item) => ({
          name:
            item.querySelector(".scholar-name")?.textContent.trim() ||
            "Name not found",
          department:
            item.querySelector(".scholar-department")?.textContent.trim() ||
            "Department not found",
        }));
      });
      console.log(`Extracted data for ${scholars.length} scholars`);

      if (scholars.length === 0) {
        console.log("No scholars found on this page. Checking page source...");
        const pageContent = await page.content();
        console.log("Page content:", pageContent);
      }

      scholars.forEach((scholar) => {
        console.log(`Name: ${scholar.name}, Department: ${scholar.department}`);
      });

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
  } catch (error) {
    console.error("An error occurred during scraping:", error);
  } finally {
    console.log("Closing the browser...");
    await browser.close();
    console.log("Browser closed. Scraping completed.");
  }
}

scrapeUTMScholar().catch(console.error);
