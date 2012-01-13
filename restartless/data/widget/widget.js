const BYTE_TO_MEGABYTE = 1/1048576;

self.on("message", function(data) {
  document.getElementById("init").style.display = "none";
  document.getElementById("data").style.display = "inline";

  var memory = data.memory;
  document.getElementById("explicit").innerHTML = Math.round(memory.explicit * BYTE_TO_MEGABYTE);
  document.getElementById("resident").innerHTML = Math.round(memory.resident * BYTE_TO_MEGABYTE);
});