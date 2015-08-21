# CKEditor SDK

This repository contains the **CKEditor SDK** that includes the  [CKEditor developer documentation](http://docs.ckeditor.com/) as well as working CKEditor samples showcasing its numerous features.

It is used for building the online version of the CKEditor SDK which is available at http://sdk.ckeditor.com/.
You can also download the built package (click the **Download SDK** button at http://sdk.ckeditor.com/) to use it offline.

**Note:** The CKEditor SDK is a work in progress. Use the [Issues](https://github.com/ckeditor/ckeditor-sdk/issues) tab to report any bugs and tips. Thanks!

---

### Building a Release Version of CKEditor SDK

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

        git update

1. Call Grunt `setup` task to setup the CKEditor SDK builder:

        grunt setup

1. Run Grunt `build` task to build the CKEditor SDK:

        grunt build

---

### Available Grunt Commands:

1. #### setup

        grunt setup

    Initializes the SDK builder.

1. #### update

        grunt update [OPTIONS]

   ##### OPTIONS:

       --sdk-submodule-version=VERSION

    Specifies which branch of ckeditor-dev to checkout before update(major, master). Defaults to master.

1. #### build

        grunt build [OPTIONS] [FLAGS]

    When the build process is finished, you can find a working copy of CKEditor SDK in the `dev/ckeditor-sdk` directory.

    ##### OPTIONS:

        --sdk-version=VERSION

    Determines whether to build an offline or an online version.

	`VERSION` may be: `offline` (default) or `online`.

    ##### FLAGS:

        --sdk-dev=true

    Builds a development version of SDK using `../ckeditor-dev/` repository.

        --sdk-pack=true

    Determines whether to pack the build into a `.zip` archive.

        --sdk-verbose=true

    Verbose mode for the building process.

1. #### watch-css

        grunt watch-css

    Utilizes `compass watch` and outputs CSS directly into the `dev/ckeditor-sdk/theme/css` instead of `template/theme/css`. Useful for
	developing styles for a working SDK.

    **Note#1**: Call `grunt build` first. Developing CSS does not make much sense if there is no HTML.

    **Note#2**: Produced styles are uncompressed. Also CSS<->SASS map are built.

1. #### validatelinks

        grunt validatelinks

    Validate links in samples and the main index file.

---

## License

See `LICENSE.md` for licensing details.