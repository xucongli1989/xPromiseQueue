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
    })(Priority || (Priority = {}));
    /**
     * 执行项
     */
    class QItem {
        constructor(fun) {
            this._pmsStatus = PromiseStatus.None;
            /**
             * 名称
             */
            this.name = null;
            /**
             * 下一个执行项
             */
            this.next = null;
            this._initFun = fun;
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
                this._initFun.call(this);
            }).then(() => {
                if (!this.next) {
                    return {};
                }
                return this.next.run();
            }).catch(() => {
                this._pmsStatus = PromiseStatus.Rejected;
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
    }
    /**
     * 模块主体
     */
    class Queue {
        constructor() {
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
         * 注册一个Promise项到执行队列中
         * @param item 执行项
         * @param priority 优先级（默认为低）
         */
        reg(item, priority = Priority.Low) {
            if (this._isLock) {
                return this;
            }
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
                //高优先级
                if (priority == Priority.High) {
                    item.next = cur.next;
                    cur.next = item;
                }
                else {
                    //低优先级
                    this._qList[this._qList.length - 1].next = item;
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
            if (priority == Priority.High) {
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
            return this._qList[this._qList.length - 1].isComplete();
        }
        /**
         * 是否为监听中
         */
        isWatching() {
            return this._isWatching;
        }
    }
    exports.default = { QItem, Queue };
});
//# sourceMappingURL=xPromiseQueue.js.map