/**
 * Hide Window Title Extension
 * 作者: Frandy
 *
 * 隐藏 GNOME Shell 顶部栏的窗口标题
 */

const Main = imports.ui.main;

class Extension {
    constructor() {
        this._originalGetAppMenuWidth = null;
    }

    enable() {
        const panel = Main.panel;
        const appMenu = panel.statusArea.appMenu;

        if (appMenu) {
            appMenu.hide();
        }
    }

    disable() {
        const panel = Main.panel;
        const appMenu = panel.statusArea.appMenu;

        if (appMenu) {
            appMenu.show();
        }
    }
}

function init() {
    return new Extension();
}
