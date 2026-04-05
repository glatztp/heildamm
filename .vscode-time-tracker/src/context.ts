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
      return execSync("git config user.name", { encoding: "utf-8" }).trim();
    } catch {
      return "unknown";
    }
  }

  private getBranchName(): string {
    try {
      return execSync("git rev-parse --abbrev-ref HEAD", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    } catch {
      return "unknown";
    }
  }

  getFile(): string {
    return this.currentFile ? path.basename(this.currentFile) : "unknown";
  }

  getLanguage(): string {
    return this.currentLanguage || "unknown";
  }

  getProject(): string {
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
