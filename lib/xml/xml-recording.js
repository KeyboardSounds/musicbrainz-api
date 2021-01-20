"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlRecording = void 0;
const xml_isrc_list_1 = require("./xml-isrc-list");
class XmlRecording {
    constructor(id) {
        this.id = id;
        this.isrcList = new xml_isrc_list_1.XmlIsrcList();
    }
    toXml() {
        return {
            name: 'recording',
            attrs: {
                id: this.id
            },
            children: [this.isrcList.toXml()]
        };
    }
}
exports.XmlRecording = XmlRecording;
//# sourceMappingURL=xml-recording.js.map