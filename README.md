# CKEditor SDK #

This repository contains (future) CKEditor SDK that will include the [editor documentation](http://docs.ckeditor.com/) as well as samples.

It will be used for building online CKEditor SDK and you will also be able to download the whole package to use it offline.

**Note:** The development of the SDK has only just started, so it should not really be used by anyone yet. When the SDK is ready, it will be officially announced on the <http://ckeditor.com> website.

---

### Building a release SDK

#### Pre-Requirements

1. Get [Node.js](http://nodejs.org/).

1. Get [Ruby](http://www.ruby-lang.org/en/).

1. Follow instructions in [ckeditor-docs](https://github.com/ckeditor/ckeditor-docs) in order to 
setup working documentation dev environment.

1. Install [Compass](http://compass-style.org/):

        gem update --system
        gem install compass

#### Installation

1. First things first, install all package dependencies:

        npm install

1. Initialize and update Git submodules:

        git submodule init
        git submodule update

1. Call Grunt `setup` task to setup SDK builder:

        grunt setup

1. Run Grunt `build` task to build documentation:

        grunt build

---

### Available commands:

#### Build

    grunt build [OPTIONS] [FLAGS]

When the build process is finished, you can find a working copy of CKEditor SDK in the `dev/release` directory.


##### OPTIONS:

    --sdk-version=VERSION

Determines whether build offline or online version. `VERSION` may be: `offline` (default) or `online`. 

##### FLAGS:

    --sdk-pack

Determines whether pack build into Zip file.

#### Build-css

    grunt build-css

Converts SASS files (`theme/sass`) into CSS (`theme/css`) using Compass.

#### Validatelinks

    grunt validatelinks

Validate links in samples and main index file.