/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */
 import Clutter from 'gi://Clutter';
 import GObject from 'gi://GObject';
 import Gio from 'gi://Gio';
 import St from 'gi://St';

 import {
  Extension,
  gettext as _
} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import QRCode from './vendor/qrcode.js';

const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, _('My Shiny Indicator'));

      this.add_child(new St.Icon({
        icon_name: 'face-smile-symbolic',
        style_class: 'system-status-icon',
      }));

      let qrMenuItem = new PopupMenu.PopupMenuItem(_('Show QR'));
      qrMenuItem.connect('activate', () => {
        St.Clipboard.get_default().get_text(St.ClipboardType.CLIPBOARD, (clipboard, text) => {
          if (!text) {
            Main.notify(_('Empty clipboard!'));
          }
          const qrCode = new QRCode(text);

          const file = Gio.File.new_for_uri('file:///tmp/test-file.svg');

          const [etag] = file.replace_contents(
            new TextEncoder().encode(qrCode.svg()), null, false,
            Gio.FileCreateFlags.REPLACE_DESTINATION, null
            );

          const parentActor = new St.Widget({
            layout_manager: new Clutter.BoxLayout({
              homogeneous: true,
            })
          });
          parentActor.set_style(`
            background-image: url(file:///tmp/test-file.svg);
            width: 500px;
            height: 500px;
            `);
          let button = new St.Button({
            style_class: 'modal-dialog-linked-button',
            button_mask: St.ButtonMask.ONE | St.ButtonMask.THREE,
            reactive: true,
            can_focus: true,
            x_expand: true,
            y_expand: true,
            label: 'Close',
          });
          button.set_style(`
            margin-top: 250px;
            color: black;
            `)
          parentActor.add_child(button);
          button.connect('clicked', () => {
            Main.layoutManager.removeChrome(parentActor);
          });

          Main.layoutManager.addChrome(parentActor);
        });
      });
      this.menu.addMenuItem(qrMenuItem);
    }
  });

export default class IndicatorExampleExtension extends Extension {
  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}