var setup = function () {
  let elements = [].slice.call(document.querySelectorAll("[data-action]"));

  elements.forEach(function (element) {
    element.onclick = function () {
      self.port.emit("command", { type: this.dataset.action});
    };
  });
};


setup();
