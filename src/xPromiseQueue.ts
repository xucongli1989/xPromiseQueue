
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
    private isWatching: boolean = false
    /**
     * 待执行的Promise队列
     */
    qList: Array<QItem> = []
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
                this.run();
                return this;
            }

            //高优先级
            if (priority == Priority.High) {
                item.next = cur.next;
                cur.next = item;
                return this;
            }

            //低优先级
            this.qList[this.qList.length - 1].next = item;

            return this;
        }
        //#endregion

        //#region 初始化状态
        if (!this.qList || this.qList.length == 0) {
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
        this.isWatching = true;
        if (this.qList.length === 0) {
            return;
        }
        this.qList[0].run();
        return this;
    }
    /**
     * 获取当前正在执行中的队列项
     */
    getCur(): QItem {
        return this.qList.find(k => k.pmsStatus == PromiseStatus.Pending);
    }
}

export default { QItem, Queue };