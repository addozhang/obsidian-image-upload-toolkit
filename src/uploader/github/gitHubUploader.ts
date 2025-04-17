import ImageUploader from "../imageUploader";
import { Octokit } from "@octokit/rest";

export default class GitHubUploader implements ImageUploader {
  private readonly octokit: Octokit;
  private readonly owner: string;
  private readonly repo: string;
  private readonly branch: string;
  private readonly path: string;

  constructor(setting: GitHubSetting) {
    this.octokit = new Octokit({ 
      auth: setting.token
    });
    
    // Parse owner and repo from repository name (format: owner/repo)
    const [owner, repo] = setting.repositoryName.split('/');
    this.owner = owner;
    this.repo = repo;
    this.branch = setting.branchName || 'main';
    this.path = setting.path;
  }

  async upload(image: File, fullPath: string): Promise<string> {
    try {
      const arrayBuffer = await this.readFileAsArrayBuffer(image);
      const base64Content = this.arrayBufferToBase64(arrayBuffer);
      
      const filePath = image.name.replace(/^\/+/, ''); // Remove leading slashes
      
      // Get the SHA of the file if it exists (needed for updating)
      let fileSha: string | undefined;
      try {
        const { data } = await this.octokit.repos.getContent({
          owner: this.owner,
          repo: this.repo,
          path: filePath,
          ref: this.branch
        });
        
        if (!Array.isArray(data)) {
          fileSha = data.sha;
        }
      } catch (error) {
        // File doesn't exist yet, which is fine
      }
      
      // Create or update the file in the repository
      const response = await this.octokit.repos.createOrUpdateFileContents({
        owner: this.owner,
        repo: this.repo,
        path: filePath,
        message: `Upload image: ${image.name}`,
        content: base64Content,
        branch: this.branch,
        sha: fileSha
      });
      
      // Return the URL to the uploaded image
      // Format: https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
      return `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.branch}/${filePath}`;
    } catch (error) {
      console.error("Error uploading to GitHub:", error);
      throw error;
    }
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return btoa(binary);
  }
}

export interface GitHubSetting {
  repositoryName: string; // Format: owner/repo
  branchName: string;
  token: string;
  path: string;
}