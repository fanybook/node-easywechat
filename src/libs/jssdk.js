
import utils from '../utils';
import qs from 'qs';
import sha1 from 'sha1';

const URL_JSAPI_TICKET = 'https://api.weixin.qq.com/cgi-bin/ticket/getticket';

var $instance;

const init = function (instance) {
  $instance = instance;

  $instance.$config.jssdk = $instance.$config.jssdk || {};
  $instance.$config.jssdk.cache_id = $instance.$config.jssdk.cache_id || 'NODE_EASYWECHAT_JSSKD_TICKET';
  $instance.$config.jssdk.buffer_time = $instance.$config.jssdk.buffer_time || 60;
};

var $url = '';

const setUrl = function (url) {
  $url = url;
};

const fetchJsapiTicket = async function () {
  let accessToken = await $instance.access_token.getToken();
  let params = {
    access_token: accessToken,
    type: 'jsapi'
  };
  let url = URL_JSAPI_TICKET + '?' + qs.stringify(params);

  return await $instance.requestGet(url);
};

const config = async function (APIs, debug = false, json = true) {
  let jssdkTicket = $instance.$config.cache.fetch($instance.$config.jssdk.cache_id);
  if (!$instance.$config.cache.contains($instance.$config.jssdk.cache_id, $instance.$config.jssdk.buffer_time)) {
    let res = await fetchJsapiTicket();
    $instance.$config.cache.save($instance.$config.jssdk.cache_id, res.ticket, res.expires_in);
    jssdkTicket = res.ticket;
  }

  let url = $url;

  let noncestr = utils.randomString();
  let timestamp = utils.getTimestamp();
  let signature = makeSignature({
    jsapi_ticket: jssdkTicket,
    noncestr,
    timestamp,
    url
  });

  let config = {
    debug,
    appId: $instance.$config.appKey,
    timestamp,
    nonceStr: noncestr,
    signature,
    url,
    jsApiList: APIs
  }

  // 使用完清空设置的url
  $url = '';

  return json ? JSON.stringify(config) : config;
};

const makeSignature = function (params) {
  let paramsString = '';
  let sparator = '';
  for (let k in params) {
    paramsString += sparator + k + '=' + params[k];
    sparator = '&';
  }
  return sha1(paramsString);
}

export default {
  init,
  setUrl,
  config
};
