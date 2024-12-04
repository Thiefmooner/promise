const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {
    /** 私有属性和私有方法 */
    #state = PENDING//#私有属性，等同于在构造器里写this._state = 'pending'
    #result = undefined
    #handlers = []//用来存储 onFulfilled, onRejected, resolve, reject，为啥是数组呢，因为用户可能多次调用then

    #changeState(state, result) {//#私有方法
        if (this.#state !== PENDING) return //防止promise执行两次
        this.#state = state
        this.#result = result
        this.#run()
    }
    #run() {
        if (this.#state === PENDING) return //挂起就啥也别做
        while (this.#handlers.length) {
            const { onFulfilled, onRejected, resolve, reject } = this.#handlers.shift()
            if (this.#state === FULFILLED) {
                if (typeof onFulfilled === 'function') {//检察then的第一个参数是不是函数
                    onFulfilled(this.#result)
                }
                else {
                    resolve(this.#result)//如果回调不是函数
                }
            }
            else {
                if (typeof onRejected === 'function') {//检察then的第一个参数是不是函数
                    onRejected(this.#result)
                }
                else {
                    reject(this.#result)//如果回调不是函数
                }
            }
        }
    }
    //then有两个任务，添加数组，执行run
    then(onFulfilled, onRejected) {
        return new MyPromise((resolve, reject) => {
            this.#handlers.push({
                onFulfilled,
                onRejected,
                resolve,
                reject
            })
            this.#run()
        })

    }
    /**构造器 */
    constructor(executor) {
        const resolve = (data) => {
            this.#changeState(FULFILLED, data)
        }
        const reject = (reason) => {
            this.#changeState(REJECTED, reason)
        }
        //异常放在try-catch里面捕获，就直接用reject处理他
        try {
            executor(resolve, reject)//只能捕获同步任务的错误，异步任务的错误捕获不到（官方问题）
        }
        catch (err) {
            reject(err)
        }
    }
}


const p = new MyPromise((resolve, reject) => {
    setTimeout(() => {
        reject(1234)
    }, 1000)
})

p.then(
    (res) => {
        console.log('promise完成1', res)
    },
    (err) => {
        console.log('promise失败1', err)
    }
)

p.then(
    (res) => {
        console.log('promise完成2', res)
    },
    (err) => {
        console.log('promise失败2', err)
    }
)

p.then(
    (res) => {
        console.log('promise完成3', res)
    },
    (err) => {
        console.log('promise失败3', err)
    }
)

p.then(
    (res) => {
        console.log('promise完成4', res)
    },
    (err) => {
        console.log('promise失败4', err)
    }
)


/**
 * 
 * handlers[]
 * 
 *               #run
 * 
 *  .then        #changeState
 */