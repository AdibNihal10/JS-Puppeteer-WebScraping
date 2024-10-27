// const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     userDataDir: "./tmp",
//   });
//   const page = await browser.newPage();

//   await page.goto("https://utmscholar.utm.my/Scholar/ScholarInfoDetails/E2YG");

//   const ScholarInfoDetails = await page.$$(".text-white");
//   const GrantInfoDetails = await page.$$(".inbox-item");
//   let items = [];
//   for (const detail of ScholarInfoDetails) {
//     try {
//       const item = await page.evaluate((el) => {
//         const titleElement = el.querySelector("h6");
//         const valueElement = el.querySelector("h2");
//         if (titleElement && valueElement) {
//           const title = titleElement.textContent.trim();
//           const value = valueElement.textContent.trim();
//           return { Title: title, Value: value }; // Return an object with title and value
//         }
//         return null; // Skip adding to array if either title or value is missing
//       }, detail);

//       if (item) {
//         // Only add to array if item is not null
//         items.push(item);
//       }
//     } catch (error) {
//       console.log("Error retrieving details:", error.message);
//     }
//   }

//   console.log(items);
//   // for (const grantDetail of GrantInfoDetails) {
//   //   try {
//   //     const text = await page.evaluate((el) => {
//   //       const label = el.querySelector(".float-start")
//   //         ? el.querySelector(".float-start").textContent
//   //         : "Label missing";
//   //       const number = el.querySelector(".float-end")
//   //         ? el.querySelector(".float-end").textContent
//   //         : "Number missing";
//   //       return `${label}: ${number}`;
//   //     }, grantDetail);
//   //     console.log(text);
//   //   } catch (error) {
//   //     console.log("Error retrieving details:", error.message);
//   //   }
//   // }
//   //   await browser.close();
// })();

// const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     userDataDir: "./tmp",
//   });
//   const page = await browser.newPage();

//   // Step 1: Navigate to the faculties page
//   await page.goto("https://utmscholar.utm.my/faculties/28");

//   // Step 2: Wait for the table with id "ListScholarFacultyDashboard" to load
//   await page.waitForSelector("#ListScholarFacultyDashboard");

//   // Step 3: Get the list of all <a> elements within the table
//   const scholarLinks = await page.$$eval(
//     "#ListScholarFacultyDashboard tbody tr td a",
//     (links) => links.map((link) => link.href) // Extract the href attribute from each <a>
//   );

//   console.log("Scholar links found:", scholarLinks);

//   // Loop through each scholar link and scrape data
//   for (const link of scholarLinks) {
//     try {
//       // Step 4: Navigate to the scholar's page
//       await page.goto(link);

//       // Step 5: Perform scraping logic as described previously
//       const ScholarInfoDetails = await page.$$(".text-white");
//       const items = [];
//       for (const detail of ScholarInfoDetails) {
//         try {
//           const item = await page.evaluate((el) => {
//             const titleElement = el.querySelector("h6");
//             const valueElement = el.querySelector("h2");
//             if (titleElement && valueElement) {
//               const title = titleElement.textContent.trim();
//               const value = valueElement.textContent.trim();
//               return { Title: title, Value: value }; // Return an object with title and value
//             }
//             return null; // Skip adding to array if either title or value is missing
//           }, detail);

//           if (item) {
//             items.push(item);
//           }
//         } catch (error) {
//           console.log("Error retrieving details:", error.message);
//         }
//       }

//       console.log(`Data from ${link}:`, items);
//     } catch (error) {
//       console.log(`Error scraping scholar page ${link}:`, error.message);
//     }
//   }

//   await browser.close();
// })();

// const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     userDataDir: "./tmp",
//   });
//   const page = await browser.newPage();

//   // Step 1: Navigate to the faculties page
//   await page.goto("https://utmscholar.utm.my/faculties/28");

//   // Step 2: Wait for the table with id "ListScholarFacultyDashboard" to load
//   await page.waitForSelector("#ListScholarFacultyDashboard");

//   // Step 3: Get the list of all <a> elements within the table
//   const scholarLinks = await page.$$eval(
//     "#ListScholarFacultyDashboard tbody tr td a",
//     (links) => links.map((link) => link.href)
//   );

