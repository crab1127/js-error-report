# js错误上报

## 初始化

```javascript
  // @params siteId 网站id， 不传则不初始化
  FE_DEBUG.init(123);
```

## 手动上报
默认是自动上报， 有些错误需要手动上报也是可以的

```javascript
  FE_DEBUG.report({
    type: 1,                  // 错误类型
    msg: 'xxxx load error',   // 错误信息
    fu: 'xxxxx.js'            // 错误js
  })
```

