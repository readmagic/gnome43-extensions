/**
 * Char Counter - GNOME Shell Extension
 * 统计当天输入字符数量，显示在顶部面板
 *
 * @author Frandy
 * @version 1.0.0
 * @license MIT
 *
 * 注意：在 Wayland 下，事件捕获仅限于 GNOME Shell 层级
 * 完整的全局键盘监听可能需要配合独立服务
 */

'use strict';

const { GObject, St, GLib, Gio, Clutter } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const DATA_FILE = GLib.build_filenamev([GLib.get_home_dir(), '.char_counter.json']);

let _indicator = null;

const CharCounterIndicator = GObject.registerClass(
class CharCounterIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Char Counter');

        this._stats = { today: 0, date: '' };
        this._captureId = null;
        this._timerId = null;
        this._saveTimeoutId = null;

        // 面板标签
        this._label = new St.Label({
            text: '0字',
            y_align: Clutter.ActorAlign.CENTER,
        });
        this.add_child(this._label);

        // 右键菜单
        this._buildMenu();

        // 加载数据
        this._loadStats();
        this._rolloverDayIfNeeded();
        this._updateLabel();

        // 全局按键监听 (captured-event 在事件分发前捕获)
        this._captureId = global.stage.connect('captured-event', (stage, event) => {
            return this._onCapturedEvent(event);
        });

        // 定时器: 每分钟检查日期切换
        this._timerId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 60, () => {
            this._rolloverDayIfNeeded();
            this._updateLabel();
            return GLib.SOURCE_CONTINUE;
        });
    }

    _buildMenu() {
        // 显示今日统计
        this._statsItem = new PopupMenu.PopupMenuItem('今日: 0 字');
        this._statsItem.setSensitive(false);
        this.menu.addMenuItem(this._statsItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // 清除今日计数
        let clearItem = new PopupMenu.PopupMenuItem('清除今日统计');
        clearItem.connect('activate', () => {
            this._stats.today = 0;
            this._saveStats();
            this._updateLabel();
        });
        this.menu.addMenuItem(clearItem);
    }

    _onCapturedEvent(event) {
        if (event.type() !== Clutter.EventType.KEY_PRESS) {
            return Clutter.EVENT_PROPAGATE;
        }

        let keyval = event.get_key_symbol();
        let unicode = Clutter.keyval_to_unicode(keyval);

        // 只统计可打印字符 (排除控制字符和 DEL)
        if (unicode > 31 && unicode !== 127) {
            this._rolloverDayIfNeeded();
            this._stats.today += 1;
            this._updateLabel();
            this._scheduleSave();
        }

        return Clutter.EVENT_PROPAGATE;
    }

    _rolloverDayIfNeeded() {
        let today = GLib.DateTime.new_now_local().format('%Y-%m-%d');
        if (this._stats.date !== today) {
            this._stats.date = today;
            this._stats.today = 0;
            this._saveStats();
        }
    }

    _loadStats() {
        try {
            let [ok, contents] = GLib.file_get_contents(DATA_FILE);
            if (ok) {
                let text = new TextDecoder().decode(contents);
                let data = JSON.parse(text);
                this._stats = Object.assign(this._stats, data);
            }
        } catch (e) {
            // 文件不存在或解析失败，使用默认值
        }
    }

    _saveStats() {
        try {
            let text = JSON.stringify(this._stats);
            GLib.file_set_contents(DATA_FILE, text);
        } catch (e) {
            logError(e, 'CharCounter: 保存统计失败');
        }
    }

    // 防抖保存: 避免频繁写入磁盘
    _scheduleSave() {
        if (this._saveTimeoutId) {
            GLib.source_remove(this._saveTimeoutId);
        }
        this._saveTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () => {
            this._saveStats();
            this._saveTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    _updateLabel() {
        this._label.set_text(`${this._stats.today}字`);
        if (this._statsItem) {
            this._statsItem.label.set_text(`今日: ${this._stats.today} 字`);
        }
    }

    destroy() {
        if (this._captureId) {
            global.stage.disconnect(this._captureId);
            this._captureId = null;
        }
        if (this._timerId) {
            GLib.source_remove(this._timerId);
            this._timerId = null;
        }
        if (this._saveTimeoutId) {
            GLib.source_remove(this._saveTimeoutId);
            this._saveStats();  // 销毁前保存
            this._saveTimeoutId = null;
        }
        super.destroy();
    }
});

function init() {
    // 扩展初始化 (此时 Shell 尚未完全加载)
}

function enable() {
    _indicator = new CharCounterIndicator();
    Main.panel.addToStatusArea('char-counter', _indicator);
}

function disable() {
    if (_indicator) {
        _indicator.destroy();
        _indicator = null;
    }
}
