# Obsidian Publish

This plugin cloud upload all local images embedded in markdown to specified remote image store
(support [imgur](https://imgur.com) only, currently) and export markdown with image urls to clipboard directly.
The origin markdown in vault is still using local images.

It will be help for publishing to the static site such [GitHub pages](https://pages.github.com).

The idea of plugin comes from the powerful markdown editor [MWeb Pro](https://www.mweb.im) I have been 
used for years. 

During plugin development, I also referred to plugins [obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
(**the imgur uploading codes is from it**) and [obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin). Thanks both for 
providing such great plugins.

**NOTE: This plugin is in progress of submission to official plugin list.**

## Usage

Open command and type "publish page", it will upload all local images to remote store 
and copy markdown with replaced image syntax to clipboard with notification. 

![screenshot](https://user-images.githubusercontent.com/2224492/189521107-b4d0604b-21f4-4c51-af8f-70083b3e6ec4.gif)

## TODO

- [] support uploading images to more storages
  - [] Aliyun Oss
- [] setting for replacing images embedded in origin markdown directly
- [] export rendered HTML with specified styles

## Contributing

To make changes to this plugin, first ensure you have the dependencies installed.

```
npm install
```

### Development

To start building the plugin with what mode enabled run the following command:

```
npm run dev
```

_Note: If you haven't already installed the hot-reload-plugin you'll be prompted to. You need to enable that plugin in your obsidian vault before hot-reloading will start. You might need to refresh your plugin list for it to show up._

### Releasing

To start a release build run the following command:

```
npm run build
```
---

## Thanks

* [obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
(**the imgur uploading codes is from it**) 
* [obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin)
* [create-obsidian-plugin](https://www.npmjs.com/package/create-obsidian-plugin)
