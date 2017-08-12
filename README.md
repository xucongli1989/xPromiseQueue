## 简介

这是一个Promise的执行队列模块，里面的每一个Promise都是按顺序执行的，您也可以指定一定的优先级来决定队列的执行顺序。

## 使用场景

- 需要按顺序来运行某一组任务，比如：当A处理后才能执行B，B处理后才能执行C...
- 示例场景：一个页面可能会出现多个弹窗，为避免多个弹窗同时展现在页面上，可以采用此模块来顺序执行弹窗，只有当前面的弹窗处理完毕后，才会展示后面的弹窗。

## 如何使用

- 可自行打包
- 参见./Build/中的文件

## API

公开的模块内容为`export default { QItem, Queue }`,其中`QItem`是队列中的具体项，`Queue`是队列。

`QItem`:

方法或属性|类型|返回值|说明 
-|:-:|-:
name|string||名称
pmsStatus|enum||该Promise状态
next|QItem||下一个执行项
run|function|Promise|执行该队列项
resolve|function|void|解决一个Promise
reject|function|void|拒绝一个Promise


`Queue`:

方法或属性|类型|返回值|说明 
-|:-:|-:
isWatching|boolean||是否为监听中
reg|function(item: QItem, priority: Priority = Priority.Low)|this|注册一个Promise项到执行队列中
run|function|this|运行队列
getCur|function|QItem|获取当前正在执行中的队列项


