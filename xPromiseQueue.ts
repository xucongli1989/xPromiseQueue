//declare var Promise:PromiseConstructor;

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
    name: string;
    run: () => Promise<any>;
    private _resolve: () => void;
    private _reject: () => void;
    resolve(): void {
        this._resolve.apply(this, arguments);
        this.pmsStatus = PromiseStatus.Fulfilled;
    };
    reject(): void {
        this._reject.apply(this, arguments);
        this.pmsStatus = PromiseStatus.Rejected;
    };
    pmsStatus: PromiseStatus = PromiseStatus.Pending;
    next: QItem;
}

enum PromiseStatus {
    Pending,
    Fulfilled,
    Rejected
}

enum Priority {
    Low,
    High
}

class lib {
    private isWatching: boolean=false;
    qList: Array<QItem> = [];
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
            this.qList=[item];
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
    };
    run(): this {
        this.isWatching = true;
        if (this.qList.length === 0) {
            return;
        }
        this.qList[0].run();
        return this;
    };
    getCur(): QItem {
        return this.qList.find(k => k.pmsStatus == PromiseStatus.Pending);
    }
}

//export default new lib();