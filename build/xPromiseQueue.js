/**
 * ******************************************************************************************
 * 开源协议：https://github.com/xucongli1989/xPromiseQueue/blob/master/LICENSE
 * 项目地址：https://github.com/xucongli1989/xPromiseQueue
 * 电子邮件：80213876@qq.com
 * By XCL 2017.08 in Shenzhen. China
 ********************************************************************************************
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * Promise状态
     */
    var PromiseStatus;
    (function (PromiseStatus) {
        PromiseStatus[PromiseStatus["None"] = 0] = "None";
        PromiseStatus[PromiseStatus["Pending"] = 1] = "Pending";
        PromiseStatus[PromiseStatus["Fulfilled"] = 2] = "Fulfilled";
        PromiseStatus[PromiseStatus["Rejected"] = 3] = "Rejected";
    })(PromiseStatus || (PromiseStatus = {}));
    /**
     * 优先级
     */
    var Priority;
    (function (Priority) {
        Priority[Priority["Low"] = 0] = "Low";
        Priority[Priority["High"] = 1] = "High";
        Priority[Priority["Highest"] = 2] = "Highest";
    })(Priority || (Priority = {}));
    class QueuePromiseContext {
        constructor() {
            this.init();
        }
        init() {
            this.queuePms = new Promise((r, j) => {
                this.resolve = r;
            });
        }
    }
    class QItemInitOptions {
    }
    /**
     * 执行项
     */
    class QItem {
        constructor(fun) {
            this._pmsStatus = PromiseStatus.None;
            /**
            * 初始化时的选项
            */
            this.initOptions = new QItemInitOptions();
            /**
            * 唯一标识
            */
            this.id = null;
            /**
             * 名称
             */
            this.name = null;
            /**
             * 下一个执行项
             */
            this.next = null;
            /**
            * 队列Promise上下文
            */
            this.queuePromiseContext = null;
            this.initOptions.initFun = fun;
        }
        /**
         * 执行该队列项
         */
        run() {
            if (this._pms) {
                return this._pms;
            }
            this._pmsStatus = PromiseStatus.Pending;
            this._pms = new Promise((rs, rj) => {
                this._resolve = rs;
                this._reject = rj;
                this.initOptions.initFun.call(this);
            }).then(() => {
                if (!this.next) {
                    return {};
                }
                return this.next.run();
            }, () => {
                this.next = null;
            }).catch(() => {
                this._pmsStatus = PromiseStatus.Rejected;
            }).then(() => {
                if (null == this.next) {
                    this.queuePromiseContext.resolve();
                }
            });
            return this._pms;
        }
        /**
         * resolve
         */
        resolve() {
            this._resolve.apply(this, arguments);
            this._pmsStatus = PromiseStatus.Fulfilled;
        }
        /**
         * reject
         */
        reject() {
            this._reject.apply(this, arguments);
            this._pmsStatus = PromiseStatus.Rejected;
        }
        /**
         * 获取该Promise状态
         */
        getPmsStatus() {
            return this._pmsStatus;
        }
        /**
         * 是否已完成（已解决或已拒绝）
         */
        isComplete() {
            return this._pmsStatus == PromiseStatus.Fulfilled || this._pmsStatus == PromiseStatus.Rejected;
        }
        /**
         * 是否在处理中（Pending）
         */
        isPending() {
            return this._pmsStatus == PromiseStatus.Pending;
        }
        /**
         * 是否已拒绝（Rejected）
         */
        isRejected() {
            return this._pmsStatus == PromiseStatus.Rejected;
        }
        /**
         * clone队列项
         */
        clone() {
            let q = new QItem(this.initOptions.initFun);
            q.destroyCallback = this.destroyCallback;
            q.id = this.id;
            q.initOptions = this.initOptions;
            q.name = this.name;
            q.next = this.next;
            q.queuePromiseContext = this.queuePromiseContext;
            return q;
        }
    }
    /**
     * 模块主体
     */
    class Queue {
        constructor() {
            this._promiseContext = new QueuePromiseContext();
            /**
             * 是否为监听中
             */
            this._isWatching = false;
            /**
             * 当前队列是否已锁定（true:不允许再注册新的执行项）
             */
            this._isLock = false;
            /**
             * 待执行的Promise队列
             */
            this._qList = [];
        }
        /**
         * 将当前队列中的每一项按实际执行顺序重新排列
         */
        _reSortQList() {
            let first = this._qList[0];
            if (!first)
                return;
            let start = null;
            this._qList = [];
            let fun = (m) => {
                if (!start && !m.isComplete()) {
                    start = m;
                }
                if (start) {
                    this._qList.push(m);
                }
                m.next && fun(m.next);
            };
            fun(first);
        }
        /**
         * 注册一个Promise项到执行队列中。
         * 如果当前队列未运行，则仅仅是将该项添加至队列中而已。
         * 如果当前队列处于运行中，则不仅仅是将该项添加到队列中，还会根据该项实际所在的位置来判断是否立刻运行此项。
         * @param item 执行项
         * @param priority 优先级（默认为低。【低】：添加到队列的末尾；【高】：添加到紧挨着当前正在执行的队列项的后面；【最高】：添加到当前正在执行的队列项的前面）
         */
        reg(item, priority = Priority.Low) {
            if (this._isLock) {
                return this;
            }
            item.queuePromiseContext = this._promiseContext;
            //#region 监听状态
            if (this._isWatching) {
                let cur = this.getCur();
                //队列全部执行完毕
                if (!cur) {
                    this._qList = [item];
                    this._isWatching = false;
                    this.run();
                    return this;
                }
                switch (priority) {
                    case Priority.High:
                        //高优先级
                        item.next = cur.next;
                        cur.next = item;
                        break;
                    case Priority.Highest:
                        //最高优先级
                        for (let i = 0; i < this._qList.length; i++) {
                            let m = this._qList[i];
                            if (m != cur) {
                                continue;
                            }
                            cur.destroyCallback && cur.destroyCallback();
                            item.next = cur.clone();
                            if (i == 0) {
                                //当前项为第一项
                                this._qList.splice(0, 0, item);
                                break;
                            }
                            else {
                                //当前项为中间项
                                this._qList[i - 1].next = item;
                            }
                        }
                        break;
                    default:
                        //低优先级
                        this._qList[this._qList.length - 1].next = item;
                        break;
                }
                //重排序
                this._reSortQList();
                return this;
            }
            //#endregion
            //#region 初始化状态
            if (this._qList.length == 0) {
                this._qList = [item];
                return this;
            }
            //高优先级
            if (priority == Priority.High || priority == Priority.Highest) {
                item.next = this._qList[0];
                this._qList.unshift(item);
                return this;
            }
            //低优先级
            this._qList[this._qList.length - 1].next = item;
            this._qList.push(item);
            //#endregion
            return this;
        }
        /**
         * 注册唯一的一个队列项。此方法会先销毁整个队列，再重新注册只有一个执行项的队列。注册完后，会锁定此队列。
         * @param item 队列项
         */
        regUnique(item) {
            this.clear();
            this.unLock();
            this.reg(item);
            this.lock();
            return this;
        }
        /**
         * 注册一个新的队列项到一个已有且未完成的队列项的后面
         * @param parent 已有的未完成的队列项
         * @param newItem 此次新加的队列项（parent执行完后，才会执行newItem）
         */
        regAfter(parent, newItem) {
            if (!parent || parent.isComplete() || !newItem) {
                return this;
            }
            newItem.next = parent.next;
            parent.next = newItem;
            this._reSortQList();
            return this;
        }
        /**
         * 注册一个新的队列项到一个已有且未完成的队列项的前面
         * @param lastItem 已有的未完成的队列项
         * @param newItem 此次新加的队列项（newItem执行完后，才会执行lastItem）
         */
        regBefore(lastItem, newItem) {
            if (!lastItem || lastItem.isComplete() || !newItem) {
                return this;
            }
            //lastItem是当前项或第一项
            if (lastItem == this.getCur() || this._qList[0] == lastItem) {
                this.reg(newItem, Priority.Highest);
                return this;
            }
            //lastItem非当前项，也非第一项
            for (let i = 0; i < this._qList.length; i++) {
                let m = this._qList[i];
                if (m.next != lastItem) {
                    continue;
                }
                newItem.next = lastItem;
                m.next = newItem;
            }
            this._reSortQList();
            return this;
        }
        /**
         * 运行队列
         */
        run() {
            if (this._isWatching)
                return this;
            this._isWatching = true;
            if (this._qList.length === 0) {
                return this;
            }
            this._qList[0].run();
            return this;
        }
        /**
         * 获取当前正在执行中的队列项（运行时，队列中第一个状态为Pending的项）
         */
        getCur() {
            if (!this._isWatching) {
                return null;
            }
            if (this._qList.length == 0)
                return null;
            let c;
            let fun = (m) => {
                if (m.isPending()) {
                    c = m;
                }
                else {
                    m.next && fun(m.next);
                }
            };
            fun(this._qList[0]);
            return c;
        }
        /**
         * 锁定队列，不允许再注册新项
         */
        lock() {
            this._isLock = true;
            return this;
        }
        /**
         * 解锁队列，允许注册新项
         */
        unLock() {
            this._isLock = false;
            return this;
        }
        /**
         * 销毁指定队列项
         * 此方法不会去调用该项的解决或拒绝，直接从队列中删除此项
         * @param item 要销毁的队列项
         */
        destroy(item) {
            if (null == item || item.isComplete()) {
                return this;
            }
            let cur = this.getCur();
            for (let i = 0; i < this._qList.length; i++) {
                if (this._qList[i] != item) {
                    continue;
                }
                if (i == 0) {
                    //第一项
                    this._qList.shift();
                }
                else if (i == this._qList.length - 1) {
                    //最后一项
                    this._qList[i - 1].next = null;
                }
                else {
                    //中间项
                    this._qList[i - 1].next = item.next;
                }
                if (this.isWatching) {
                    if (cur === item) {
                        //销毁的正是当前项
                        item.destroyCallback && item.destroyCallback();
                        item.next && item.next.run();
                    }
                }
                this._reSortQList();
                break;
            }
            return this;
        }
        /**
         * 销毁整个队列
         */
        clear() {
            let cur = this.getCur();
            if (cur) {
                cur.next = null;
                this._qList = [cur];
                this.destroy(cur);
            }
            else {
                this._qList = [];
            }
            return this;
        }
        /**
         * 判断当前时刻队列是否已全部运行完
         */
        isComplete() {
            if (this._qList.length == 0) {
                return true;
            }
            let isDone = true;
            for (let m of this._qList) {
                if (m.isRejected()) {
                    break;
                }
                if (!m.isComplete()) {
                    isDone = false;
                    break;
                }
            }
            return isDone;
        }
        /**
         * 是否为监听中
         */
        isWatching() {
            return this._isWatching;
        }
        /**
         * 获取当前时刻表示整个队列是否完成的Promise对象
         */
        getCurPms() {
            this._promiseContext.init();
            if (this.isComplete()) {
                this._promiseContext.resolve();
            }
            return this._promiseContext.queuePms;
        }
        /**
         * 根据队列项的id查找队列项
         * @param id 队列项的id
         */
        getQItemById(id) {
            if (!id) {
                return null;
            }
            for (let m of this._qList) {
                if (m.id == id) {
                    return m;
                }
            }
            return null;
        }
    }
    exports.default = { QItem, Queue };
});
//# sourceMappingURL=xPromiseQueue.js.map