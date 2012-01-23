self.port.on("logging_changed", function(isLogging) {
    var element = document.getElementById("logger");
    element.className = isLogging ? "enabled" : "disabled";
});
