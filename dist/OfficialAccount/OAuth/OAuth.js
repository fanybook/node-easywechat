'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const BaseClient_1 = require("../../Core/BaseClient");
const Utils_1 = require("../../Core/Utils");
class User {
    constructor() {
        this.id = '';
        this.nickname = '';
        this.name = '';
        this.avatar = '';
        this.original = '';
        this.token = {};
    }
}
;
class OAuth extends BaseClient_1.default {
    constructor() {
        super(...arguments);
        this._scope = 'snsapi_userinfo';
        this._callback = '';
        this._state = '';
    }
    scopes(scope) {
        this._scope = scope || 'snsapi_userinfo';
        return this;
    }
    callback(callback) {
        this._callback = callback || '';
        return this;
    }
    state(state) {
        this._state = state || '';
        return this;
    }
    redirect(callback = null) {
        if (!this.app['config']['oauth']) {
            throw new Error('Please config `oauth` section');
        }
        let scope = this._scope || this.app['config']['oauth']['scope'] || 'snsapi_userinfo';
        if (!callback) {
            callback = this._callback || this.app['config']['oauth']['callback'] || '';
        }
        if (callback.substr(0, 7) !== 'http://' && callback.substr(0, 8) !== 'https://') {
            throw new Error('Please set callback url start with "http://" or "https://"');
        }
        let params = {
            appid: this.app['config']['app_id'],
            redirect_uri: callback,
            response_type: 'code',
            scope: scope,
            state: '',
        };
        if (this._state) {
            params.state = this._state;
        }
        return 'https://open.weixin.qq.com/connect/oauth2/authorize?' + Utils_1.buildQueryString(params) + '#wechat_redirect';
    }
    user(code) {
        return __awaiter(this, void 0, void 0, function* () {
            let params = {
                appid: this.app['config']['app_id'],
                secret: this.app['config']['secret'],
                code: code,
                grant_type: 'authorization_code'
            };
            let res = yield this.httpGet('/sns/oauth2/access_token', params);
            if (res.errcode) {
                this.app['log']('Fail to fetch access_token', res);
                throw new Error('Fail to fetch access_token');
            }
            let user = new User;
            user.id = res.openid;
            user.token = res;
            if (this.app['config']['scope'] != 'snsapi_base') {
                let params = {
                    access_token: user.token['access_token'],
                    openid: user.id,
                    lang: 'zh_CN'
                };
                res = yield this.httpGet('/sns/userinfo', params);
                if (res.errcode) {
                    this.app['log']('Fail to fetch userinfo', res);
                    return user;
                }
                user.id = res.openid;
                user.nickname = res.nickname;
                user.name = res.nickname;
                user.avatar = res.headimgurl;
                user.original = res;
            }
            return user;
        });
    }
}
exports.default = OAuth;
