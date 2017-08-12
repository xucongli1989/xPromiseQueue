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

<table>
<tr>
<th>方法或属性</th>
<th>类型</th>
<th>返回值</th>
<th>说明</th>
</tr>
<tr>
<td>name</td>
<td>string</td>
<td></td>
<td>名称</td>
</tr>
<tr>
<td>pmsStatus</td>
<td>enum</td>
<td></td>
<td>该Promise状态</td>
</tr>
<tr>
<td>next</td>
<td>QItem</td>
<td></td>
<td>下一个执行项</td>
</tr>
<tr>
<td>run</td>
<td>function</td>
<td>Promise</td>
<td>执行该队列项</td>
</tr>
<tr>
<td>resolve</td>
<td>function</td>
<td>void</td>
<td>解决一个Promise</td>
</tr>
<tr>
<td>reject</td>
<td>function</td>
<td>void</td>
<td>拒绝一个Promise</td>
</tr>
</table>


`Queue`:

<table>
<tr>
<th>方法或属性</th>
<th>类型</th>
<th>返回值</th>
<th>说明</th>
</tr>
<tr>
<td>isWatching</td>
<td>boolean</td>
<td></td>
<td>是否为监听中</td>
</tr>
<tr>
<td>reg</td>
<td>function(item: QItem, priority: Priority = Priority.Low)</td>
<td>this</td>
<td>注册一个Promise项到执行队列中</td>
</tr>
<tr>
<td>run</td>
<td>function</td>
<td>this</td>
<td>运行队列</td>
</tr>
<tr>
<td>getCur</td>
<td>function</td>
<td>QItem</td>
<td>获取当前正在执行中的队列项</td>
</tr>
</table>