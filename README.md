# Obsidian Image Upload Toolkit

This plugin cloud upload all local images embedded in markdown to specified remote image store
(support [imgur](https://imgur.com),[AliYun OSS](https://www.alibabacloud.com/product/object-storage-service) and [Imagekit](https://imagekit.io), currently) and export markdown with image urls to clipboard directly.
The origin markdown in vault is still using local images.

It will be help for publishing to the static site such [GitHub pages](https://pages.github.com).

The idea of plugin comes from the powerful markdown editor [MWeb Pro](https://www.mweb.im) I have been 
used for years. 

During plugin development, I also referred to plugins [obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
(**the imgur uploading codes is from it**) and [obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin). Thanks both for 
providing such great plugins.

This plugin is listed in the [Obsidian community plugins](https://obsidian.md/plugins?id=image-upload-toolkit) now.

## Usage

Open command and type "publish page", it will upload all local images to remote store 
and copy markdown with replaced image syntax to clipboard with notification. 

![screenshot](https://github.com/addozhang/obsidian-image-upload-toolkit/assets/2224492/e190f65e-4f19-44e7-af40-a3f9f13e0e1d)

## TODO

- [ ] support uploading images to more storages
  - [x] Aliyun Oss
  - [x] ImageKit
  - [ ] Amazon S3
- [x] setting for replacing images embedded in origin markdown directly

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
(**reference to the imgur uploading codes in it**) 
* [obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin)
* [create-obsidian-plugin](https://www.npmjs.com/package/create-obsidian-plugin)
