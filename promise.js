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
    
    /**
     * @function #isPromiseLike 
     * @description 实现一个判断promise的方法
     * @param {function} value value可以是函数和对象
     * @returns {boolean} 判断是否为promise的结果
     */
    #isPromiseLike(value) {
        if(value !== null && (typeof value === 'function' ||  typeof value ==='object')) {
            return typeof value.then === 'function'
        }
        return false
    }

    #runMicroTask(fn) {
        setTimeout(fn, 0)
    }

    #runone(callback, resolve, reject) {
        this.#runMicroTask(() => {
            //对应回调不是函数的情况
            if (typeof callback !== 'function') {
                const settled = this.#state === FULFILLED ? resolve : reject
                settled(this.#result)
                return
            }
            //对应回调是函数的情况
            try {
                const data = callback(this.#result)
                if (this.#isPromiseLike(data)) {
                    data.then(resolve, reject)
                }
                else {
                    resolve(data)
                }
            }
            catch (err) {
                reject(err)
            }
        })
    }

    #run() {
        if (this.#state === PENDING) return //挂起就啥也别做
        while (this.#handlers.length) {
            const { onFulfilled, onRejected, resolve, reject } = this.#handlers.shift()
            if (this.#state === FULFILLED) {
                this.#runone(onFulfilled, resolve, reject)
            }
            else {
                this.#runone(onRejected, resolve, reject)
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
        reject(123)
    }, 1000)
})

p.then(
    null,
    (err) => {
        console.log('promise失败1', err)
        return 456
    }
).then((data) => {
    console.log('ok', data)
})



/**
 * 
 * handlers[]
 * 
 *               #run
 * 
 *  .then        #changeState
 */