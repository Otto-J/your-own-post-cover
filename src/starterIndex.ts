import {
  App,
  ItemView,
  Modal,
  Notice,
  Platform,
  Plugin,
  PluginSettingTab,
  TFile,
  TFolder,
} from "obsidian";
import {
  createApp,
  type ComponentPublicInstance,
  type App as VueApp,
} from "vue";
import SettingsPage from "./ui/settings.vue";
import ModalPage from "./ui/modal.vue";

import DemoVue from "./ui/test.vue";

const VIEW_TYPE = "vue-view";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
  mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
  mySetting: "这是默认值",
};

class MyVueView extends ItemView {
  view!: ComponentPublicInstance;

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Dice Roller";
  }

  getIcon(): string {
    return "dice";
  }

  async onOpen(): Promise<void> {
    const app = createApp(DemoVue).mount(this.contentEl);
    this.view = app;
  }
}

// 核心
export default class MyPlugin extends Plugin {
  private view!: MyVueView;
  settings!: MyPluginSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SampleSettingTab(this.app, this));

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile) {
          const isImg = ["png", "jpg", "jpeg", "gif", "webp"].includes(
            file.extension
          );

          if (isImg) {
            // 暂不处理
          } else {
            menu.addItem((item) => {
              item
                .setTitle("Add a post cover banner hero image")
                .onClick(() => {
                  // nothing
                  const postTitle = file.basename ?? "untitled";
                  const encodedPostTitle = encodeURIComponent(postTitle);
                  // console.log(postTitle);
                  const baseUrl = "http://f.ijust.cc/release/?title=";
                  const finalUrl = baseUrl + encodedPostTitle;
                  // console.log(finalUrl);

                  // file 在最顶部添加一张 markdown 图片
                  file.vault.process(file, (data) => {
                    // console.log(data);
                    const str = `![${postTitle}](${finalUrl})\n\n` + data;
                    return str;
                  });
                });
            });
          }
        }
      })
    );

    // 在这里注册命令 This adds a simple command that can be triggered anywhere
    this.addCommand({
      id: "your-own-post-cover-banner-hero-image",
      name: "Add a post cover banner hero image",

      editorCallback: (editor, view) => {
        // 当前的编辑器和标题
        // console.log(editor, view);
        const postTitle = view.file?.basename ?? "untitled";
        const encodedPostTitle = encodeURIComponent(postTitle);
        // console.log(encodedPostTitle);

        const baseUrl = "http://f.ijust.cc/release/?title=";
        const finalUrl = baseUrl + encodedPostTitle;
        // console.log(finalUrl);
        // 在当前文章的顶部插入一张图片
        editor.replaceSelection(`![${postTitle}](${finalUrl})\n`);
      },
    });
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
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
    const { addOrUpdateFrontMatter, currentFrontMatter } =
      useObsidianFrontmatter(this.file, this.app);

    //  console.log("open设置面板", this.plugin);
    const _app = createApp(ModalPage, {
      plugin: this.plugin,
      modal: this,
      file: this.file,
      addOrUpdateFrontMatter,
      currentFrontMatter,
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
