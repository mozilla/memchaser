(function setup() {
  let elements = [].slice.call(document.querySelectorAll("[data-action]"));

  elements.forEach(function (element) {
    element.onclick = function () {
      self.postMessage({ type: "command", data: this.dataset.action });
    };
  });
})();


self.on("message", function (aMessage) {
  let { type, data } = aMessage;
  switch (type) {
    case "update":

      var logger_status = document.querySelector("#logger_status");
      var action = (data.logger_active) ? "Stop " : "Start ";
      logger_status.textContent = action + "Logging";
      break;
  }
});
