0.4 / 2012-08-16
==================
  * Remove code for Firefox versions <13 because we don't support those anymore (#150)
  * Bump version of Addon SDK to 1.9 (#147)
  * Catch exception if JSON data cannot be parsed (#148)
  * Use memory.notify rather than memory.log for Firefox 16 and above (#141)
  * Upgrade to Addon SDK 1.8.1 again. Now finally (#145)
  * Fix usages of Cu.import to better match jetpack conventions (#143)
  * Text in Add-on Bar unreadable with dark Personas (#62)
  * Updated Addons SDK to 1.8.1 (#142)
  * Fixes directories not persisting after restart (#131)
  * Update .travic.yml to send IRC notifications (#123)
  * Do not log memory statistics because they are not pretty useful right now (#130)
  * Lines in log file now end with a comma (#127)

0.3 / 2012-04-04
==================
  * Allow user to specify where logs are saved (#119)
  * Add panel options to access log folder and start/stop logging (#115)
  * Add panel items for triggering a GC or CC, and Minimize Memory Usage (#114, #118)
  * Updated logger to write out valid JSON (#110)
  * Fixed invisible appearance in toolbar palette (#111)
  * Added targets for 'run' and 'test' (#109)
  * Pass-through all GC/CC information and extract values in widget.js (#107)
  * Add support for the new SpiderMonkey GC Statistics API (#99)
  * Implemented asynchronous logging (#55)
  * Fixes widget onclick handler for logger out of sync issue (#105)
  * Added a release target to the build script (#98)
  * Refactor usage of preference names and constants (#102)
  * Added tooltips to widget elements (#84)
  * Fix properties in garbage collector message for Firefox 14 (#93)

0.2.1 / 2012-03-16
==================

  * Fix properties in garbage collector message for Firefox 14. (#93)

0.2 / 2012-03-01
================

  * Update Add-on SDK to v1.5 (#80)
  * Combine full and incremental GC in a single label (#66)
  * Enhance parser for GC/CC related messages to extract all data (#30)
  * Combine the MemChaser and Logger widgets (#35)
  * Reduced width of the Add-on bar widget to limit wasted space (#63)
  * Add integration for Travis CI (#69)
  * Add details to README how to run tests (#68)
  * Initial implementation of incremental GC indicator (#66)
  * Updated parsing to work with incremental GC (#67)
  * Dispatch data from observe callback via setTimeout (#64)
  * Add list of contributors to package.json (#53)
  * Add Add-on SDK as required submodule (#51)
