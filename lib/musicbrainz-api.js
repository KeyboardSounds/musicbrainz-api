"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeAndQueryString = exports.MusicBrainzApi = exports.XmlRecording = exports.XmlIsrcList = exports.XmlIsrc = exports.XmlMetadata = void 0;
const assert = require("assert");
const HttpStatus = require("http-status-codes");
const Url = require("url");
const Debug = require("debug");
var xml_metadata_1 = require("./xml/xml-metadata");
Object.defineProperty(exports, "XmlMetadata", { enumerable: true, get: function () { return xml_metadata_1.XmlMetadata; } });
var xml_isrc_1 = require("./xml/xml-isrc");
Object.defineProperty(exports, "XmlIsrc", { enumerable: true, get: function () { return xml_isrc_1.XmlIsrc; } });
var xml_isrc_list_1 = require("./xml/xml-isrc-list");
Object.defineProperty(exports, "XmlIsrcList", { enumerable: true, get: function () { return xml_isrc_list_1.XmlIsrcList; } });
var xml_recording_1 = require("./xml/xml-recording");
Object.defineProperty(exports, "XmlRecording", { enumerable: true, get: function () { return xml_recording_1.XmlRecording; } });
const digest_auth_1 = require("./digest-auth");
const rate_limiter_1 = require("./rate-limiter");
const mb = require("./musicbrainz.types");
const requestPromise = require("request-promise-native");
const request = require("request");
__exportStar(require("./musicbrainz.types"), exports);
const retries = 3;
const debug = Debug('musicbrainz-api');
class MusicBrainzApi {
    constructor(_config) {
        this.config = {
            baseUrl: 'https://musicbrainz.org'
        };
        Object.assign(this.config, _config);
        this.cookieJar = request.jar();
        this.request = requestPromise.defaults({
            baseUrl: this.config.baseUrl,
            timeout: 20 * 1000,
            headers: {
                /**
                 * https://musicbrainz.org/doc/XML_Web_Service/Rate_Limiting#Provide_meaningful_User-Agent_strings
                 */
                'User-Agent': `${this.config.appName}/${this.config.appVersion} ( ${this.config.appContactInfo} )`
            },
            proxy: this.config.proxy,
            strictSSL: false,
            jar: this.cookieJar,
            resolveWithFullResponse: true
        });
        this.rateLimiter = new rate_limiter_1.RateLimiter(14, 14);
    }
    static escapeText(text) {
        let str = '';
        for (const chr of text) {
            // Escaping Special Characters: + - && || ! ( ) { } [ ] ^ " ~ * ? : \ /
            // ToDo: && ||
            switch (chr) {
                case '+':
                case '-':
                case '!':
                case '(':
                case ')':
                case '{':
                case '}':
                case '[':
                case ']':
                case '^':
                case '"':
                case '~':
                case '*':
                case '?':
                case ':':
                case '\\':
                case '/':
                    str += '\\';
            }
            str += chr;
        }
        return str;
    }
    async restGet(relUrl, query = {}, attempt = 1) {
        query.fmt = 'json';
        let response;
        await this.rateLimiter.limit();
        do {
            response = await this.request.get('/ws/2' + relUrl, {
                qs: query,
                json: true
            }, null);
            if (response.statusCode !== 503)
                break;
            debug('Rate limiter kicked in, slowing down...');
            await rate_limiter_1.RateLimiter.sleep(500);
        } while (true);
        switch (response.statusCode) {
            case HttpStatus.OK:
                return response.body;
            case HttpStatus.BAD_REQUEST:
            case HttpStatus.NOT_FOUND:
                throw new Error(`Got response status ${response.statusCode}: ${HttpStatus.getStatusText(response.statusCode)}`);
            case HttpStatus.SERVICE_UNAVAILABLE: // 503
            default:
                const msg = `Got response status ${response.statusCode} on attempt #${attempt} (${HttpStatus.getStatusText(response.statusCode)})`;
                debug(msg);
                if (attempt < retries) {
                    return this.restGet(relUrl, query, attempt + 1);
                }
                else
                    throw new Error(msg);
        }
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Lookup functions
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * Generic lookup function
     * @param entity
     * @param mbid
     * @param inc
     */
    getEntity(entity, mbid, inc = []) {
        return this.restGet(`/${entity}/${mbid}`, { inc: inc.join(' ') });
    }
    /**
     * Lookup area
     * @param areaId Area MBID
     * @param inc Sub-queries
     */
    getArea(areaId, inc = []) {
        return this.getEntity('area', areaId, inc);
    }
    /**
     * Lookup artist
     * @param artistId Artist MBID
     * @param inc Sub-queries
     */
    getArtist(artistId, inc = []) {
        return this.getEntity('artist', artistId, inc);
    }
    /**
     * Lookup release
     * @param releaseId Release MBID
     * @param inc Include: artist-credits, labels, recordings, release-groups, media, discids, isrcs (with recordings)
     * ToDo: ['recordings', 'artists', 'artist-credits', 'isrcs', 'url-rels', 'release-groups']
     */
    getRelease(releaseId, inc = []) {
        return this.getEntity('release', releaseId, inc);
    }
    /**
     * Lookup release-group
     * @param releaseGroupId Release-group MBID
     * @param inc Include: ToDo
     */
    getReleaseGroup(releaseGroupId, inc = []) {
        return this.getEntity('release-group', releaseGroupId, inc);
    }
    /**
     * Lookup work
     * @param workId Work MBID
     */
    getWork(workId) {
        return this.getEntity('work', workId);
    }
    /**
     * Lookup label
     * @param labelId Label MBID
     */
    getLabel(labelId) {
        return this.getEntity('label', labelId);
    }
    /**
     * Lookup recording
     * @param recordingId Label MBID
     * @param inc Include: artist-credits, isrcs
     */
    getRecording(recordingId, inc = []) {
        return this.getEntity('recording', recordingId, inc);
    }
    async postRecording(xmlMetadata) {
        return this.post('recording', xmlMetadata);
    }
    async post(entity, xmlMetadata) {
        if (!this.config.appName || !this.config.appVersion) {
            throw new Error(`XML-Post requires the appName & appVersion to be defined`);
        }
        const clientId = `${this.config.appName.replace(/-/g, '.')}-${this.config.appVersion}`;
        const path = `/ws/2/${entity}/`;
        // Get digest challenge
        let digest = null;
        let n = 1;
        const postData = xmlMetadata.toXml();
        do {
            try {
                await this.rateLimiter.limit();
                await this.request.post(path, {
                    qs: { client: clientId },
                    headers: {
                        authorization: digest,
                        'Content-Type': 'application/xml'
                    },
                    body: postData
                });
            }
            catch (err) {
                const response = err.response;
                assert.ok(response.complete);
                if (response.statusCode === HttpStatus.UNAUTHORIZED) {
                    // Respond to digest challenge
                    const auth = new digest_auth_1.DigestAuth(this.config.botAccount);
                    const relPath = Url.parse(response.request.path).path; // Ensure path is relative
                    digest = auth.digest(response.request.method, relPath, response.headers['www-authenticate']);
                    continue;
                }
                else if (response.statusCode === 503) {
                    continue;
                }
                break;
            }
            break;
        } while (n++ < 5);
    }
    async login() {
        const cookies = this.getCookies(this.config.baseUrl);
        for (const cookie of cookies) {
            if (cookie.key === 'musicbrainz_server_session')
                return true;
        }
        const redirectUri = '/success';
        assert.ok(this.config.botAccount.username, 'bot username should be set');
        assert.ok(this.config.botAccount.password, 'bot password should be set');
        let response;
        try {
            response = await this.request.post({
                uri: '/login',
                followRedirect: false,
                qs: {
                    uri: redirectUri
                },
                form: {
                    username: this.config.botAccount.username,
                    password: this.config.botAccount.password
                }
            });
        }
        catch (err) {
            if (err.response) {
                assert.ok(err.response.complete);
                response = err.response;
            }
            else {
                throw err;
            }
        }
        assert.strictEqual(response.statusCode, HttpStatus.MOVED_TEMPORARILY, 'Expect redirect to /success');
        return response.headers.location === redirectUri;
    }
    /**
     * Submit entity
     * @param entity Entity type e.g. 'recording'
     * @param mbid
     * @param formData
     */
    async editEntity(entity, mbid, formData) {
        assert.ok(await this.login(), `should be logged in to ${this.config.botAccount.username} with username ${this.config.baseUrl}`);
        await this.rateLimiter.limit();
        let response;
        try {
            response = await this.request.post({
                uri: `/${entity}/${mbid}/edit`,
                form: formData,
                followRedirect: false
            });
        }
        catch (err) {
            assert.ok(err.response.complete);
            response = err.response;
        }
        assert.strictEqual(response.statusCode, HttpStatus.MOVED_TEMPORARILY);
    }
    /**
     * Set URL to recording
     * @param recording Recording to update
     * @param url2add URL to add to the recording
     * @param editNote Edit note
     */
    async addUrlToRecording(recording, url2add, editNote = '') {
        const formData = {};
        formData[`edit-recording.name`] = recording.title; // Required
        formData[`edit-recording.comment`] = recording.disambiguation;
        formData[`edit-recording.make_votable`] = true;
        formData[`edit-recording.url.0.link_type_id`] = url2add.linkTypeId;
        formData[`edit-recording.url.0.text`] = url2add.text;
        for (const i in recording.isrcs) {
            formData[`edit-recording.isrcs.${i}`] = recording.isrcs[i];
        }
        formData['edit-recording.edit_note'] = editNote;
        return this.editEntity('recording', recording.id, formData);
    }
    /**
     * Add ISRC to recording
     * @param recording Recording to update
     * @param isrc ISRC code to add
     * @param editNote Edit note
     */
    async addIsrc(recording, isrc, editNote = '') {
        const formData = {};
        formData[`edit-recording.name`] = recording.title; // Required
        if (!recording.isrcs) {
            throw new Error('You must retrieve recording with existing ISRC values');
        }
        if (recording.isrcs.indexOf(isrc) === -1) {
            recording.isrcs.push(isrc);
            for (const i in recording.isrcs) {
                formData[`edit-recording.isrcs.${i}`] = recording.isrcs[i];
            }
            return this.editEntity('recording', recording.id, formData);
        }
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Query functions
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * Search an entity using a search query
     * @param query e.g.: '" artist: Madonna, track: Like a virgin"' or object with search terms: {artist: Madonna}
     * @param entity e.g. 'recording'
     * @param offset
     * @param limit
     */
    search(entity, query, offset, limit) {
        if (typeof query === 'object') {
            query = makeAndQueryString(query);
        }
        return this.restGet('/' + entity + '/', { query, offset, limit });
    }
    // -----------------------------------------------------------------------------------------------------------------
    // Helper functions
    // -----------------------------------------------------------------------------------------------------------------
    /**
     * Add Spotify-ID to MusicBrainz recording.
     * This function will automatically lookup the recording title, which is required to submit the recording URL
     * @param recording MBID of the recording
     * @param spotifyId Spotify ID
     * @param editNote Comment to add.
     */
    addSpotifyIdToRecording(recording, spotifyId, editNote) {
        assert.strictEqual(spotifyId.length, 22);
        return this.addUrlToRecording(recording, {
            linkTypeId: mb.LinkType.stream_for_free,
            text: 'https://open.spotify.com/track/' + spotifyId
        }, editNote);
    }
    searchArtist(query, offset, limit) {
        return this.search('artist', query, offset, limit);
    }
    searchRelease(query, offset, limit) {
        return this.search('release', query, offset, limit);
    }
    searchReleaseGroup(query, offset, limit) {
        return this.search('release-group', query, offset, limit);
    }
    searchArea(query, offset, limit) {
        return this.search('area', query, offset, limit);
    }
    searchUrl(query, offset, limit) {
        return this.search('url', query, offset, limit);
    }
    getCookies(url) {
        return this.cookieJar.getCookies(url);
    }
}
exports.MusicBrainzApi = MusicBrainzApi;
function makeAndQueryString(keyValuePairs) {
    return Object.keys(keyValuePairs).map(key => `${key}:"${keyValuePairs[key]}"`).join(' AND ');
}
exports.makeAndQueryString = makeAndQueryString;
//# sourceMappingURL=musicbrainz-api.js.map