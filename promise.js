const PENDING = 'pending'
const FULFILLED = 'fulfilled'
const REJECTED = 'rejected'

class MyPromise {

    /* 构造器 */
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

    /* then有两个任务，添加数组，执行run */
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

    /* 私有属性和私有方法 */
    #state = PENDING//#表示为私有属性，等同于在构造器里写this._state = 'pending'
    #result = undefined
    #handlers = []//用来存储 onFulfilled, onRejected, resolve, reject，为啥是数组呢，因为用户可能多次调用then

    /**
     * @function #changeState 
     * @description 改变状态的方法
     * @param {string} state state为目标状态
     * @param {*} result result为目标数据
     */
    #changeState(state, result) {//#表示为私有方法
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

    /**
     * @function #runMicroTask
     * @description 执行微队列
     * @param {function} fn 
     * @returns {boolean} 
     */
    #runMicroTask(fn) {
        //用process.nextTick模拟node环境微队列
        if(typeof process === 'object' && typeof process.next === 'function'){
            process.nextTick(fn)
        }
        //用MutationObserver模拟浏览器环境微队列
        else if(typeof MutationObserver === 'function'){
            const ob = new MutationObserver(fn)
            const textNode = document.createTextNode('1')
            ob.observe(textNode,{
                characterData:true
            })
            textNode.data = '2'
        }
        //除上面两种环境，只能用setTimeout了，因为微队列是环境给你的能力(node的事件循环,浏览器的事件循环)
        else{
            setTimeout(fn,0)
        }
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
}

/* 测试区域 */

setTimeout(()=>{
    console.log(1)
},0)

new MyPromise((resolve)=>{
    resolve(2)
}).then((data)=>{
    console.log(data)
})

console.log(3)

// FIXME: 在浏览器测试为321，在vscode测试为312

/**
 * 
 * handlers[]
 * 
 *               #run
 * 
 *  .then        #changeState
 */