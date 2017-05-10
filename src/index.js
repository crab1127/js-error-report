// 错误上报

// 开启静默开关功能
;
(function(window) {
  if (window.FE_DEBUG) {
    return window.FE_DEBUG
  }

  var REFERER_URL = 'http://tomato.harsonserver.com/report'
  var _config = {
    siteId: 0, // 站点id
    type: 1, // 错误类型 1，js错误  2:ajax错误 3:资源错误
    msg: null, // 错误内容
    fu: null, // 错误文件路径
    fl: null, // 错误行数
    fc: null, // 错误数
    referer: null, // 错误页面
    silent: false, // 安静模式
    w: window.screen.availWidth, // 设备宽度
    h: window.screen.availHeight, // 设备高度
  }

  var isDataType = function(data, type) {
    type = type || 'Object'
    return Object.prototype.toString.call(data) === '[object ' + type + ']'
  }

  // 格式化参数
  var formatParams = function(data) {
    var arr = [];
    for (var name in data) {
      data[name] && arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]))
    }
    return arr.join("&");
  }

  var processError = function(errObj) {
    try {
      if (errObj.stack) {

        var url = errObj.stack.match("https?://[^\n]+");
        url = url ? url[0] : "";
        var rowCols = url.match(":(\\d+):(\\d+)");
        if (!rowCols) {
          rowCols = [0, 0, 0];
        }

        return {
          msg: errObj.name + ' ' + errObj.message,
          stack: errObj.stack.toString(),
          fu: url.replace(rowCols[0], ''), // 错误文件路径
          fl: rowCols[1], // 错误行数
          fc: rowCols[2], // 错误数
          referer: location.href
        }
      } else {
        return {
          msg: errObj.name + ' ' + errObj.message,
          referer: location.href
        }
      }
    } catch (err) {
      return {
        msg: JSON.stringify(errObj),
        referer: location.href
      }
    }
  }

  // 上报函数
  var sumbit = function(data) {
    // 开启静默就不发通知
    if (_config.silent) return;

    for (var key in data) {
      _config[key] = data[key]
    }
    var img = new Image()
    img.src = REFERER_URL + '?' + formatParams(_config)
  }

  // 监控资源加载错误(img,script,css,以及jsonp)
  var resourceLoadError = function() {
    window.addEventListener('error', function(e) {
      var fileUrl = e.target.localName === 'link' ? e.target.href : e.target.src
      var errorInfo = {
        type: 3,
        fu: fileUrl,
        msg: e.target.localName + ' is load error',
        referer: location.href
      }

      //抛去js语法错误
      if (e.target != window) {
        sumbit(errorInfo)
      }
    }, true);
  }

  // js语法错误
  var jsRunError = function() {
    window.onerror = function(msg, url, line, col, error) {
      console.error(msg, error)
        // 不知名错误直接不上报
      if (msg === 'Script error.' || !url) return;

      //采用异步的方式,避免阻塞
      setTimeout(function() {
        //不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
        col = col || (window.event && window.event.errorCharacter) || 0;

        var errorInfo = {
          type: 1,
          msg: msg,
          fu: url,
          fl: line,
          // 有些浏览器不支持col
          fc: col || (window.event && window.event.errorCharacter) || 0,
          referer: location.href
        }

        if (!!error && !!error.stack) {
          // 如果浏览器有堆栈信息
          // 直接使用
          errorInfo.stack = error.stack.toString();
        } else if (!!arguments.callee) {
          var ext = []
          var f = arguments.callee
            // 只拿3层堆栈信息
          var c = 3
          while (f && (--c > 0)) {
            ext.push(f.toString())
            if (f === f.caller) {
              break
            }
            f = f.caller
          }
          errorInfo = ext.join(',')
        }


        // 把错误信息发送给后台
        sumbit(errorInfo)
      }, 0);

      //错误不会console浏览器上,如需要，可将这样注释
      return true
    }
  }

  var FE_DEBUG = {
    // 初始化
    init: function(options) {
      if (!options.siteId) return false
      _config.siteId = options.siteId

      _config.silent && (_config.silent = options.silent)

      resourceLoadError()
      jsRunError()

    },
    // 上报
    report: function(options) {

      if (!isDataType(options, 'Object')) return false

      sumbit(options)
    },
    // 上报
    reportError: function(errObj) {
      var errorInfo = processError(errObj)
      sumbit(errorInfo)
    },
  }
  window.FE_DEBUG = FE_DEBUG
})(window);

if (typeof module !== 'undefined') {
  module.exports = FE_DEBUG
}