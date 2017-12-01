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
        PromiseStatus[PromiseStatus["Pending"] = 0] = "Pending";
        PromiseStatus[PromiseStatus["Fulfilled"] = 1] = "Fulfilled";
        PromiseStatus[PromiseStatus["Rejected"] = 2] = "Rejected";
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
            /**
             * 该Promise状态
             */
            this.pmsStatus = PromiseStatus.Pending;
            this.run = () => {
                return new Promise((rs, rj) => {
                    this._resolve = rs;
                    this._reject = rj;
                    fun.call(this);
                }).then(() => {
                    if (!this.next) {
                        return {};
                    }
                    return this.next.run();
                }).catch(() => {
                    this.pmsStatus = PromiseStatus.Rejected;
                });
            };
        }
        /**
         * resolve
         */
        resolve() {
            this._resolve.apply(this, arguments);
            this.pmsStatus = PromiseStatus.Fulfilled;
        }
        /**
         * reject
         */
        reject() {
            this._reject.apply(this, arguments);
            this.pmsStatus = PromiseStatus.Rejected;
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
            this.isWatching = false;
            /**
             * 待执行的Promise队列
             */
            this.qList = [];
        }
        /**
         * 将当前队列中的每一项按实际执行顺序重新排列
         */
        reSortQList() {
            let first = this.qList[0];
            if (!first)
                return;
            this.qList = [];
            let fun = (m) => {
                this.qList.push(m);
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
            //#region 监听状态
            if (this.isWatching) {
                let cur = this.getCur();
                //队列全部执行完毕
                if (!cur) {
                    this.qList = [item];
                    this.isWatching = false;
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
                    this.qList[this.qList.length - 1].next = item;
                }
                //重排序
                this.reSortQList();
                return this;
            }
            //#endregion
            //#region 初始化状态
            if (this.qList.length == 0) {
                this.qList = [item];
                return this;
            }
            //高优先级
            if (priority == Priority.High) {
                item.next = this.qList[0];
                this.qList.unshift(item);
                return this;
            }
            //低优先级
            this.qList[this.qList.length - 1].next = item;
            this.qList.push(item);
            //#endregion
            return this;
        }
        /**
         * 运行队列
         */
        run() {
            if (this.isWatching)
                return this;
            this.isWatching = true;
            if (this.qList.length === 0) {
                return this;
            }
            this.qList[0].run();
            return this;
        }
        /**
         * 获取当前正在执行中的队列项
         */
        getCur() {
            if (this.qList.length == 0)
                return null;
            let c;
            let fun = (m) => {
                if (m.pmsStatus == PromiseStatus.Pending) {
                    c = m;
                }
                else {
                    m.next && fun(m.next);
                }
            };
            fun(this.qList[0]);
            return c;
        }
        /**
         * 销毁指定队列项
         * 此方法不会去调用该项的解决或拒绝，直接从队列中删除此项
         * @param item 要删除的项
         * @param callback 删除后的回调函数
         */
        destroy(item, callback) {
            if (null == item) {
                return;
            }
            for (let i = 0; i < this.qList.length; i++) {
                let m = this.qList[i];
                if (m != item) {
                    continue;
                }
                if (i == 0) {
                    //第一项
                    this.qList.shift();
                    if (this.isWatching && this.qList[0]) {
                        this.qList[0].run();
                    }
                }
                else if (i == this.qList.length - 1) {
                    //最后一项
                    this.qList[this.qList.length - 2].next = null;
                }
                else {
                    //中间项
                    this.qList[i - 1].next = this.qList[i + 1];
                }
                this.reSortQList();
                callback && callback();
                break;
            }
        }
    }
    exports.default = { QItem, Queue };
});
//# sourceMappingURL=xPromiseQueue.js.map