## 简介

这是一个Promise的执行队列模块，里面的每一个Promise都是按顺序执行的，您也可以指定一定的优先级来决定队列的执行顺序。

## 使用场景

- 需要按顺序来运行某一组任务，比如：当A处理后才能执行B，B处理后才能执行C...
- 示例场景：当一个页面的交互很复杂时，某些业务逻辑可能会不定时地向页面发出多个非阻塞式的弹窗消息，为避免多个弹窗同时展现在页面上，可以采用此模块来顺序执行弹窗逻辑，只有当前面的弹窗处理完毕后，才会处理后面的弹窗逻辑。

## 如何使用

- 可自行打包
- 参见./Build/中的文件
- npm:[https://www.npmjs.com/package/xpromisequeue](https://www.npmjs.com/package/xpromisequeue)

## 流程

![](https://raw.githubusercontent.com/xucongli1989/xPromiseQueue/master/workflow.jpg)

## API

公开的模块内容为`export default { QItem, Queue }`,其中`QItem`是队列中的执行项，`Queue`是队列。

`QItem`:

<table>
<tr>
<th>属性或方法</th>
<th>类型</th>
<th>默认值</th>
<th>返回值</th>
<th>说明</th>
</tr>
<tr>
<td>initOptions</td>
<td>QItemInitOptions</td>
<td>new QItemInitOptions()</td>
<td></td>
<td>初始化时的选项</td>
</tr>
<tr>
<td>id</td>
<td>string</td>
<td>null</td>
<td></td>
<td>唯一标识</td>
</tr>
<tr>
<td>name</td>
<td>string</td>
<td>null</td>
<td></td>
<td>名称</td>
</tr>
<tr>
<td>next</td>
<td>QItem</td>
<td>null</td>
<td></td>
<td>下一个执行项</td>
</tr>
<tr>
<td>queuePromiseContext</td>
<td>QueuePromiseContext</td>
<td>null</td>
<td></td>
<td>队列Promise上下文</td>
</tr>
<tr>
<td>run</td>
<td>function</td>
<td></td>
<td>Promise</td>
<td>执行该队列项</td>
</tr>
<tr>
<td>resolve</td>
<td>function</td>
<td></td>
<td>void</td>
<td>解决一个Promise</td>
</tr>
<tr>
<td>reject</td>
<td>function</td>
<td></td>
<td>void</td>
<td>拒绝一个Promise</td>
</tr>
<tr>
<td>getPmsStatus</td>
<td>function</td>
<td></td>
<td>PromiseStatus</td>
<td>获取该Promise状态</td>
</tr>
<tr>
<td>destroyCallback</td>
<td>function</td>
<td></td>
<td>void</td>
<td>销毁后的回调函数</td>
</tr>
<tr>
<td>isComplete</td>
<td>function</td>
<td></td>
<td>boolean</td>
<td>是否已完成（已解决或已拒绝）</td>
</tr>
<tr>
<td>isPending</td>
<td>function</td>
<td></td>
<td>boolean</td>
<td>是否在处理中（Pending）</td>
</tr>
<tr>
<td>isRejected</td>
<td>function</td>
<td></td>
<td>boolean</td>
<td>是否已拒绝（Rejected）</td>
</tr>
<tr>
<td>clone</td>
<td>function</td>
<td></td>
<td>QItem</td>
<td>clone队列项</td>
</tr>
</table>


`Queue`:

<table>
<tr>
<th>属性或方法</th>
<th>类型</th>
<th>默认值</th>
<th>返回值</th>
<th>说明</th>
</tr>
<tr>
<td>reg</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>
注册一个Promise项到执行队列中。
如果当前队列未运行，则仅仅是将该项添加至队列中而已。
如果当前队列处于运行中，则不仅仅是将该项添加到队列中，还会根据该项实际所在的位置来判断是否立刻运行此项。
优先级（默认为低。【低】：添加到队列的末尾；【高】：添加到紧挨着当前正在执行的队列项的后面；【最高】：添加到当前正在执行的队列项的前面）
</td>
</tr>
<tr>
<td>regUnique</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>注册唯一的一个队列项。此方法会先销毁整个队列，再重新注册只有一个执行项的队列。注册完后，会锁定此队列。</td>
</tr>
<tr>
<tr>
<td>regAfter</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>注册一个新的队列项到一个已有且未完成的队列项的后面</td>
</tr>
<tr>
<tr>
<td>regBefore</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>注册一个新的队列项到一个已有且未完成的队列项的前面</td>
</tr>
<tr>
<td>run</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>运行队列</td>
</tr>
<tr>
<td>getCur</td>
<td>function</td>
<td></td>
<td>QItem</td>
<td>获取当前正在执行中的队列项（运行时，队列中第一个状态为Pending的项）</td>
</tr>
<tr>
<td>lock</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>锁定队列，不允许再修改队列</td>
</tr>
<tr>
<td>unLock</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>解锁队列，允许修改队列</td>
</tr>
<tr>
<td>destroy</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>销毁指定队列项（此方法不会去调用该项的解决或拒绝，直接从队列中删除此项）</td>
</tr>
<tr>
<td>clear</td>
<td>function</td>
<td></td>
<td>Queue</td>
<td>销毁整个队列</td>
</tr>
<tr>
<td>isComplete</td>
<td>function</td>
<td></td>
<td>boolean</td>
<td>判断当前时刻队列是否已全部运行完</td>
</tr>
<tr>
<td>isWatching</td>
<td>function</td>
<td></td>
<td>boolean</td>
<td>是否为监听中（也就是是否调用了该对象的run）</td>
</tr>
<tr>
<td>getCurPms</td>
<td>function</td>
<td></td>
<td>Promise</td>
<td>获取当前时刻表示整个队列是否完成的Promise对象</td>
</tr>
<tr>
<td>getQItemById</td>
<td>function</td>
<td></td>
<td>QItem</td>
<td>根据队列项的id查找队列项</td>
</tr>
</table>

## 简单使用

	//先注册队列后，再统一执行
    new Queue().reg(new QItem(function(){
		setTimeout(()=>{
			console.log('test 1...');
			this.resolve();
		},2000);
	})).reg(new QItem(function(){
		setTimeout(()=>{
			console.log('test 2...');
			this.resolve();
		},3000);
	})).run();

	//test 1...
	//test 2...


	//先执行，再动态注册
    new Queue().run().reg(new QItem(function(){
		setTimeout(()=>{
			console.log('test 1...');
			this.resolve();
		},2000);
	})).reg(new QItem(function(){
		setTimeout(()=>{
			console.log('test 2...');
			this.resolve();
		},3000);
	}));

	//test 1...
	//test 2...


## Demo预览图

具体示例代码请参见：`demo/index.html`

![](https://raw.githubusercontent.com/xucongli1989/xPromiseQueue/master/demo/img.gif)