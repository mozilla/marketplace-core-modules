Core JS modules for Firefox Marketplace frontend projects.

- [Marketplace frontend documentation](https://marketplace-frontend.readthedocs.org)
- [Marketplace documentation](https://marketplace.readthedocs.org)


## Developing Modules

For convenience, you can clone this repository straight into the
```src/media/js/lib``` directory of your frontend project. That way, you can
test your modules and handle revisions in the same place (without needing
to copy modules to a different folder to commit).

Be careful as running ```make install``` may overwrite changes you make
in that directory!

## Updating a Module

When you updating a module:

- Bump the version in ```bower.json```
- **Git tag** that version and push to Github
  (e.g., ```git tag v1.2.0 && git push origin v1.2.0```)
- Add a release entry with the details of the changes in the tag you've just added here https://github.com/mozilla/marketplace-core-modules/releases
- Bump your project's bower.json to pull in the new changes
- Run ```make install``` to get these modules into your project and into your
  RequireJS development configuration

## Adding a Module

When adding an core module:

- Commit the module
- Add the name of the module to ```CORE_MODULES``` in ```lib/config.js``` in
  [Commonplace](https://github.com/mozilla/commonplace)
- Follow the same steps above for Updating a Module

The Commonplace step will make it so Marketplace frontend projects won't have
to manually configure the module into their RequireJS configurations.
