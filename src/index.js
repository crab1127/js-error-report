// 错误上报

;
(function(window) {
  if (window.FE_DEBUG) {
    return window.FE_DEBUG
  }

  var REFERER_URL = 'http://tomato.harsonserver.com/report'
  var _config = {
    siteId: 0, // 站点id
    type: 1, // 错误类型
    msg: null, // 错误内容
    fu: null, // 错误文件路径
    fl: null, // 错误行数
    fc: null, // 错误数
    referer: null, // 错误页面
    w: window.screen.availWidth, // 设备宽度
    h: window.screen.availHeight, // 设备高度
  }

  var isDataType = function(data, type) {
    type = type || 'Object'
    return Object.prototype.toString.call(data) === '[object ' + type + ']'
  }

  var isEmpty = function(obj) {
    if (obj === null) return ture
    if (isDataType(obj, 'Number')) {
      return false
    }
    return !obj
  }

  // 格式化参数
  var formatParams = function(data) {
    var arr = [];
    for (var name in data) {
      data[name] && arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(data[name]))
    }
    return arr.join("&");
  }

  // 上报函数
  var sumbit = function(data) {
    console.error('errorInfo', data)
    for (var key in data) {
      _config[key] = data[key]
    }
    var img = new Image()
    img.src = REFERER_URL + '?' + formatParams(_config)
  }

  // 监控资源加载错误(img,script,css,以及jsonp)
  var resourceLoadError = function() {
    window.addEventListener('error', function(e) {
      let errorInfo = {
        type: 3,
        fu: e.target.currentSrc,
        msg: e.target.localName + ' is load error',
        referer: location.href
      }
      if (e.target != window) { //抛去js语法错误
        // var reportData = Object.assign({}, _config, errorInfo)
        sumbit(errorInfo)
      }
    }, true);
  }

  // js语法错误
  var jsRunError = function() {
    window.onerror = function(msg, url, line, col, error) {
      // 不知名错误直接不上报
      if (msg === 'Script error.' || !url) return;

      //采用异步的方式,避免阻塞
      setTimeout(function() {
        //不一定所有浏览器都支持col参数，如果不支持就用window.event来兼容
        col = col || (window.event && window.event.errorCharacter) || 0;

        defaults.t = new Date().getTime();
        let errorInfo = {
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
          let f = arguments.callee
            // 只拿3层堆栈信息
          let c = 3
          while (f && (--c > 0)) {
            ext.push(f.toString())
            if (f === f.caller) {
              break
            }
            f = f.caller
          }
          errorInfo = ext.join(',')
        }

        // var reportData = Object.assign({}, _config, errorInfo)

        // 把错误信息发送给后台
        sumbit(errorInfo)
      }, 0);

      return true; //错误不会console浏览器上,如需要，可将这样注释
    }
  }

  var FE_DEBUG = {
    // 初始化
    init(siteId) {
      if (!siteId) return false

      Object.assign(_config, { siteId })

      resourceLoadError()
      jsRunError()

    },
    // 上报
    report(options) {
      if (!isDataType(options, 'Object')) return false
      Object.assign(_config, options)
      sumbit(_config)
    },
  }
  window.FE_DEBUG = FE_DEBUG
})(window);

if (typeof module !== 'undefined') {
  module.exports = FE_DEBUG
}