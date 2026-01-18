# 📸 Obsidian Image Upload Toolkit

> Seamlessly upload and manage images for your Obsidian notes across multiple cloud platforms

## 📋 Table of Contents
- [🚀 Quick Start](#-quick-start)
- [✨ Features](#-features)
- [🛠️ Installation & Configuration](#️-installation--configuration)
- [📖 Usage Guide](#-usage-guide)
- [🔧 Storage Service Configuration](#-storage-service-configuration)
- [🔍 Troubleshooting](#-troubleshooting)
- [📈 Best Practices](#-best-practices)
- [👥 Contributing](#-contributing)
- [📝 Changelog](#-changelog)
- [🙏 Acknowledgements](#-acknowledgements)

## 🚀 Quick Start

### 5-Minute Setup
1. **Install Plugin** - Search for "Image Upload Toolkit" in Obsidian Community Plugins
2. **Basic Configuration** - Select Imgur and set up your Client ID
3. **Start Using** - Run the "Publish Page" command in any note
4. **View Results** - Images are automatically uploaded and URLs are copied to clipboard

### System Requirements
- Obsidian version ≥ 0.11.0
- Desktop platforms only (Windows/macOS/Linux)
- ⚠️ Mobile not supported

## ✨ Features

### Core Functionality
- ✅ **Smart Image Detection** - Automatically recognizes Markdown and Wiki link formats
- ✅ **Multi-Format Support** - PNG, JPG, JPEG, GIF, SVG, WebP, Excalidraw
- ✅ **Batch Processing** - Upload multiple images simultaneously
- ✅ **Real-Time Progress** - Optional progress modal with detailed feedback
- ✅ **Flexible Paths** - Support for relative paths and dynamic path variables
- ✅ **Web Image Upload** - Download and re-upload web images to your storage (optional)

### Supported Storage Services (8 providers)
| Service | Free Tier | Rating | Best For |
|---------|-----------|---------|----------|
| Imgur | Limited | ⭐⭐⭐ | Personal blogs |
| GitHub | Unlimited | ⭐⭐⭐⭐ | Open source projects |
| Cloudflare R2 | Pay-as-you-go | ⭐⭐⭐⭐⭐ | Professional use |
| AWS S3 | Pay-as-you-go | ⭐⭐⭐⭐ | Enterprise |
| Aliyun OSS | Pay-as-you-go | ⭐⭐⭐⭐ | Chinese users |
| TencentCloud COS | Pay-as-you-go | ⭐⭐⭐⭐ | Chinese users |
| Qiniu Kodo | Pay-as-you-go | ⭐⭐⭐⭐ | Chinese users |
| ImageKit | Limited | ⭐⭐⭐⭐ | CDN optimization |

Perfect for publishing to static sites like [GitHub Pages](https://pages.github.com) or any platform requiring externally hosted images.

## 🛠️ Installation & Configuration

### Step 1: Install Plugin
1. Open Obsidian Settings → Community Plugins
2. Search for "Image Upload Toolkit"
3. Click Install and Enable

### Step 2: Basic Settings
- **Use image name as Alt Text**: ✅ Recommended (uses filename as alt text)
- **Update original document**: ❌ Suggested disabled (preserves original notes)
- **Ignore note properties**: ✅ Recommended (removes frontmatter when publishing)
- **Show progress modal**: ✅ Recommended (better user experience)
- **Upload web images**: ❌ Optional (downloads and re-uploads web images to prevent link rot)

### Step 3: Choose Storage Service
Select your preferred storage service from the dropdown. See [Storage Service Configuration](#-storage-service-configuration) for detailed setup instructions.

## 📖 Usage Guide

### Basic Usage
1. Open any note with local images
2. Use Command Palette (Ctrl/Cmd + P)
3. Type "Publish Page" and select the command
4. All local images will be uploaded to your configured storage
5. Updated markdown with new URLs is copied to clipboard

![screenshot](https://github.com/user-attachments/assets/d20abcac-78a3-4275-b391-818ad781c219)

### Advanced Usage
- **Custom Paths**: Use variables like `{year}/{mon}/{day}/{filename}` in path settings
- **Relative Paths**: Support for `./` and `../` relative path formats
- **Dynamic Attachments**: Works with Obsidian's attachment folder settings
- **Web Image Upload**: Enable in settings to automatically download and re-upload web images (http/https URLs) to your storage service. Images already hosted on your configured storage are automatically skipped.

## 🔧 Storage Service Configuration

### Service Selection Guide
- **Personal Use**: Imgur (simple and free)
- **Open Source**: GitHub (version control integration)
- **Professional**: Cloudflare R2 (high performance)
- **Enterprise**: AWS S3 (full-featured)
- **Chinese Users**: Aliyun OSS (optimized for China)

### Detailed Configuration

#### Imgur (Recommended for Beginners)
```markdown
1. Visit https://api.imgur.com/oauth2/addclient
2. Create application (select "OAuth 2 authorization without a callback URL")
3. Copy Client ID to plugin settings
4. No additional keys required
```

#### GitHub (Recommended for Developers)
```markdown
1. Create Personal Access Token with 'repo' scope
2. Prepare a public repository for image storage
3. Configure repository information and access token
Note: Images are committed as regular files to the repository
```

#### Cloudflare R2 (Recommended for Professional Use)
```markdown
1. Sign up at https://dash.cloudflare.com/sign-up
2. Enable R2 storage in your Cloudflare dashboard
3. Create an R2 bucket for images
4. Generate API credentials:
   - Go to R2 → Overview → Manage R2 API Tokens
   - Create token with read/write permissions
5. Configure in plugin:
   - Access Key ID and Secret Access Key
   - Endpoint: https://<account-id>.r2.cloudflarestorage.com
   - Bucket Name: Your bucket name
   - Custom Domain: Optional (R2.dev URL or custom domain)
```

#### AWS S3
```markdown
1. Create AWS account at https://aws.amazon.com
2. Create S3 bucket with public read access
3. Generate IAM credentials with S3 permissions
4. Configure in plugin:
   - Access Key ID and Secret Access Key
   - Region: AWS region of your bucket
   - Bucket Name: Your S3 bucket name
   - Custom Domain: Optional CDN domain
```

#### Aliyun OSS (阿里云对象存储)
```markdown
1. Create Alibaba Cloud account
2. Create OSS bucket with appropriate permissions
3. Generate AccessKey pair from RAM console
4. Configure in plugin:
   - Access Key ID and Secret
   - Region: e.g., oss-cn-hangzhou
   - Bucket Name: Your OSS bucket
   - Custom Domain: Optional CDN domain
```

#### ImageKit
```markdown
1. Create account at https://imagekit.io/registration/
2. Get API credentials from dashboard
3. Configure in plugin:
   - Public Key and Private Key
   - URL Endpoint: https://ik.imagekit.io/your_imagekit_id/
   - Folder: Optional organization folder
```

#### TencentCloud COS (腾讯云对象存储)
```markdown
1. Create Tencent Cloud account
2. Create COS bucket with appropriate permissions
3. Generate SecretId and SecretKey from CAM console
4. Configure in plugin:
   - Secret ID and Secret Key
   - Region: e.g., ap-guangzhou
   - Bucket Name: Your COS bucket
   - Custom Domain: Optional CDN domain
```

#### Qiniu Kodo (七牛云存储)
```markdown
1. Create Qiniu Cloud account
2. Create Kodo bucket
3. Generate Access Key and Secret Key
4. Configure in plugin:
   - Access Key and Secret Key
   - Bucket Name: Your Kodo bucket
   - Custom Domain: Domain bound to your bucket
```

## 🔍 Troubleshooting

### Common Issues

#### "Cannot locate image" Error
**Cause**: Incorrect image path configuration or missing files
**Solution**:
1. Check Obsidian's attachment folder settings
2. Verify image files exist at specified paths
3. Try using absolute paths for testing

#### Imgur Upload Failures
**Cause**: API limits or network issues
**Solution**:
1. Verify Client ID is correct
2. Wait a few minutes and retry (Imgur has rate limits)
3. Consider alternative storage services

#### Relative Paths Not Working
**Cause**: Plugin version or path resolution issues
**Solution**:
1. Update to latest version
2. Use relative paths starting with `./` or `../`
3. Check Obsidian's attachment settings

#### Progress Modal Not Showing
**Cause**: Settings issue or plugin conflicts
**Solution**:
1. Verify "Show progress modal" setting is enabled
2. Restart Obsidian
3. Check for conflicting plugins

#### Upload Errors with Special Characters
**Cause**: Filename encoding issues
**Solution**:
1. Avoid special characters in filenames
2. Use only alphanumeric characters, hyphens, and underscores
3. Check filename encoding in your file system

#### Web Image Download Failures
**Cause**: Network issues, CORS restrictions, or authentication requirements
**Solution**:
1. Check your internet connection
2. Verify the web image URL is accessible
3. Some images may require authentication and cannot be downloaded
4. Disable "Upload web images" if you only want to process local images

## 📈 Best Practices

### Workflow Recommendations
1. **Backup Important Data** - Always backup before uploading
2. **Test Configuration** - Use test images to verify setup
3. **Choose Appropriate Storage** - Match service to your use case
4. **Monitor Links** - Regularly check uploaded image URLs

### Performance Optimization
- Process smaller files first when batch uploading
- Use local storage services when network is unstable
- Regularly clean up unused configuration cache

### Security Guidelines
- Never share API keys publicly
- Rotate access credentials regularly
- Use minimum required permissions for storage services

### File Organization
- Use consistent naming conventions
- Organize images by date or project
- Consider using path variables for automatic organization

## 👥 Contributing

### How to Contribute
1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Setup
```bash
git clone https://github.com/your-username/obsidian-image-upload-toolkit.git
cd obsidian-image-upload-toolkit
npm install
npm run dev
```

### Code Standards
- Use TypeScript strict mode
- Follow existing code style
- Include proper error handling
- Add meaningful commit messages

### Testing Requirements
- Test on multiple platforms if possible
- Verify functionality with different storage services
- Ensure backward compatibility

## 📝 Changelog

### v1.2.0 (Latest)
- ✨ Added web image upload feature (addresses #37)
- ✨ Smart detection to skip images already hosted on your storage
- 📝 Improved documentation and error messages

### v1.1.3
- ✨ Added Cloudflare R2 support
- 🐛 Fixed relative path handling issues
- 📝 Improved error messages

### v1.1.2
- ✨ Added Qiniu Kodo support
- 🐛 Fixed subfolder attachment path issues
- 🎨 Enhanced progress display interface

### v1.1.1
- ✨ Added GitHub repository storage support
- 🐛 Fixed dynamic path variable issues
- 📖 Updated configuration documentation

### v1.1.0
- ✨ Added TencentCloud COS support
- 🐛 Fixed various upload issues
- 🎨 Improved user interface

### v1.0.0
- 🚀 Initial release
- ✨ Support for Imgur, Aliyun OSS, ImageKit, AWS S3
- 📖 Basic documentation

## 🙏 Acknowledgements

This plugin was inspired by the powerful markdown editor [MWeb Pro](https://www.mweb.im) and builds upon the work of several exceptional projects:

- [obsidian-imgur-plugin](https://github.com/gavvvr/obsidian-imgur-plugin) - Reference implementation for Imgur upload functionality
- [obsidian-image-auto-upload-plugin](https://github.com/renmu123/obsidian-image-auto-upload-plugin) - Inspiration for additional features
- [create-obsidian-plugin](https://www.npmjs.com/package/create-obsidian-plugin) - Tooling for plugin development

---

<div align="center">

**Made with ❤️ by [Addo Zhang](https://github.com/addozhang)**

[🌟 Star this repo](https://github.com/addozhang/obsidian-image-upload-toolkit) | [🐛 Report Issues](https://github.com/addozhang/obsidian-image-upload-toolkit/issues) | [📖 Documentation](https://github.com/addozhang/obsidian-image-upload-toolkit#readme)

*Seamlessly upload and manage images for your Obsidian notes across multiple cloud platforms*

</div>
