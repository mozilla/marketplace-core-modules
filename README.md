Core JS modules for Firefox Marketplace frontend projects.

- [Marketplace frontend documentation](https://marketplace-frontend.readthedocs.org)
- [Marketplace documentation](https://marketplace.readthedocs.org)

## Updating a Module

When you updating a module:

- Bump the version in ```bower.json```
- Git tag that version and push to Github
- Bump your project's bower.json to pull in the new changes
- Run ```make update``` to get these modules into your project and into your
  RequireJS development configuration

## Adding a Module

When adding an core module:

- Commit the module
- Add the name of the module to ```CORE_MODULES``` in ```lib/config.js``` in
  [Commonplace](https://github.com/mozilla/commonplace)
- Follow the same steps above for Updating a Module

The Commonplace step will make it so Marketplace frontend projects won't have
to manually configure the module into their RequireJS configurations.

## Developing Modules

For convenience, you can clone this repository straight into the
```src/media/js/lib``` directory of your frontend project. That way, you can
test your modules and handle revisions in the sample place (without needing
to copy modules to a different folder to commit).
