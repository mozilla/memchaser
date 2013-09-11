# MemChaser

[MemChaser](https://wiki.mozilla.org/QA/Automation_Services/Projects/Addons/MemChaser)
is a Firefox extension which keeps track of the garbage collector activity and
memory usage.

## Continuous Integration

[![Build Status](https://secure.travis-ci.org/mozilla/memchaser.png?branch=master)](http://travis-ci.org/mozilla/memchaser)

## Installation

You can install the currently released version of MemChaser by visiting the
[addon page](https://addons.mozilla.org/en-US/firefox/addon/memchaser/) and
following the prompts.

## Usage

MemChaser adds a widget to the addons bar, which dynamically displays the
resident memory usage, the length of the last interactive GC and CC, and the
time elapsed between the two most recent of these. For more information on
each component simple hover over for a handy tooltip.

By clicking the widget you will activate a menu. From here you can trigger a
CC or GC, or reduce the memory currently in use. You can also start/stop the
logging from here, or open the log folder.

The logging uses the
[Statistics API](https://developer.mozilla.org/en-US/docs/SpiderMonkey/Internals/GC/Statistics_API)
to write full details of each GC.

## Building

First you will need to clone the repository:

```sh
git clone https://github.com/mozilla/memchaser.git
```

You will then have to init the
[Add-ons SDK](https://github.com/mozilla/addon-sdk) submodule.

```sh
git submodule update --init
```

To run tests against the extension:

```sh
ant test
```

To manually test the extension:

```sh
ant run
```

To specify the Firefox binary include `-Dbinary=path/to/firefox` on the command line.

To build simply run `ant` and the default build script/target will be invoked:

```sh
ant
```

You can override the build number used in the filename:

```sh
ant -Dbuild.number=1
```

To build for release (no build number in filename):

```sh
ant release
```

You can also use the Add-ons SDK directly using `cfx`:

```sh
cd addon-sdk
source bin/activate
cd ../extension
cfx docs
```
