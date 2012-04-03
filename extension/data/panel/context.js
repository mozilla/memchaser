(function setup() {
  let elements = [].slice.call(document.querySelectorAll("[data-action]"));

  elements.forEach(function (element) {
    element.onclick = function () {
      self.port.emit("command", { type: this.dataset.action});
    };
  });
})();


self.port.on("update", function (aData) {
  let data = aData || { };

  var logger_status = document.querySelector("#logger_status");
  var action = (aData.logger_active) ? "Stop " : "Start ";
  logger_status.textContent = action + "Logging";
});
