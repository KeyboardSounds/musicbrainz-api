"use strict";
// https://musicbrainz.org/doc/Development/XML_Web_Service/Version_2#ISRC_submission
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlMetadata = void 0;
const jsontoxml = require("jsontoxml");
const xml_recording_1 = require("./xml-recording");
const ns_metadata = 'http://musicbrainz.org/ns/mmd-2.0#';
class XmlMetadata {
    constructor() {
        this.recordings = [];
    }
    pushRecording(id) {
        const rec = new xml_recording_1.XmlRecording(id);
        this.recordings.push(rec);
        return rec;
    }
    toXml() {
        return jsontoxml([{
                name: 'metadata',
                attrs: {
                    xmlns: ns_metadata
                },
                children: [{
                        'recording-list': this.recordings.map(rec => rec.toXml())
                    }]
            }], { prettyPrint: false, escape: true, xmlHeader: true });
    }
}
exports.XmlMetadata = XmlMetadata;
//# sourceMappingURL=xml-metadata.js.map