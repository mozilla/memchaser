MemChaser
=========

[MemChaser](https://wiki.mozilla.org/QA/Automation_Services/Projects/Addons/MemChaser) is a Firefox extension which keeps track of the garbage collector activity and memory usage.

How to build
------------

Before you can test or build the extension you will have to clone the [Add-ons SDK](https://github.com/mozilla/addon-sdk). After it has been done, activate
it's environment.

To test the extension run:

  cd extension
  cfx run

To build simply run:

  cd extension
  cfx xpi
