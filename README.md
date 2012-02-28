MemChaser
=========

[MemChaser](https://wiki.mozilla.org/QA/Automation_Services/Projects/Addons/MemChaser) is a Firefox extension which keeps track of the garbage collector activity and memory usage.

How to build
------------

Before you can test or build the extension you will have to init the [Add-ons SDK](https://github.com/mozilla/addon-sdk) submodule. After it has been done, activate
it's environment:

    git submodule update --init
    cd addon-sdk
    source bin/activate
    cd ..

To run tests against the extension:

    cd extension
    cfx test


To manually test the extension:

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
