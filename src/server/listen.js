var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var moocModel = require('./mooc');
var mooc = new moocModel();
var md5 = require("md5");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.get('/', function (req, res) {
    ret = '<h2>欢迎使用超星慕课刷课插件</h2><p>这个服务器将会记录你正确的答题答案,并不会记录你的任何账号信息</p>';
    ret += '<p>并且接口没有任何权限,全由插件提交上传,还请大家不要故意上传错误的答案 (๑• . •๑) </p><br/>';
    ret += '<a href="https://github.com/CodFrm/cxmooc-tools">插件地址</a>';
    res.send(ret);
})

app.post('/answer', function (req, res) {
    var ip = getClientIp(req);
    var ret = [];
    console.log(req.body);
    for (let i in req.body) {
        let topic = req.body[i];
        let type = parseInt(topic.type);
        let cond = {
            topic: topic.topic,
            type: type
        };
        mooc.count('answer', cond, function (err, result) {
            if (result >= 0 && result < 10) {
                let data = topic;
                data.hash = md5(topic.topic + type.toString());
                cond.hash = data.hash;
                data.ip = ip;
                data.time = Date.parse(new Date());
                console.log(data);
                mooc.insert('answer', data);
            }
            ret.push(cond);
            if (ret.length == req.body.length) {
                res.send({
                    code: 0,
                    msg: 'success',
                    result: ret
                });
            }
        });
    }

})
app.all('/answer', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    if (req.method == "OPTIONS") {
        res.send(200);
    } else {
        next();
    }
})
app.get('/update', function (req, res) {
    res.send({
        version: 1.3,
        url: 'http://blog.icodef.com/2018/01/25/1304',
        enforce: false
    });
})

function getClientIp(req) {
    return req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;
}

app.get('/answer', function (req, res) {
    var topic = req.query.topic || [];
    var type = req.query.type || [];
    var ret = [];
    for (let i = 0; i < topic.length; i++) {
        mooc.find('answer', {
            hash: topic[i]
        }, {
            fields: {
                _id: 0,
                topic: 1,
                type: 1,
                hash: 1,
                time: 1,
                correct: 1
            }
        }).limit(10).toArray(function (err, result) {
            var pushData = {
                topic: topic[i],
            };
            if (result) {
                pushData.result = result;
            }
            ret.push(pushData);
            if (ret.length == topic.length) {
                res.send(ret);
            }
        });
    }
})

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Server started successfully\nHome URL:http://%s:%s", host, port)
})