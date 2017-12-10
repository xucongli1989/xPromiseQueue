/**
 * ******************************************************************************************
 * 开源协议：https://github.com/xucongli1989/xPromiseQueue/blob/master/LICENSE
 * 项目地址：https://github.com/xucongli1989/xPromiseQueue
 * 电子邮件：80213876@qq.com
 * By XCL 2017.08 in Shenzhen. China
 ********************************************************************************************
 */

/**
 * Promise状态
 */
enum PromiseStatus {
    None,
    Pending,
    Fulfilled,
    Rejected
}

/**
 * 优先级
 */
enum Priority {
    Low,
    High
}

class QueuePromiseContext {
    constructor() {
        this.init();
    }
    queuePms: Promise<any>
    resolve: () => void
    init(): void {
        this.queuePms = new Promise((r, j) => {
            this.resolve = r;
        });
    }
}

/**
 * 执行项
 */
class QItem {
    /**
     * 初始函数
     */
    private _initFun: () => void
    private _resolve: () => void
    private _reject: () => void
    private _pms: Promise<any>
    private _pmsStatus: PromiseStatus = PromiseStatus.None

    constructor(fun: () => void) {
        this._initFun = fun;
    }
    /**
     * 名称
     */
    name: string = null

    /**
     * 下一个执行项
     */
    next: QItem = null

    /**
    * 队列Promise上下文
    */
    queuePromiseContext: QueuePromiseContext = null

    /**
     * 执行该队列项
     */
    run(): Promise<any> {
        if (this._pms) {
            return this._pms;
        }
        this._pmsStatus = PromiseStatus.Pending;
        this._pms = new Promise((rs: any, rj: any) => {
            this._resolve = rs;
            this._reject = rj;
            this._initFun.call(this);
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
    resolve(): void {
        this._resolve.apply(this, arguments);
        this._pmsStatus = PromiseStatus.Fulfilled;
    }
    /**
     * reject
     */
    reject(): void {
        this._reject.apply(this, arguments);
        this._pmsStatus = PromiseStatus.Rejected;
    }
    /**
     * 获取该Promise状态
     */
    getPmsStatus(): PromiseStatus {
        return this._pmsStatus;
    }
    /**
     * 从队列中销毁后需要执行的函数
     */
    destroyCallback: () => void
    /**
     * 是否已完成（已解决或已拒绝）
     */
    isComplete(): boolean {
        return this._pmsStatus == PromiseStatus.Fulfilled || this._pmsStatus == PromiseStatus.Rejected;
    }
    /**
     * 是否在处理中（Pending）
     */
    isPending(): boolean {
        return this._pmsStatus == PromiseStatus.Pending;
    }
    /**
     * 是否已拒绝（Rejected）
     */
    isRejected(): boolean {
        return this._pmsStatus == PromiseStatus.Rejected;
    }
}

/**
 * 模块主体
 */
class Queue {
    private _promiseContext: QueuePromiseContext = new QueuePromiseContext()
    /**
     * 是否为监听中
     */
    private _isWatching: boolean = false
    /**
     * 当前队列是否已锁定（true:不允许再注册新的执行项）
     */
    private _isLock: boolean = false
    /**
     * 待执行的Promise队列
     */
    private _qList: Array<QItem> = []
    /**
     * 将当前队列中的每一项按实际执行顺序重新排列
     */
    private _reSortQList(): void {
        let first = this._qList[0];
        if (!first) return;
        let start: QItem = null;
        this._qList = [];
        let fun = (m: QItem) => {
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
    reg(item: QItem, priority: Priority = Priority.Low): Queue {
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

            //高优先级
            if (priority == Priority.High) {
                item.next = cur.next;
                cur.next = item;
            } else {
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
    regUnique(item: QItem): Queue {
        this.clear();
        this.unLock();
        this.reg(item);
        this.lock();
        return this;
    }
    /**
     * 运行队列
     */
    run(): Queue {
        if (this._isWatching) return this;
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
    getCur(): QItem {
        if (!this._isWatching) {
            return null;
        }

        if (this._qList.length == 0) return null;

        let c: QItem;
        let fun = (m: QItem) => {
            if (m.isPending()) {
                c = m;
            } else {
                m.next && fun(m.next);
            }
        };
        fun(this._qList[0]);

        return c;
    }
    /**
     * 锁定队列，不允许再注册新项
     */
    lock(): Queue {
        this._isLock = true;
        return this;
    }
    /**
     * 解锁队列，允许注册新项
     */
    unLock(): Queue {
        this._isLock = false;
        return this;
    }
    /**
     * 销毁指定队列项
     * 此方法不会去调用该项的解决或拒绝，直接从队列中删除此项
     * @param item 要销毁的队列项
     */
    destroy(item: QItem): Queue {
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
            } else if (i == this._qList.length - 1) {
                //最后一项
                this._qList[i - 1].next = null;
            } else {
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
    clear(): Queue {
        let cur = this.getCur();
        if (cur) {
            cur.next = null;
            this._qList = [cur];
            this.destroy(cur);
        } else {
            this._qList = [];
        }
        return this;
    }
    /**
     * 判断当前时刻队列是否已全部运行完
     */
    isComplete(): boolean {
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
    isWatching(): boolean {
        return this._isWatching;
    }
    /**
     * 获取当前时刻表示整个队列是否完成的Promise对象
     */
    getCurPms(): Promise<any> {
        this._promiseContext.init();
        if (this.isComplete()) {
            this._promiseContext.resolve();
        }
        return this._promiseContext.queuePms;
    }
}

export default { QItem, Queue };