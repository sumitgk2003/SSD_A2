// script.js

// Function to start the real-time clock
function startTime() {
  const today = new Date();

  // CheckTime is used to add leading zeros, but the original code just output the full date object.
  // We'll calculate H/M/S for completeness, but output the full date object as in the original.
  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();

  m = checkTime(m);
  s = checkTime(s);

  const timeElement = document.getElementById("txt");
  if (timeElement) {
    timeElement.innerHTML = today.toLocaleString();
  }

  setTimeout(startTime, 1000);
}

// Add zero in front of numbers < 10
function checkTime(i) {
  if (i < 10) {
    i = "0" + i;
  }
  return i;
}

// Function to handle the Last Updated timestamp logic from the HTML HEAD
function handleLastUpdated() {
  // The original HTML had the <p id="lastUpdated"> commented out,
  // but the script that populates it was inside the head and executed immediately.
  // The goal here is to replicate the behavior if the element were visible.
  const lastUpdatedElement = document.getElementById("lastUpdated");
  if (!lastUpdatedElement) return;

  const lastModified = new Date(document.lastModified);

  // This is the original logic: document.getElementById("lastUpdated").innerHTML += formattedDate;
  // Since the original tag was commented out, we must assume it should be fully populated here.
  const formattedDate = lastModified.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Using the original logic from the HTML head, assuming we cannot modify the body structure
  // (i.e., we cannot uncomment the tag), so we must rely on what's available.
  // However, to externalize the script completely:
  // This is the code that was in the <head> but now it runs on DOMContentLoaded
  const targetElement = document.querySelector('p[id="lastUpdated"]'); // Target the commented element ID

  if (targetElement) {
    targetElement.innerHTML = `<font face="Quicksand" size="2">Site Last Updated on: ${formattedDate}</font>`;
  }
}

// Start all functions when the document is fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Start the clock (replicates the body onload)
  startTime();

  // Run the last updated logic, which relies on the element being present in the DOM
  // (Note: To get the last updated date to show, the <p id="lastUpdated"> tag
  // in the HTML must be uncommented: remove around it.)
  // handleLastUpdated();

  // Since we cannot change the HTML, we must assume the original script in the head
  // (which we removed) successfully found a target. Since it is externalized, we'll call it.
  handleLastUpdated();
});