//   console.log("Scholar links found:", scholarLinks);

//   // Array to store all the data from all scholar pages
//   let allScholarData = [];

//   // Loop through each scholar link and scrape data
//   for (const link of scholarLinks) {
//     try {
//       // Step 4: Navigate to the scholar's page
//       await page.goto(link);

//       // Step 5: Wait for an element that signifies the page is fully loaded
//       await page.waitForSelector(".text-white"); // Adjust selector based on actual page content

//       // Scrape the data from the scholar's page
//       const ScholarInfoDetails = await page.$$(".text-white");
//       let scholarData = {}; // Object to store title-value pairs for the current scholar

//       for (const detail of ScholarInfoDetails) {
//         try {
//           const item = await page.evaluate((el) => {
//             const titleElement = el.querySelector("h6");
//             const valueElement = el.querySelector("h2");
//             if (titleElement && valueElement) {
//               const title = titleElement.textContent.trim();
//               let value = valueElement.textContent.trim();

//               // Parse value as a number, and default to 0 if it's not valid
//               value = value ? parseFloat(value) : 0;

//               // Only add the item if title is not "TOTAL STUDENTS"
//               if (title !== "TOTAL STUDENTS") {
//                 return { Title: title, Value: value }; // Return object with title and numeric value
//               }
//             }
//             return null; // Skip adding to object if title or value is missing
//           }, detail);

//           if (item) {
//             scholarData[item.Title] = item.Value;
//           }
//         } catch (error) {
//           console.log("Error retrieving details:", error.message);
//         }
//       }

//       // Check specifically for H-index and citations after gathering all data
//       const hIndexElement = await page.$("#hIndexID"); // Adjust the selector if necessary
//       const citationsElement = await page.$("#citationsID"); // Adjust the selector if necessary

//       if (hIndexElement) {
//         const hIndexValue = await page.evaluate(
//           (el) => parseFloat(el.textContent.trim()),
//           hIndexElement
//         );
//         scholarData["H-INDEXED (SCOPUS)"] = hIndexValue >= 0 ? hIndexValue : 0;
//       }

//       if (citationsElement) {
//         const citationsValue = await page.evaluate(
//           (el) => parseFloat(el.textContent.trim()),
//           citationsElement
//         );
//         scholarData["CITATIONS (SCOPUS)"] =
//           citationsValue >= 0 ? citationsValue : 0;
//       }

//       // Add the current scholar's data to the main array
//       allScholarData.push(scholarData);

//       console.log(`Data from ${link}:`, scholarData);
//     } catch (error) {
//       console.log(`Error scraping scholar page ${link}:`, error.message);
//     }
//   }

//   // Log all the data from all scholars
//   console.log("All scholar data:", allScholarData);

//   await browser.close();
// })();
// const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     userDataDir: "./tmp",
//   });
//   const page = await browser.newPage();

//   // Step 1: Navigate to the faculties page
//   await page.goto("https://utmscholar.utm.my/faculties/28");

//   // Step 2: Wait for the table with id "ListScholarFacultyDashboard" to load
//   await page.waitForSelector("#ListScholarFacultyDashboard");

//   // Step 3: Get the list of all <a> elements within the table
//   const scholarLinks = await page.$$eval(
//     "#ListScholarFacultyDashboard tbody tr td a",
//     (links) => links.map((link) => link.href) // Extract the href attribute from each <a>
//   );

//   console.log("Scholar links found:", scholarLinks);

//   // Initialize an array to hold all scholar data
//   const allScholarData = [];

//   // Loop through each scholar link and scrape data
//   for (const link of scholarLinks) {
//     try {
//       // Step 4: Navigate to the scholar's page
//       await page.goto(link);

//       // Step 5: Perform scraping logic as described previously
//       const ScholarInfoDetails = await page.$$(".text-white");
//       const scholarData = {
//         "GRANT(PI & MEMBERS)": 0,
//         PUBLICATIONS: 0,
//         "INDEXED PUBLICATION": 0,
//         "H-INDEXED (SCOPUS)": 0,
//         "CITATIONS (SCOPUS)": 0,
//       };

