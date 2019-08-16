//加载模块
var express = require('express');
var app = express();

//设置模板后缀为html
app.engine('.html',require('ejs').__express);
app.set('view engine','html');
app.set('views','./view');

//加载表单模块
var formidable = require('formidable');		//导入组件
var form = new formidable.IncomingForm();  	//实例化
form.encoding = 'utf-8';					//设置字符串
form.uploadDir = "./uploading";  				//设置文件保存目录
form.keepExtensions = true;					//保留文件后缀
form.maxFileSize = 20 * 1024 * 1024;  		//设置文件大小 20MB

//加载mongodb模块

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = "mongodb://localhost:27017";

//加载path路径模块
var path = require('path');

//静态托管
app.use(express.static('./public/'));
app.use(express.static('./uploading/'));
//设置路由
//默认路由 显示数据
app.get('/',function(req,res){
	//设置响应体字符编码
	res.set({'Content-type':'text/html;charset=utf-8'});
	//读取数据
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db('article'); //指定数据库
	    dbo.collection("content_table").find({}).sort({isTop:-1}).toArray(function(err, result) { // 返回集合中所有数据
	        if (err) throw err;
	  		res.render('index.html',{data:result});
	  	});
    });	
});
//发布页路由
app.get('/create',function(req,res){
	res.render('create.html');
});
//添加
app.post('/store',function(req,res){
	var response = res;
	form.parse(req, function(err, fields, files) {
		if(err) throw err;
//		console.log(files.thumb.path); //文件路径
		//接收文件上传路径并格式化
		var thumbpath = path.basename(files.thumb.path);
		//接收表单信息
		var data = fields;
		//给数据赋值
		data.thumbpath = thumbpath;
		data.isTop = 0; //isTop 是否置顶 1:置顶 0:不置顶 默认为:0
		//获取发布时间戳
		data.ctime = Date.now();
		//存放到 MongoDB 数据库中
		MongoClient.connect(url,{useNewUrlParser:true},function(err,db){
			if(err) throw err;
			var dbo = db.db('article'); //指定数据库
			var myobj = data;
			dbo.collection('content_table').insertOne(myobj,function(err,res){
				if(err) throw err;
				console.log('数据添加成功');
				//跳转到浏览页
				response.redirect('/');
			});
		});		
	});
});
//置顶
app.get('/top/:id',function(req,res){
	var response = res;
	// 接收id
	var id = req.params.id;
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("article");
	    var whereStr = {"_id":mongodb.ObjectId(id)};  // 查询条件
	    var updateStr = {$set: {"isTop" : 1 }};
	    dbo.collection("content_table").updateOne(whereStr, updateStr, function(err, res) {
	        if (err) throw err;
	        response.redirect('back');
	    });
	});
});

//修改数据
app.get('/:id',function(req,res){
	// 接收id
	var id = req.params.id;
	//读取数据
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db('article'); //指定数据库
	    dbo.collection("content_table").find({"_id":mongodb.ObjectId(id)}).toArray(function(err, result) { // 返回集合中所有数据
	        if (err) throw err;
	  		res.render('amend.html',{data:result});
	  	});
    });	
});

app.post('/renewal/:id',function(req,res){
	var response = res;
	//获取id
	var id = req.params.id;
	console.log(id);
	form.parse(req, function(err, fields, files) {
		if(err) throw err;
		//接收表单信息
		var data = fields;
		//给数据赋值
		data.isTop = 0; //isTop 是否置顶 1:置顶 0:不置顶 默认为:0
		//接收文件上传路径并格式化
		var thumbpath = path.basename(files.thumb.path);
		if(path.extname(files.thumb.path)){
			data.thumbpath = thumbpath;
		}
		//获取修改时间戳
		data.ctime = Date.now();
		//修改数据并存放到 MongoDB 数据库中
		MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
		    if (err) throw err;
		    var dbo = db.db("article");
		    var myobj = data;
		    var whereStr = {"_id":mongodb.ObjectId(id)};  // 查询条件
		    var updateStr = {$set: myobj};
		    dbo.collection("content_table").updateOne(whereStr, updateStr, function(err, res) {
		        if (err) throw err;
		        console.log("文档更新成功");
		        response.redirect('/');
		    });
		});
	});
});

//删除
app.get('/destroy/:id',function(req,res){
	//获取id
	var id = req.params.id;
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("article");
	    var whereStr = {"_id":mongodb.ObjectId(id)};  // 查询条件
	    dbo.collection("content_table").deleteOne(whereStr, function(err, obj) {
	        if (err) throw err;
	        console.log("数据删除成功");
	        res.redirect('/');
	    });
	});
});

//绑定端口号
app.listen(3000,'127.0.0.1',function(){
	console.log('服务器启动成功！地址：127.0.0.1  端口：:3000');
});
