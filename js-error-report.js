// 错误上报

// 参考了
// https://github.com/CurtisCBS/monitor/blob/master/monitor.js
// https://github.com/hezhengjie/jsErrorReport/blob/master/src/jsErrorReport.js
// https://github.com/BetterJS/badjs-report

(function() {

  'use strict';

  if (window.jsErrorReport) {
    return window.jsErrorReport
  };

  /*
   *  默认上报的错误信息
   */
  var defaults = {
    t: '', //发送数据时的时间戳
    w: window.screen.availWidth,
    h: window.screen.availHeight,

  };

  /*
   *格式化参数
   */
  function formatParams(data) {
    var arr = [];
    for (var name in data) {
      arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]));
    }
    return arr.join("&");
  }
  /*
   * 上报函数
   */
  function report(url, data) {
    var img = new Image();
    img.src = url + '?v=1&' + formatParams(data);
  }

  /**
   * js错误监控
   **/
  var jsErrorReport = function(params) {

    if (!params.url) { return }
    var url = params.url;

    // var siteId = params.siteId
    defaults.siteId = params.siteId

    //重写send方法,监控xhr请求
    var s_ajaxListener = new Object();
    s_ajaxListener.tempSend = XMLHttpRequest.prototype.send; //复制原先的send方法
    s_ajaxListener.tempOpen = XMLHttpRequest.prototype.open; //复制原先的open方法
    //重写open方法,记录请求的url
    XMLHttpRequest.prototype.open = function(method, url, boolen) {
      s_ajaxListener.tempOpen.apply(this, [method, url, boolen]);
      this.ajaxUrl = url;

    };
    XMLHttpRequest.prototype.send = function(_data) {
      s_ajaxListener.tempSend.apply(this, [_data]);
      this.onreadystatechange = function() {
        if (this.readyState == 4) {
          if (this.status >= 200 && this.status < 300) {
            return true;
          } else {
            defaults.t = new Date().getTime();
            let errorInfo = {
              type: 2,
              fu: this.ajaxUrl,
              msg: this.status + '::' + this.statusText,
              referer: encodeURIComponent(location.href)
            }

            // 合并上报的数据，包括默认上报的数据和自定义上报的数据
            var reportData = Object.assign({}, params.data || {}, defaults, errorInfo);
            // 把错误信息发送给后台
            report(url, reportData)
          }
        }
      }
    };

    //监控资源加载错误(img,script,css,以及jsonp)
    window.addEventListener('error', function(e) {
      defaults.t = new Date().getTime();
      let errorInfo = {
        type: 3,
        fu: e.target.currentSrc,
        msg: e.target.localName + ' is load error',
        referer: encodeURIComponent(location.href)
      }
      console.log('errorInfo', errorInfo)
      if (e.target != window) { //抛去js语法错误
        // 合并上报的数据，包括默认上报的数据和自定义上报的数据
        var reportData = Object.assign({}, params.data || {}, defaults, errorInfo)

        // 把错误信息发送给后台
        report(url, reportData)
      }
    }, true);

    //监控js错误
    window.onerror = function(msg, _url, line, col, error) {
      //采用异步的方式,避免阻塞
      setTimeout(function() {
        //不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
        col = col || (window.event && window.event.errorCharacter) || 0;

        defaults.t = new Date().getTime();
        let errorInfo = {
          msg: msg,
          type: 1,
          fu: _url,
          fl: line,
          fc: col,
          referer: encodeURIComponent(location.href)
        }
        if (error && error.stack) {
          //msg信息较少,如果浏览器有追溯栈信息,使用追溯栈信息
          errorInfo.stack = error.stack.toString();
        }
        // 合并上报的数据，包括默认上报的数据和自定义上报的数据
        var reportData = Object.assign({}, params.data || {}, defaults, errorInfo);
        // 把错误信息发送给后台
        report(url, reportData)
      }, 0);

      return true; //错误不会console浏览器上,如需要，可将这样注释
    };

  }

  window.jsErrorReport = jsErrorReport;

})();

/*===========================
 jsErrorReport AMD Export
 ===========================*/
if (typeof(module) !== 'undefined') {
  module.exports = window.jsErrorReport;
} else if (typeof define === 'function' && define.amd) {
  define([], function() {
    'use strict';
    return window.jsErrorReport;
  });
}