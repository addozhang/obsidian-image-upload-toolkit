# Obsidian Image Upload Toolkit

This plugin cloud upload all local images embedded in markdown to specified remote image store
(support [Imgur](https://imgur.com), [AliYun OSS](https://www.alibabacloud.com/product/object-storage-service),
[Imagekit](https://imagekit.io), [Amazon S3](https://aws.amazon.com/s3/),
[TencentCloud COS](https://cloud.tencent.com/product/cos),
[Qiniu Kodo](https://www.qiniu.com/products/kodo),
and [GitHub Repository](https://github.com), till now) and export markdown with image urls to clipboard directly.
The origin markdown in vault is still using local images.

It will be helpful for publishing to the static site such [GitHub pages](https://pages.github.com).

The idea of plugin comes from the powerful markdown editor [MWeb Pro](https://www.mweb.im) I have been used for years.

During plugin development, I also referred to plugins [obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
(**the imgur uploading codes is from it**) and [obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin). Thanks both for providing such great plugins.

This plugin is listed in the [Obsidian community plugins](https://obsidian.md/plugins?id=image-upload-toolkit) now.

## Usage

Open command and type "publish page", it will upload all local images to remote store
and copy markdown with replaced image syntax to clipboard with notification.

![screenshot](https://github.com/addozhang/obsidian-image-upload-toolkit/assets/2224492/e190f65e-4f19-44e7-af40-a3f9f13e0e1d)

## TODO

- [ ] support uploading images to more storages
  - [x] Imgur
  - [x] Aliyun Oss
  - [x] ImageKit
  - [x] Amazon S3
  - [x] TencentCloud COS
  - [x] Qiniu Kodo
  - [x] GitHub Repository
  - [ ] more...
- [x] setting for replacing images embedded in origin markdown directly

## Contributing

To make changes to this plugin, first ensure you have the dependencies installed.

```shell
npm install
```

### Development

To start building the plugin with what mode enabled run the following command:

```shell
npm run dev
```

_Note: If you haven't already installed the hot-reload-plugin you'll be prompted to. You need to enable that plugin in your obsidian vault
before hot-reloading will start. You might need to refresh your plugin list for it to show up._

### Releasing

To start a release build run the following command:

```shell
npm run build
```

---

## Thanks

- [obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin)
(**reference to the imgur uploading codes in it**) 
- [obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin)
- [create-obsidian-plugin](https://www.npmjs.com/package/create-obsidian-plugin)

---

## Appendix

### Imgur Users: Obtaining your own Imgur Client ID

Imgur service usually has a daily [upload limits](https://apidocs.imgur.com/#rate-limits). To overcome this, create and use your own Client ID. This is generally easy, by following the steps below :

1. If you do not have an imgur.com account, [create one](https://imgur.com/register) first.

2. Visit [https://api.imgur.com/oauth2/addclient](https://api.imgur.com/oauth2/addclient) and generate **Client ID** for Obsidian with following settings:

   - provide any application name, i.e. "Obsidian"
   - choose "OAuth 2 authorization without a callback URL" (**important**)
   - Add your E-Mail

3. Copy the Client ID. (Note: You only need **Client ID**. The Client secret is a private info that is not required by this plugin. Keep it safe with you)
4. Paste this Client ID in plugin settings
