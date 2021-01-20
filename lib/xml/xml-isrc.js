"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlIsrc = void 0;
class XmlIsrc {
    constructor(isrc) {
        this.isrc = isrc;
    }
    toXml() {
        return {
            name: 'isrc',
            attrs: {
                id: this.isrc
            }
        };
    }
}
exports.XmlIsrc = XmlIsrc;
//# sourceMappingURL=xml-isrc.js.map