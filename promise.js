class fake_promise {
    /* 定义三种promise状态 */
    static PENDING = 'pending'
    static FULLFILLED = 'fullfilled'
    static REJECTED = 'rejected'

    /* promise的构造函数 */
    constructor (fun) {
        this.status = fake_promise.PENDING //指定promise的默认状态
        this.res = null //指定promise的默认结果为null，因为还没操作
        this.resolveCallBackArr = []
        this.rejectCallBackArr = []
        
        try{
            fun(this.resolve.bind(this),this.reject.bind(this)) //bind绑定this是为了让其用的时候永远指向fake_promise实例
        }
        catch(err){
            this.reject(err) //这里是防止实例化fake_promise时候，直接throw一个erro设计的
        }
    }

    /* 定义promise的resolve，以及resolve执行了什么 */
    resolve(res){
        setTimeout(()=>{
            if(this.status === fake_promise.PENDING){
                this.status = fake_promise.FULLFILLED
                this.res = res
                this.resolveCallBackArr.forEach(callback => {
                    callback(res)
                })
            }
        })
    }
    
    /* 定义promise的reject，以及reject执行了什么 */
    reject(res){
        setTimeout(()=>{
            if(this.status === fake_promise.PENDING){
                this.status = fake_promise.REJECTED
                this.res = res
                this.rejectCallBackArr.forEach(callback => {
                    callback(res)
                })
            }
        })
    }

    /* 定义promise的then */
    then(onFULLFILLED,onREJECTED){
        return new fake_promise((resolve,reject)=>{//promise要支持链式调用，所有then直接返回一个promise对象
            onFULLFILLED = typeof onFULLFILLED === 'function' ? onFULLFILLED : ()=>{} //确保then的两个参数是函数
            onREJECTED = typeof onREJECTED === 'function' ? onREJECTED : ()=>{} //确保then的两个参数是函数
            if(this.status === fake_promise.PENDING){
                this.resolveCallBackArr.push(onFULLFILLED)
                this.rejectCallBackArr.push(onREJECTED)
            }
            if(this.status === fake_promise.FULLFILLED){
                setTimeout(()=>{
                    onFULLFILLED(this.res)
                })
            }
            if(this.status === fake_promise.REJECTED){
                setTimeout(()=>{
                    onREJECTED(this.res)
                })
            }
        })
    }
}




/**TEST**/
const pr = new fake_promise((resolve,reject)=>{
    resolve('111')
})
pr.then(res=>{console.log(res)})