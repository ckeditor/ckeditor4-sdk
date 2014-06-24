# CKEditor SDK #

This repository contains (future) CKEditor SDK that will include the [editor documentation](http://docs.ckeditor.com/) as well as samples.

It will be used for building online CKEditor SDK and you will also be able to download the whole package to use it offline.

**Note:** The development of the SDK has only just started, so it should not really be used by anyone yet. When the SDK is ready, it will be officially announced on the <http://ckeditor.com> website.

### Building a release SDK

To build SDK you need to have [node.js](http://nodejs.org) installed. Once you have it, open the command line and navigate to the `dev/builder` directory:

        > cd dev/builder

Then install all package dependencies:

        > npm install

After that run the builder:

        > build.sh

#### Available commands

Determines whether build offline or online version (default is offline one).

        > --version online|offline

When the build process is finished, you can find a working copy of CKEditor SDK in the `dev/release` directory.