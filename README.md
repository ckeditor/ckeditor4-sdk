# ⚠ This repository is no longer maintained ⚠

We moved all examples to the [ckeditor-docs](https://github.com/ckeditor/ckeditor-docs) repository. You'll find all the former SDK samples in [Examples section on our docs](https://ckeditor.com/docs/ckeditor4/latest/examples/index.html).

# CKEditor SDK

This repository contains the **CKEditor SDK** that includes the  [CKEditor developer documentation](https://docs.ckeditor.com/ckeditor4/) as well as working CKEditor samples showcasing its numerous features.

It is used for building the online version of the CKEditor SDK which is available at https://sdk.ckeditor.com/.
You can also download the built package (click the **Download SDK** button at https://sdk.ckeditor.com/) to use it offline.

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

1. Setup the the builder, submodules, etc.:

        grunt setup

1. (**Optional**) Update Git submodules (will commit submodule HEADs change):

        grunt update

1. Run Grunt `build` task to build the CKEditor SDK:

        grunt build

---

### Available Grunt Commands:

1. #### setup

        grunt setup

    Initializes the SDK builder.

1. #### update

        grunt update [OPTIONS]

    Updates CKEditor presets and CKEditor docs submodules to the `--sdk-ckeditor-version` (defaults to `master`), commits this change and updates all submodules recursively.

    ##### OPTIONS:

       --sdk-ckeditor-version=VERSION

    Specifies which branch or tag to checkout the submodules. Defaults to `master`.

1. #### build

        grunt build [OPTIONS] [FLAGS]

    When the build process is finished, you can find a working copy of CKEditor SDK in the `build/<version>/` directory (where `<version>` is the `--sdk-version`).

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