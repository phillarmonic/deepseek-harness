# dsh-random-uuid

[English](README.md) | 中文

`randomUuid()` 是供浏览器与 Node 共享代码使用的零依赖 RFC 4122 UUID v4 生成器。它使用 `crypto.getRandomValues()`；在普通 HTTP 来源中，只有安全上下文才提供的便捷方法 `crypto.randomUUID()` 不存在，但 `getRandomValues()` 仍然可用。

该包只负责生成标识符。标识符品牌、持久化、唯一性范围和线协议语义仍由各消费方负责。它没有需要共享的单例状态或运行时身份，因此浏览器 bundle 会将其内联。

## 模型体验

无。消费方将生成的标识符用于对模型不可见的关联和浏览器本地状态。

## 已知限制与暂缓事项

- 运行时必须提供 Web Crypto `getRandomValues()`；不支持它的旧环境会在调用位置失败，而不会回退到更弱的熵源。
