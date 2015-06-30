(function setup() {
  let elements = [].slice.call(document.querySelectorAll("[data-action]"));

  elements.forEach(function (element) {
    element.onclick = function () {
      self.postMessage({ type: "command", data: this.dataset.action });
    };
  });
})();