//       for (const detail of ScholarInfoDetails) {
//         try {
//           const item = await page.evaluate((el) => {
//             const titleElement = el.querySelector("h6");
//             const valueElement = el.querySelector("h2");
//             if (titleElement && valueElement) {
//               const title = titleElement.textContent.trim();
//               const value = valueElement.textContent.trim();
//               return { Title: title, Value: value }; // Return an object with title and value
//             }
//             return null; // Skip adding to array if either title or value is missing
//           }, detail);

//           if (item) {
//             // Check if the title is in our scholarData object
//             if (item.Title in scholarData) {
//               // Parse the value as an integer; if NaN, set to 0
//               scholarData[item.Title] = parseInt(item.Value) || 0;
//             }
//           }
//         } catch (error) {
//           console.log("Error retrieving details:", error.message);
//         }
//       }

//       // Step 6: Wait for the H-INDEX span to appear and extract the value
//       try {
//         await page.waitForSelector("#hIndexID", { timeout: 50000 }); // Wait for up to 5 seconds
//         const hIndexValue = await page.$eval(
//           "#hIndexID",
//           (el) => parseInt(el.textContent.trim()) || 0
//         );
//         scholarData["H-INDEXED (SCOPUS)"] = hIndexValue;
//       } catch (error) {
//         console.log("H-INDEX not found:", error.message);
//       }

//       // Step 7: Wait for the CITATIONS span to appear and extract the value
//       try {
//         await page.waitForSelector("#CountPublicIndexID", { timeout: 50000 }); // Wait for up to 5 seconds
//         const citationValue = await page.$eval(
//           "#CountPublicIndexID",
//           (el) => parseInt(el.textContent.trim()) || 0
//         );
//         scholarData["CITATIONS (SCOPUS)"] = citationValue;
//       } catch (error) {
//         console.log("CITATIONS not found:", error.message);
//       }

//       // Add the scholar data to the allScholarData array
//       allScholarData.push(scholarData);
//       console.log(`Data from ${link}:`, scholarData);
//     } catch (error) {
//       console.log(`Error scraping scholar page ${link}:`, error.message);
//     }
//   }

//   console.log("All scholar data:", allScholarData);
//   await browser.close();
// })();

// const puppeteer = require("puppeteer");

// (async () => {
//   const browser = await puppeteer.launch({
//     headless: false,
//     defaultViewport: false,
//     userDataDir: "./tmp",
//   });
//   const page = await browser.newPage();

//   // Step 1: Navigate to the faculties page
//   await page.goto("https://utmscholar.utm.my/faculties/28");

//   // Step 2: Wait for the table with id "ListScholarFacultyDashboard" to load
//   await page.waitForSelector("#ListScholarFacultyDashboard");

//   // Step 3: Get the list of all <a> elements within the table
//   const scholarLinks = await page.$$eval(
//     "#ListScholarFacultyDashboard tbody tr td a",
//     (links) => links.map((link) => link.href) // Extract the href attribute from each <a>
//   );

//   console.log("Scholar links found:", scholarLinks);

//   // Initialize an array to hold all scholar data
//   const allScholarData = [];

//   // Loop through each scholar link and scrape data
//   for (const link of scholarLinks) {
//     try {
//       // Step 4: Navigate to the scholar's page
//       await page.goto(link);

//       // Step 5: Perform scraping logic as described previously
//       const ScholarInfoDetails = await page.$$(".text-white");
//       const scholarData = {
//         "GRANT(PI & MEMBERS)": 0,
//         PUBLICATIONS: 0,
//         "INDEXED PUBLICATION": 0,
//         "H-INDEXED (SCOPUS)": 0,
//         "CITATIONS (SCOPUS)": 0,
//       };

//       for (const detail of ScholarInfoDetails) {
//         try {
//           const item = await page.evaluate((el) => {
//             const titleElement = el.querySelector("h6");
//             const valueElement = el.querySelector("h2");
//             if (titleElement && valueElement) {
//               const title = titleElement.textContent.trim();
//               const value = valueElement.textContent.trim();
//               return { Title: title, Value: value }; // Return an object with title and value
//             }
//             return null; // Skip adding to array if either title or value is missing
//           }, detail);

