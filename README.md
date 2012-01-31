MemChaser
=========

[MemChaser](https://wiki.mozilla.org/QA/Automation_Services/Projects/Addons/MemChaser) is a Firefox extension which keeps track of the garbage collector activity and memory usage.

How to build
------------

Before you can test or build the extension you will have to clone the [Add-ons SDK](https://github.com/mozilla/addon-sdk). After it has been done, activate
it's environment:

    git clone https://github.com/mozilla/addon-sdk
    cd addon-sdk
    git fetch
    git checkout 1.4.2
    source bin/activate
    cd ..

To test the extension run:

    cd extension
    cfx run

To build simply run `ant` and the default build script/target will be invoked:

    ant

You can override the build number used in the filename:

    ant -Dbuild.number=1

To build for release (no build version in filename):

    ant -Drelease=true

You can also build directly using `cfx`:

    cd extension
    cfx xpi
