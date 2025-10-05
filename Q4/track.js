// Log page view
console.log(
  "Page viewed:",
  window.location.href,
  "at",
  new Date().toLocaleString()
);

// Log all click events
document.addEventListener("click", function (event) {
  let target = event.target;
  let tag = target.tagName;
  let classes = target.className ? `.${[...target.classList].join(".")}` : "";
  let id = target.id ? `#${target.id}` : "";
  let desc = `${tag}${id}${classes}`;
  console.log(
    `Clicked: ${desc} at (${event.clientX}, ${
      event.clientY
    }) on ${new Date().toLocaleString()}`
  );
});
