
import qs from 'qs';
import Core from './core';
import {log} from '../utils';

const scopes = ['snsapi_base', 'snsapi_userinfo', 'snsapi_login'];

const URL_MP = 'https://open.weixin.qq.com/connect/oauth2/authorize';
const URL_OP = 'https://open.weixin.qq.com/connect/qrconnect';
const URL_ACCESS_TOKEN = 'https://api.weixin.qq.com/sns/oauth2/access_token';
const URL_USER_INFO = 'https://api.weixin.qq.com/sns/userinfo';

class User {
  constructor () {
    this.id = ''
    this.nickname = ''
    this.name = ''
    this.avatar = ''
    this.original = {}
    this.token = {}
  }
};

const init = function (instance) {
};

const redirect = function (state = '') {
  let instance = Core.getInstance();
  if (!instance.$config.oauth) return '';
  if (!instance.$config.oauth.scope) {
    throw new Error('未填写授权scope');
    return '';
  }
  if (!instance.$config.oauth.redirect) {
    throw new Error('未填写授权回调地址');
    return '';
  }
  let redirect_uri = instance.$config.oauth.redirect;
  if (redirect_uri.substr(0, 7) != 'http://' && redirect_uri.substr(0, 8) != 'https://') {
    throw new Error('请填写完整的回调地址，以“http://”或“https://”开头');
    return '';
  }

  let url = URL_MP;
  if (instance.$config.oauth.scope == 'snsapi_login') {
    url = URL_OP;
  }

  let params = {
    appid: instance.$config.appKey,
    redirect_uri: redirect_uri,
    response_type: 'code',
    scope: instance.$config.oauth.scope
  }
  if (state) {
    params.state = state;
  }

  return url + '?' + qs.stringify(params) + '#wechat_redirect';
};

const user = async function (code) {
  let user = await fetchAccessToken(code);
  let instance = Core.getInstance();
  if (instance.$config.oauth.scope != 'snsapi_base') {
    user = await fetchUserInfo(user);
  }
  return user;
};

const fetchAccessToken = async function (code) {
  let instance = Core.getInstance();
  let params = {
    appid: instance.$config.appKey,
    secret: instance.$config.appSecret,
    code: code,
    grant_type: 'authorization_code'
  };
  let url = URL_ACCESS_TOKEN + '?' + qs.stringify(params);

  let response = await instance.requestGet(url);
  let user = new User;
  user.id = response.openid;
  user.token = response;
  return user;
};

const fetchUserInfo = async function (user) {
  let params = {
    access_token: user.token.access_token,
    openid: user.id,
    lang: 'zh_CN'
  };
  let url = URL_USER_INFO + '?' + qs.stringify(params);

  let instance = Core.getInstance();
  let response = await instance.requestGet(url);
  if (response.errcode) {
    log('oauth.fetchUserInfo()', response);
    return false;
  }
  user.id = response.openid;
  user.nickname = response.nickname;
  user.name = response.nickname;
  user.avatar = response.headimgurl;
  user.original = response;
  return user;
};

export default {
  init,
  redirect,
  user
};
