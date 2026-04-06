import * as vscode from "vscode";
import * as path from "path";
import { execSync } from "child_process";

interface CachedValue {
  value: string;
  timestamp: number;
}

export class ContextService {
  private currentFile: string = "";
  private currentLanguage: string = "";
  private currentProject: string = "";
  private author: string = "";
  private currentBranch: string = "";

  private authorCache: CachedValue | null = null;
  private branchCache: CachedValue | null = null;

  private readonly CACHE_TTL_MS = 30000;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeContext();
    this.startCacheRefresh();
  }

  private initializeContext(): void {
    this.author = this.getAuthorName();
    this.currentProject = this.getProjectName();
    this.currentBranch = this.getBranchName();

    if (!this.author || this.author.length === 0) {
      this.author = "developer";
    }
    if (!this.currentProject || this.currentProject.length === 0) {
      this.currentProject = "project";
    }
    if (!this.currentBranch || this.currentBranch.length === 0) {
      this.currentBranch = "main";
    }
  }

  private startCacheRefresh(): void {
    this.refreshInterval = setInterval(() => {
      this.refreshCachedValues();
    }, this.CACHE_TTL_MS / 2);
  }

  private refreshCachedValues(): void {
    try {
      const newBranch = this.getBranchName();
      if (newBranch && newBranch.length > 0) {
        this.currentBranch = newBranch;
      }

      const newProject = this.getProjectName();
      if (newProject && newProject.length > 0) {
        this.currentProject = newProject;
      }
    } catch (error) {
      console.debug("Error refreshing cached values:", error);
    }
  }

  setActiveEditor(editor: vscode.TextEditor | undefined): void {
    if (editor && editor.document) {
      this.currentFile = editor.document.uri.fsPath;
      this.currentLanguage = editor.document.languageId;

      const newProject = this.getProjectName();
      if (newProject && newProject.length > 0) {
        this.currentProject = newProject;
      }

      this.refreshBranchIfNeeded();
    }
  }

  private refreshBranchIfNeeded(): void {
    if (
      this.branchCache === null ||
      Date.now() - this.branchCache.timestamp > this.CACHE_TTL_MS
    ) {
      const newBranch = this.getBranchName();
      if (newBranch && newBranch.length > 0) {
        this.currentBranch = newBranch;
      }
    }
  }

  private getProjectName(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return "project";
    }

    const projectName = path.basename(folders[0].uri.fsPath);
    return projectName && projectName.length > 0 ? projectName : "project";
  }

  private getAuthorName(): string {
    if (
      this.authorCache !== null &&
      Date.now() - this.authorCache.timestamp < this.CACHE_TTL_MS
    ) {
      return this.authorCache.value;
    }

    let author = "";

    try {
      const result = execSync("git config user.name", {
        encoding: "utf-8",
        cwd: this.getWorkspaceRoot(),
        timeout: 1000,
      }).trim();

      if (result && result.length > 0) {
        author = result;
      }
    } catch (error) {
      console.debug("Git author lookup failed:", error);
    }

    if (!author || author.length === 0) {
      author = this.getSystemUsername();
    }

    if (!author || author.length === 0) {
      author = "developer";
    }

    this.authorCache = {
      value: author,
      timestamp: Date.now(),
    };

    return author;
  }

  private getSystemUsername(): string {
    try {
      const envUser =
        process.env.USERNAME || process.env.USER || process.env.LOGNAME;
      if (envUser && envUser.length > 0) {
        return envUser;
      }

      const homeUser = process.env.HOME?.split(path.sep).pop();
      if (homeUser && homeUser.length > 0) {
        return homeUser;
      }

      return "developer";
    } catch (error) {
      console.debug("System username lookup failed:", error);
      return "developer";
    }
  }

  private getBranchName(): string {
    if (
      this.branchCache !== null &&
      Date.now() - this.branchCache.timestamp < this.CACHE_TTL_MS
    ) {
      return this.branchCache.value;
    }

    let branch = "";

    try {
      const result = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
        cwd: this.getWorkspaceRoot(),
        timeout: 1000,
      }).trim();

      if (result && result.length > 0 && result !== "HEAD") {
        branch = result;
      }
    } catch (error) {
      console.debug(
        "Git branch lookup failed, checking for detached state:",
        error,
      );
    }

    if (!branch || branch.length === 0) {
      try {
        const hashResult = execSync("git rev-parse --short HEAD", {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "ignore"],
          cwd: this.getWorkspaceRoot(),
          timeout: 1000,
        }).trim();

        if (hashResult && hashResult.length > 0) {
          branch = `detached/${hashResult}`;
        }
      } catch (error) {
        console.debug("Git detached state lookup failed:", error);
      }
    }

    if (!branch || branch.length === 0) {
      branch = "main";
    }

    this.branchCache = {
      value: branch,
      timestamp: Date.now(),
    };

    return branch;
  }

  private getWorkspaceRoot(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return process.cwd();
    }
    return folders[0].uri.fsPath;
  }

  getFile(): string {
    if (this.currentFile && this.currentFile.length > 0) {
      const filename = path.basename(this.currentFile);
      return filename && filename.length > 0 ? filename : "untitled";
    }
    return "untitled";
  }

  getLanguage(): string {
    if (this.currentLanguage && this.currentLanguage.length > 0) {
      return this.currentLanguage;
    }
    return "text";
  }

  getProject(): string {
    const current =
      this.currentProject && this.currentProject.length > 0
        ? this.currentProject
        : this.getProjectName();
    return current && current.length > 0 ? current : "project";
  }

  getAuthor(): string {
    const current =
      this.author && this.author.length > 0
        ? this.author
        : this.getAuthorName();
    return current && current.length > 0 ? current : "developer";
  }

  getBranch(): string {
    const current =
      this.currentBranch && this.currentBranch.length > 0
        ? this.currentBranch
        : this.getBranchName();
    return current && current.length > 0 ? current : "main";
  }

  isActive(): boolean {
    return (
      this.currentFile !== null &&
      this.currentFile !== undefined &&
      this.currentFile.length > 0
    );
  }

  dispose(): void {
    if (this.refreshInterval !== null) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}
