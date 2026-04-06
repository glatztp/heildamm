import * as vscode from "vscode";
import * as path from "path";
import { execSync } from "child_process";

export class ContextService {
  private currentFile: string = "";
  private currentLanguage: string = "";
  private currentProject: string = "";
  private author: string = "";
  private currentBranch: string = "";

  constructor() {
    this.author = this.getAuthorName();
    this.currentProject = this.getProjectName();
    this.currentBranch = this.getBranchName();
  }

  setActiveEditor(editor: vscode.TextEditor | undefined): void {
    if (editor && editor.document) {
      this.currentFile = editor.document.uri.fsPath;
      this.currentLanguage = editor.document.languageId;
      this.currentProject = this.getProjectName();
      this.currentBranch = this.getBranchName();
    }
  }

  private getProjectName(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) return "unknown";
    return path.basename(folders[0].uri.fsPath);
  }

  private getAuthorName(): string {
    try {
      const result = execSync("git config user.name", {
        encoding: "utf-8",
        cwd: this.getWorkspaceRoot(),
      }).trim();

      if (!result || result.length === 0) {
        return this.getSystemUsername();
      }

      return result;
    } catch {
      return this.getSystemUsername();
    }
  }

  private getSystemUsername(): string {
    try {
      const username =
        process.env.USERNAME ||
        process.env.USER ||
        process.env.LOGNAME ||
        "developer";
      return username;
    } catch {
      return "developer";
    }
  }

  private getBranchName(): string {
    try {
      const result = execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
        cwd: this.getWorkspaceRoot(),
      }).trim();

      if (!result || result.length === 0) {
        return "main";
      }

      return result;
    } catch (error) {
      try {
        const hashResult = execSync("git rev-parse --short HEAD", {
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "ignore"],
          cwd: this.getWorkspaceRoot(),
        }).trim();

        return `detached/${hashResult}`;
      } catch {
        return "main";
      }
    }
  }

  private getWorkspaceRoot(): string {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      return process.cwd();
    }
    return folders[0].uri.fsPath;
  }

  getFile(): string {
    if (!this.currentFile || this.currentFile.length === 0) {
      return "untitled";
    }
    return path.basename(this.currentFile);
  }

  getLanguage(): string {
    return this.currentLanguage && this.currentLanguage.length > 0
      ? this.currentLanguage
      : "text";
  }

  getProject(): string {
    if (!this.currentProject || this.currentProject.length === 0) {
      return "project";
    }
    return this.currentProject;
  }

  getAuthor(): string {
    return this.author;
  }

  getBranch(): string {
    return this.currentBranch;
  }

  isActive(): boolean {
    return this.currentFile.length > 0;
  }
}
