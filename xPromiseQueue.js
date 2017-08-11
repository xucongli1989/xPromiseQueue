//declare var Promise:PromiseConstructor;
class QItem {
    constructor(fun) {
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
    resolve() {
        this._resolve.apply(this, arguments);
        this.pmsStatus = PromiseStatus.Fulfilled;
    }
    ;
    reject() {
        this._reject.apply(this, arguments);
        this.pmsStatus = PromiseStatus.Rejected;
    }
    ;
}
var PromiseStatus;
(function (PromiseStatus) {
    PromiseStatus[PromiseStatus["Pending"] = 0] = "Pending";
    PromiseStatus[PromiseStatus["Fulfilled"] = 1] = "Fulfilled";
    PromiseStatus[PromiseStatus["Rejected"] = 2] = "Rejected";
})(PromiseStatus || (PromiseStatus = {}));
var Priority;
(function (Priority) {
    Priority[Priority["Low"] = 0] = "Low";
    Priority[Priority["High"] = 1] = "High";
})(Priority || (Priority = {}));
class lib {
    constructor() {
        this.isWatching = false;
        this.qList = [];
    }
    reg(item, priority = Priority.Low) {
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
    ;
    run() {
        this.isWatching = true;
        if (this.qList.length === 0) {
            return;
        }
        this.qList[0].run();
        return this;
    }
    ;
    getCur() {
        return this.qList.find(k => k.pmsStatus == PromiseStatus.Pending);
    }
}
//export default new lib(); 
