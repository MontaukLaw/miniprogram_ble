function count(str) {
  console.log(str)
}

//转化成小程序模板语言 这一步非常重要 不然无法正确调用
module.exports = {
  count: count
}
