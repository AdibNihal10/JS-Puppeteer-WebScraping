// const puppeteer = require("puppeteer");

// async function scrapeUTMScholar() {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   let allScholarLinks = [];

//   console.log("Navigating to the faculty page...");
//   await page.goto("https://utmscholar.utm.my/faculties/28", {
//     waitUntil: "networkidle2",
//   });

//   let pageNumber = 1;

//   // Step 1: Gather all links across all pages (pagination)
//   while (true) {
//     console.log(`Extracting scholar links from page ${pageNumber}...`);

//     const scholarLinks = await page.evaluate(() => {
//       const rows = Array.from(
//         document.querySelectorAll(
//           "#FacultyListofScholars #ListScholarFacultyDashboard tbody tr"
//         )
//       );
//       return rows
//         .map((row) => {
//           const anchorTag = row.querySelector("td a");
//           return anchorTag ? anchorTag.href : null;
//         })
//         .filter((link) => link);
//     });

//     console.log(
//       `Found ${scholarLinks.length} scholar links on page ${pageNumber}.`
//     );
//     console.log(scholarLinks);
//     allScholarLinks.push(...scholarLinks);

//     const nextButton = await page.$("#ListScholarFacultyDashboard_next");
//     if (!nextButton) {
//       console.log("Next button not found, all pages processed.");
//       break;
//     }

//     const isDisabled = await page.evaluate(
//       (button) =>
//         button.classList.contains("disabled") ||
//         button.getAttribute("aria-disabled") === "true",
//       nextButton
//     );

//     if (isDisabled) {
//       console.log("Reached the last page, stopping pagination.");
//       break;
//     }

//     await page.evaluate((button) => {
//       button.scrollIntoView({
//         behavior: "smooth",
//         block: "end",
//         inline: "nearest",
//       });
//     }, nextButton);

//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     try {
//       await Promise.all([
//         page.evaluate((button) => button.click(), nextButton),
//         page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }),
//       ]);
//     } catch (navError) {
//       console.error("Navigation error:", navError);
//       console.log("Retrying next button click...");
//     }

//     pageNumber++;
//   }

//   console.log(`Total scholar links collected: ${allScholarLinks.length}`);

//   // Step 2: Visit each scholar link to scrape data
//   const scrapedData = [];

//   for (const link of allScholarLinks) {
//     console.log(`Navigating to scholar page: ${link}`);

//     let retryCount = 0;
//     let scholarData = null;

//     while (
//       retryCount < 3 &&
//       (!scholarData || Object.keys(scholarData).length === 0)
//     ) {
//       try {
//         await page.goto(link, {
//           waitUntil: ["networkidle0", "domcontentloaded"],
//           timeout: 30000,
//         });

//         // Wait for key elements
//         await Promise.all([
//           page.waitForSelector(".text-white", { timeout: 10000 }),
//           page.waitForSelector("#hIndexID", { timeout: 10000 }),
//           page.waitForSelector("#CountPublicIndexID", { timeout: 10000 }),
//         ]).catch(() => console.log("Some elements not found, continuing..."));

//         // Scroll through the page
//         await autoScroll(page);

//         // Wait after scrolling
//         await new Promise((resolve) => setTimeout(resolve, 2000));

//         console.log("Extracting data from scholar page...");

//         scholarData = await page.evaluate(() => {
//           const extractNumber = (element) => {
//             if (!element) return 0;
//             const text = element.textContent.trim();
//             if (!text) return 0;
//             const number = parseInt(text.replace(/\D/g, ""), 10);
//             return isNaN(number) ? 0 : number;
//           };

//           const dataObj = {};

//           // Extract data from text-white divs
//           const textWhiteDivs = Array.from(
//             document.querySelectorAll(".text-white")
//           );
//           textWhiteDivs.forEach((div) => {
//             if (!div) return;

//             const heading = div.querySelector("h6");
//             const valueElement = div.querySelector("h2");

//             if (heading && valueElement) {
//               const headingText = heading.textContent.trim();
//               const value = extractNumber(valueElement);
//               if (headingText && value !== undefined) {
//                 dataObj[headingText] = value;
//               }
//             }
//           });

//           // Extract H-Index
//           const hIndexElement = document.querySelector("#hIndexID");
//           if (hIndexElement) {
//             const hIndexText = hIndexElement.textContent.trim();
//             if (hIndexText) {
//               dataObj["H-INDEXED (SCOPUS)"] = extractNumber(hIndexElement);
//             }
//           }