//           if (item) {
//             // Check if the title is in our scholarData object
//             if (item.Title in scholarData) {
//               // Parse the value as an integer; if NaN, set to 0
//               scholarData[item.Title] = parseInt(item.Value) || 0;
//             }
//           }
//         } catch (error) {
//           console.log("Error retrieving details:", error.message);
//         }
//       }

//       // Step 6: Wait for the H-INDEX span to appear and extract the value
//       try {
//         await page.waitForSelector("#hIndexID", { timeout: 5000 }); // Wait for up to 5 seconds
//         const hIndexValue = await page.$eval("#hIndexID", (el) =>
//           parseInt(el.textContent.trim())
//         );
//         scholarData["H-INDEXED (SCOPUS)"] = hIndexValue;
//       } catch (error) {
//         console.log("H-INDEX not found:", error.message);
//       }

//       // Step 7: Wait for the CITATIONS span to appear and extract the value
//       try {
//         await page.waitForSelector("#CountPublicIndexID", { timeout: 5000 }); // Wait for up to 5 seconds
//         const citationValue = await page.$eval("#CountPublicIndexID", (el) =>
//           parseInt(el.textContent.trim())
//         );
//         scholarData["CITATIONS (SCOPUS)"] = citationValue;
//       } catch (error) {
//         console.log("CITATIONS not found:", error.message);
//       }

//       // Add the scholar data to the allScholarData array
//       allScholarData.push(scholarData);
//       console.log(`Data from ${link}:`, scholarData);
//     } catch (error) {
//       console.log(`Error scraping scholar page ${link}:`, error.message);
//     }
//   }

//   console.log("All scholar data:", allScholarData);
//   await browser.close();
// })();

// Best Solution

const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false }); // Show browser
  const page = await browser.newPage();

  console.log("Navigating to the faculty page...");
  // Navigate to the main page
  await page.goto("https://utmscholar.utm.my/faculties/28", {
    waitUntil: "networkidle2",
  });

  console.log("Extracting scholar links...");
  // Extract the scholar links
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

  console.log(`Found ${scholarLinks.length} scholar links.`);
  const scrapedData = [];

  // Iterate through each scholar link
  for (const link of scholarLinks) {
    console.log(`Navigating to scholar page: ${link}`);
    await page.goto(link, { waitUntil: "networkidle2" });

    console.log("Extracting data from scholar page...");
    // Extract data from the scholar's page
    const scholarData = await page.evaluate(() => {
      // Function to convert text content to number, or return 0 if not available
      const extractNumber = (element) => {
        if (element) {
          const number = parseInt(element.textContent.replace(/\D/g, ""), 10);
          return isNaN(number) ? 0 : number; // Return 0 if not a valid number
        }
        return 0;
      };

      // Extract common data from div.text-white (heading from h6 and value from h2)
      const textWhiteDivs = Array.from(
        document.querySelectorAll(".text-white")
      );
      const dataObj = {}; // Store data as an object

      textWhiteDivs.forEach((div) => {
        const heading = div.querySelector("h6")
          ? div.querySelector("h6").textContent.trim()
          : "";
        const valueElement = div.querySelector("h2");
        const value = extractNumber(valueElement); // Extract numerical value from h2

        if (heading !== "" && value !== 0) {
          dataObj[heading] = value; // Store as key-value pair in the object
        }
      });

      // Extract specific data for H-index and Citations
      const hIndexScopus = extractNumber(document.querySelector("#hIndexID"));
      const citations = extractNumber(
        document.querySelector("#CountPublicIndexID")
      );

      // Add H-index and Citations to the object
      dataObj["H-INDEXED (SCOPUS)"] = hIndexScopus;
      dataObj["CITATIONS (SCOPUS)"] = citations;

      return dataObj;
    });

    console.log(`Data extracted from ${link}:`, scholarData);

    // Combine scholar data into one object
    scrapedData.push(scholarData);

    console.log(`Finished processing scholar: ${link}`);
  }

  console.log("All data has been scraped.");
  console.log("Final scraped data:", scrapedData); // Direct logging of the data

  await browser.close();
})();
