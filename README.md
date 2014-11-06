marketplace-core-modules
========================

Core JS modules for Firefox Marketplace frontend projects

## Updating a Module

When you updating a module:

- Bump the version in ```bower.json```.
- Git tag that version and push to Github.

Then bump your project's bower.json to pull in the new changes. Within your
Marketplace frontend project, you can run ```make update``` to get these
modules into your project and into your RequireJS development configuration.

### Adding a Module

When adding an core module:

- Commit the module
- Add the name of the module to ```CORE_MODULES``` in ```lib/config.js``` in
  [Commonplace](https://github.com/mozilla/commonplace)
- Bump the version in ```bower.json```.
- Git tag that version and push to Github.

The Commonplace step will make it so Marketplace frontend projects won't have
to manually configure the module into their RequireJS configurations.
