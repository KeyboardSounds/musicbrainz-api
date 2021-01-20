"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlIsrcList = void 0;
const xml_isrc_1 = require("./xml-isrc");
class XmlIsrcList {
    constructor() {
        this.items = [];
    }
    pushIsrc(isrc) {
        this.items.push(new xml_isrc_1.XmlIsrc(isrc));
    }
    toXml() {
        return this.items.length === 0 ? null : {
            name: 'isrc-list',
            attrs: {
                count: this.items.length
            },
            children: this.items.map(isrc => isrc.toXml())
        };
    }
}
exports.XmlIsrcList = XmlIsrcList;
//# sourceMappingURL=xml-isrc-list.js.map