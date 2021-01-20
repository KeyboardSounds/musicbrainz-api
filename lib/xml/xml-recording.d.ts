import { XmlIsrcList } from './xml-isrc-list';
export declare class XmlRecording {
    id: string;
    isrcList: XmlIsrcList;
    constructor(id: string);
    toXml(): {
        name: string;
        attrs: {
            id: string;
        };
        children: {
            name: string;
            attrs: {
                count: number;
            };
            children: {
                name: string;
                attrs: {
                    id: string;
                };
            }[];
        }[];
    };
}
