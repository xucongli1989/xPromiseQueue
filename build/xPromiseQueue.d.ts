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
export declare enum PromiseStatus {
    None = "none",
    Pending = "pending",
    Fulfilled = "fulfilled",
    Rejected = "rejected",
}
/**
 * 优先级
 */
export declare enum Priority {
    Low = "low",
    High = "high",
    Highest = "highest",
}
export declare class QueuePromiseContext {
    constructor();
    queuePms: Promise<any>;
    resolve: () => void;
    init(): void;
}
/**
 * 执行项
 */
export declare class QItem {
    /**
     * 初始函数
     */
    private _resolve;
    private _reject;
    private _pms;
    private _pmsStatus;
    constructor(fun: () => void);
    /**
    * 初始化时的选项
    */
    private initOptions;
    /**
    * 唯一标识
    */
    id: string;
    /**
     * 名称
     */
    name: string;
    /**
     * 下一个执行项
     */
    next: QItem;
    /**
    * 队列Promise上下文
    */
    queuePromiseContext: QueuePromiseContext;
    /**
     * 执行该队列项
     */
    run(): Promise<any>;
    /**
     * resolve
     */
    resolve(): void;
    /**
     * reject
     */
    reject(): void;
    /**
     * 获取该Promise状态
     */
    getPmsStatus(): PromiseStatus;
    /**
     * 从队列中销毁后需要执行的函数
     */
    destroyCallback: () => void;
    /**
     * 是否已完成（已解决或已拒绝）
     */
    isComplete(): boolean;
    /**
     * 是否在处理中（Pending）
     */
    isPending(): boolean;
    /**
     * 是否已拒绝（Rejected）
     */
    isRejected(): boolean;
    /**
     * clone队列项
     */
    clone(): QItem;
}
/**
 * 模块主体
 */
export declare class Queue {
    private _promiseContext;
    /**
     * 是否为监听中
     */
    private _isWatching;
    /**
     * 当前队列是否已锁定（true:不允许再注册新的执行项）
     */
    private _isLock;
    /**
     * 待执行的Promise队列
     */
    private _qList;
    /**
     * 将当前队列中的每一项按实际执行顺序重新排列
     */
    private _reSortQList();
    /**
     * 注册一个Promise项到执行队列中。
     * 如果当前队列未运行，则仅仅是将该项添加至队列中而已。
     * 如果当前队列处于运行中，则不仅仅是将该项添加到队列中，还会根据该项实际所在的位置来判断是否立刻运行此项。
     * @param item 执行项
     * @param priority 优先级（默认为低。【低】：添加到队列的末尾；【高】：添加到紧挨着当前正在执行的队列项的后面；【最高】：添加到当前正在执行的队列项的前面）
     */
    reg(item: QItem, priority?: Priority): Queue;
    /**
     * 注册唯一的一个队列项。此方法会先销毁整个队列，再重新注册只有一个执行项的队列。注册完后，会锁定此队列。
     * @param item 队列项
     * @param isForce 是否绕过队列锁定并强制注册（默认为true）
     */
    regUnique(item: QItem, isForce?: Boolean): Queue;
    /**
     * 注册一个新的队列项到一个已有且未完成的队列项的后面
     * @param parent 已有的未完成的队列项
     * @param newItem 此次新加的队列项（parent执行完后，才会执行newItem）
     */
    regAfter(parent: QItem, newItem: QItem): Queue;
    /**
     * 注册一个新的队列项到一个已有且未完成的队列项的前面
     * @param lastItem 已有的未完成的队列项
     * @param newItem 此次新加的队列项（newItem执行完后，才会执行lastItem）
     */
    regBefore(lastItem: QItem, newItem: QItem): Queue;
    /**
     * 运行队列
     */
    run(): Queue;
    /**
     * 获取当前正在执行中的队列项（运行时，队列中第一个状态为Pending的项）
     */
    getCur(): QItem;
    /**
     * 锁定队列，不允许再修改队列
     */
    lock(): Queue;
    /**
     * 解锁队列，允许修改队列
     */
    unLock(): Queue;
    /**
     * 销毁指定队列项
     * 此方法不会去调用该项的解决或拒绝，直接从队列中删除此项
     * @param item 要销毁的队列项
     */
    destroy(item: QItem): Queue;
    /**
     * 销毁整个队列
     */
    clear(): Queue;
    /**
     * 判断当前时刻队列是否已全部运行完
     */
    isComplete(): boolean;
    /**
     * 是否为监听中
     */
    isWatching(): boolean;
    /**
     * 获取当前时刻表示整个队列是否完成的Promise对象
     */
    getCurPms(): Promise<any>;
    /**
     * 根据队列项的id查找队列项
     * @param id 队列项的id
     */
    getQItemById(id: string): QItem;
}
