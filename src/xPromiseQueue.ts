
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


/**
 * 执行项
 */
class QItem {
    constructor(fun: () => void) {
        this.run = () => {
            return new Promise((rs: any, rj: any) => {
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
     * 名称
     */
    name: string
    /**
     * 执行该队列项
     */
    run: () => Promise<any>
    private _resolve: () => void
    private _reject: () => void
    /**
     * resolve
     */
    resolve(): void {
        this._resolve.apply(this, arguments);
        this.pmsStatus = PromiseStatus.Fulfilled;
    }
    /**
     * reject
     */
    reject(): void {
        this._reject.apply(this, arguments);
        this.pmsStatus = PromiseStatus.Rejected;
    }
    /**
     * 该Promise状态
     */
    pmsStatus: PromiseStatus = PromiseStatus.Pending
    /**
     * 下一个执行项
     */
    next: QItem
}

/**
 * 模块主体
 */
class Queue {
    /**
     * 是否为监听中
     */
    isWatching: boolean = false
    /**
     * 待执行的Promise队列
     */
    private qList: Array<QItem> = []
    /**
     * 将当前队列中的每一项按实际执行顺序重新排列
     */
    private reSortQList(): void {
        let first = this.qList[0];
        if (!first) return;
        this.qList = [];
        let fun = (m: QItem) => {
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
    reg(item: QItem, priority: Priority = Priority.Low): this {

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
            } else {
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
    run(): this {
        if (this.isWatching) return this;
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
    getCur(): QItem {

        if (this.qList.length == 0) return null;

        let c: QItem;
        let fun = (m: QItem) => {
            if (m.pmsStatus == PromiseStatus.Pending) {
                c = m;
            } else {
                m.next && fun(m.next);
            }
        };
        fun(this.qList[0]);

        return c;
    }
}

export default { QItem, Queue };