import { XmlRecording } from './xml-recording';
export declare class XmlMetadata {
    recordings: XmlRecording[];
    pushRecording(id: string): XmlRecording;
    toXml(): string;
}
