#!/bin/bash
# Copyright (c) 2003-2014, CKSource - Frederico Knabben. All rights reserved.
# For licensing, see LICENSE.md or http://ckeditor.com/license

# Build CKEditor SDK

# Running builder excluding documentation
node app.js

# Running documentation builder
sh ../../docs/build.sh --config seo-off-config.json

# Move generated documentation to proper directory
mv ../../docs/build ../release/docs

# Remove dynamically generated config
rm ../../docs/seo-off-config.json