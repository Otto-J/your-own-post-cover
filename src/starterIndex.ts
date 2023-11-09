import { App, Modal, Plugin, PluginSettingTab, TFile } from "obsidian";
import { createApp, type App as VueApp } from "vue";
import SettingsPage from "./ui/settings.vue";
import ModalPage from "./ui/modal.vue";

const CommandTitle = "Add a post cover banner hero image";
const CommandID = "your-own-post-cover-banner-hero-image";

const handleTitleToUrl = (title: string) => {
  const _title = title ?? "untitled";
  const encodedPostTitle = encodeURIComponent(_title);

  const baseUrl = "http://f.ijust.cc/release/?title=";
  const finalUrl = baseUrl + encodedPostTitle;
  return finalUrl;
};

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "这是默认值",
};

// 核心
export default class MyPlugin extends Plugin {
  settings!: MyPluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SampleSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        const isFile = file instanceof TFile;
        if (!isFile) return;

        const isMD = (file.extension ?? "").toLocaleLowerCase() === "md";
        if (!isMD) return;

        menu.addItem((item) => {
          item.setTitle(CommandTitle).onClick(() => {
            // nothing
            const postTitle = file.basename ?? "untitled";
            const finalUrl = handleTitleToUrl(postTitle);

            // file 在最顶部添加一张 markdown 图片
            file.vault.process(file, (data) => {
              // console.log(data);
              const str = `![${postTitle}](${finalUrl})\n\n` + data;
              return str;
            });
          });
        });
      })
    );

    // 在这里注册命令 This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: CommandID,
      name: CommandTitle,

      editorCallback: (editor, view) => {
        // 当前的编辑器和标题
        // console.log(editor, view);
        const postTitle = view.file?.basename ?? "untitled";
        const finalUrl = handleTitleToUrl(postTitle);
        // 在当前文章的顶部插入一张图片
        editor.replaceSelection(`![${postTitle}](${finalUrl})\n`);
      },
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
}

/**
 * 添加 设置面板
 */
class SampleSettingTab extends PluginSettingTab {
  plugin: Plugin;
  _vueApp: VueApp | undefined;

  constructor(app: App, plugin: Plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const _app = createApp(SettingsPage, {
      plugin: this.plugin,
    });
    this._vueApp = _app;
    _app.mount(this.containerEl);
  }
  hide() {
    if (this._vueApp) {
      this._vueApp.unmount();
    }
    this.containerEl.empty();
  }
}

/**
 * 第一次上传需要添加默认值
 */
export class MyPublishModal extends Modal {
  _vueApp: VueApp | undefined;
  plugin: Plugin;

  file: TFile;

  constructor(app: App, plugin: Plugin, file: TFile) {
    super(app);
    this.plugin = plugin;
    this.file = file;
  }

  onOpen() {
    const _app = createApp(ModalPage, {
      plugin: this.plugin,
      modal: this,
      file: this.file,
    });
    this._vueApp = _app;
    _app.mount(this.containerEl);
  }

  onClose() {
    if (this._vueApp) {
      this._vueApp.unmount();
    }
    this.containerEl.empty();
  }
}
