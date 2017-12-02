## 简介

这是一个Promise的执行队列模块，里面的每一个Promise都是按顺序执行的，您也可以指定一定的优先级来决定队列的执行顺序。

## 使用场景

- 需要按顺序来运行某一组任务，比如：当A处理后才能执行B，B处理后才能执行C...
- 示例场景：当一个页面的交互很复杂时，某些业务逻辑可能会不定时地向页面发出多个非阻塞式的弹窗消息，为避免多个弹窗同时展现在页面上，可以采用此模块来顺序执行弹窗逻辑，只有当前面的弹窗处理完毕后，才会处理后面的弹窗逻辑。

## 如何使用

- 可自行打包
- 参见./Build/中的文件

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
<td>name</td>
<td>string</td>
<td>null</td>
<td></td>
<td>名称</td>
</tr>
<tr>
<td>pmsStatus</td>
<td>enum</td>
<td>PromiseStatus.None</td>
<td></td>
<td>该Promise状态</td>
</tr>
<tr>
<td>next</td>
<td>QItem</td>
<td>null</td>
<td></td>
<td>下一个执行项</td>
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
<td>destroyCallback</td>
<td>function</td>
<td></td>
<td>void</td>
<td>销毁后的回调函数</td>
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
<td>isWatching</td>
<td>boolean</td>
<td>false</td>
<td></td>
<td>是否为监听中（也就是是否调用了该对象的run），默认为false</td>
</tr>
<tr>
<td>reg</td>
<td>function</td>
<td></td>
<td>this</td>
<td>注册一个Promise项到执行队列中。`priority`为优先级，0为低优先级（默认），1为高优先级。当指定高优先级时，则当前Promise执行完后就立即开始执行该任务。</td>
</tr>
<tr>
<td>regUnique</td>
<td>function</td>
<td></td>
<td>void</td>
<td>注册唯一的一个队列项。此方法会先销毁整个队列，再重新注册只有一个执行项的队列。注册完后，会锁定此队列。</td>
</tr>
<tr>
<td>run</td>
<td>function</td>
<td></td>
<td>this</td>
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
<td>void</td>
<td>锁定队列</td>
</tr>
<tr>
<td>unLock</td>
<td>function</td>
<td></td>
<td>void</td>
<td>解锁队列</td>
</tr>
<tr>
<td>destroy</td>
<td>function</td>
<td></td>
<td>void</td>
<td>销毁指定队列项（此方法不会去调用该项的解决或拒绝，直接从队列中删除此项）</td>
</tr>
<tr>
<td>clear</td>
<td>function</td>
<td></td>
<td>void</td>
<td>销毁整个队列</td>
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

![](https://raw.githubusercontent.com/xucongli1989/xPromiseQueue/master/demo/img.gif)