//           // Extract Citations
//           const citationsElement = document.querySelector(
//             "#CountPublicIndexID"
//           );
//           if (citationsElement) {
//             const citationsText = citationsElement.textContent.trim();
//             if (citationsText) {
//               dataObj["CITATIONS (SCOPUS)"] = extractNumber(citationsElement);
//             }
//           }

//           // Extract Grant PI and Publications data
//           const inboxItems = Array.from(
//             document.querySelectorAll(".inbox-item")
//           );
//           inboxItems.forEach((item) => {
//             const titleElement = item.querySelector(".float-start");
//             const numberElement = item.querySelector(".float-end");

//             if (titleElement && numberElement) {
//               const title = titleElement.textContent.trim();
//               const number = extractNumber(numberElement);

//               if (title.includes("GRANT")) {
//                 dataObj["GRANT PI"] = number;
//               } else if (title.includes("PUBLICATION")) {
//                 dataObj["PUBLICATIONS"] = number;
//               }
//             }
//           });

//           return dataObj;
//         });

//         // Validate that we got meaningful data
//         const hasData = Object.values(scholarData).some((value) => value > 0);
//         if (!hasData) {
//           throw new Error("No meaningful data extracted");
//         }
//       } catch (error) {
//         console.error(`Attempt ${retryCount + 1} failed:`, error);
//         retryCount++;
//         if (retryCount < 3) {
//           console.log(`Retrying... (${retryCount}/3)`);
//           await new Promise((resolve) =>
//             setTimeout(resolve, 2000 * retryCount)
//           );
//         }
//         continue;
//       }
//     }

//     if (scholarData && Object.keys(scholarData).length > 0) {
//       console.log(`Data extracted from ${link}:`, scholarData);
//       scrapedData.push({
//         link,
//         ...scholarData,
//       });
//     } else {
//       console.error(
//         `Failed to extract data from ${link} after ${retryCount} attempts`
//       );
//       scrapedData.push({
//         link,
//         error: "Failed to extract data",
//       });
//     }
//   }

//   console.log("All scholar data has been scraped.");
//   console.log("Final scraped data:", scrapedData);

//   await browser.close();
// }

// // Fixed autoScroll function using setTimeout instead of waitForTimeout
// async function autoScroll(page) {
//   await page.evaluate(async () => {
//     const scroll = async () => {
//       return new Promise((resolve) => {
//         let totalHeight = 0;
//         const distance = 100;
//         const timer = setInterval(() => {
//           const scrollHeight = document.documentElement.scrollHeight;
//           window.scrollBy(0, distance);
//           totalHeight += distance;

//           if (totalHeight >= scrollHeight) {
//             clearInterval(timer);
//             resolve();
//           }
//         }, 100);
//       });
//     };

//     // Perform multiple scroll passes
//     for (let i = 0; i < 3; i++) {
//       await scroll();
//       // Scroll back to top between passes
//       window.scrollTo(0, 0);
//       await new Promise((r) => setTimeout(r, 500));
//     }
//   });

//   // Wait after scrolling
//   await new Promise((resolve) => setTimeout(resolve, 2000));
// }

// scrapeUTMScholar().catch(console.error);

const puppeteer = require("puppeteer");

async function scrapeUTMScholar() {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  let allScholarLinks = [];

  console.log("Navigating to the faculty page...");
  await page.goto("https://utmscholar.utm.my/faculties/28", {
    waitUntil: "networkidle2",
  });

  let pageNumber = 1;

  // Step 1: Gather all links across all pages (pagination)
  while (true) {
    console.log(`Extracting scholar links from page ${pageNumber}...`);

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
        .filter((link) => link);
    });

    console.log(
      `Found ${scholarLinks.length} scholar links on page ${pageNumber}.`
    );
    allScholarLinks.push(...scholarLinks);

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

    await page.evaluate((button) => {
      button.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      });
    }, nextButton);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      await Promise.all([
        page.evaluate((button) => button.click(), nextButton),
        page.waitForNavigation({ waitUntil: "networkidle2", timeout: 10000 }),
      ]);
    } catch (navError) {
      console.error("Navigation error:", navError);
      console.log("Retrying next button click...");
    }

    pageNumber++;
  }

  console.log(`Total scholar links collected: ${allScholarLinks.length}`);

  // Step 2: Visit each scholar link to scrape data
  const scrapedData = [];

  for (const link of allScholarLinks) {
    console.log(`Navigating to scholar page: ${link}`);

    let retryCount = 0;
    let scholarData = null;

    while (
      retryCount < 3 &&
      (!scholarData || Object.keys(scholarData).length === 0)
    ) {
      try {
        await page.goto(link, {
          waitUntil: ["networkidle0", "domcontentloaded"],
          timeout: 30000,
        });

        // Wait for key elements
        await Promise.all([
          page.waitForSelector(".text-white", { timeout: 10000 }),
          page.waitForSelector("#hIndexID", { timeout: 10000 }),
          page.waitForSelector("#CountPublicIndexID", { timeout: 10000 }),
        ]).catch(() => console.log("Some elements not found, continuing..."));

        // Scroll through the page
        await autoScroll(page);

        // Wait after scrolling
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("Extracting data from scholar page...");

        scholarData = await page.evaluate(() => {
          const extractNumber = (element) => {
            if (!element) return 0;
            const text = element.textContent.trim();
            if (!text) return 0;
            const number = parseInt(text.replace(/\D/g, ""), 10);
            return isNaN(number) ? 0 : number;
          };

          const dataObj = {};

          // Extract data from text-white divs
          const textWhiteDivs = Array.from(
            document.querySelectorAll(".text-white")
          );
          textWhiteDivs.forEach((div) => {
            if (!div) return;

            const heading = div.querySelector("h6");
            const valueElement = div.querySelector("h2");

            if (heading && valueElement) {
              const headingText = heading.textContent.trim();
              const value = extractNumber(valueElement);
              if (headingText && value !== undefined) {
                dataObj[headingText] = value;
              }
            }
          });

          // Extract H-Index
          const hIndexElement = document.querySelector("#hIndexID");
          if (hIndexElement) {
            const hIndexText = hIndexElement.textContent.trim();
            if (hIndexText) {
              dataObj["H-INDEXED (SCOPUS)"] = extractNumber(hIndexElement);
            }
          }

          // Extract Citations
          const citationsElement = document.querySelector(
            "#CountPublicIndexID"
          );
          if (citationsElement) {
            const citationsText = citationsElement.textContent.trim();
            if (citationsText) {
              dataObj["CITATIONS (SCOPUS)"] = extractNumber(citationsElement);
            }
          }

          // Updated part: Extract Grant PI, Publications, and other relevant data
          const inboxItems = Array.from(
            document.querySelectorAll(".inbox-item")
          );
          inboxItems.forEach((item) => {
            const titleElement = item.querySelector(".float-start");
            const numberElement = item.querySelector(".float-end");

            if (titleElement && numberElement) {
              const title = titleElement.textContent.trim();
              const value = extractNumber(numberElement);
              if (title && value !== undefined) {
                dataObj[title] = value; // Use title as key and number as value
              }
            }
          });

          return dataObj;
        });

        // Validate that we got meaningful data
        const hasData = Object.values(scholarData).some((value) => value > 0);
        if (!hasData) {
          throw new Error("No meaningful data extracted");
        }
      } catch (error) {
        console.error(`Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount < 3) {
          console.log(`Retrying... (${retryCount}/3)`);
          await new Promise((resolve) =>
            setTimeout(resolve, 2000 * retryCount)
          );
        }
        continue;
      }
    }

    if (scholarData && Object.keys(scholarData).length > 0) {
      console.log(`Data extracted from ${link}:`, scholarData);
      scrapedData.push({
        link,
        ...scholarData,
      });
    } else {
      console.error(
        `Failed to extract data from ${link} after ${retryCount} attempts`
      );
      scrapedData.push({
        link,
        error: "Failed to extract data",
      });
    }
  }

  console.log("All scholar data has been scraped.");
  console.log("Final scraped data:", scrapedData);

  await browser.close();
}

// Fixed autoScroll function using setTimeout instead of waitForTimeout
async function autoScroll(page) {
  await page.evaluate(async () => {
    const scroll = async () => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.documentElement.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    };

    // Perform multiple scroll passes
    for (let i = 0; i < 3; i++) {
      await scroll();
      // Scroll back to top between passes
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 500));
    }
  });

  // Wait after scrolling
  await new Promise((resolve) => setTimeout(resolve, 2000));
}

scrapeUTMScholar().catch(console.error);
