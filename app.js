// Express
const http = require('http');
const express = require('express');

// JSON 파일을 읽기 위한 FS 모듈
const fs = require('fs');

// Session
const session = require('express-session');
const MemoryStore = require('memorystore')(session);

// Express 서버 생성
const app = express();
const server = http.createServer(app);

// HTML, Views, EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/static'));
// post body-parser 사용
app.use(express.urlencoded({ extended: true }));
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.disable('x-powered-by');

// session 사용 및 환경설정
const maxAge = 1000 * 60 * 30;
app.use(session({
    secret: 'BRG7t7^68GJ@',
    resave: false,
    saveUninitialized: true,
    store: new MemoryStore({ checkPeriod: maxAge }),
    cookie: {
        maxAge,
    },
}));

// hostname 및 port 설정
const server_config = JSON.parse(fs.readFileSync(__dirname + '/server_config.json'));
const hostname = server_config.hostname;
const port = server_config.port;

// 서버 생성
server.listen(port, hostname, function () {
    console.log('Server is listening on port ' + port);
});

// Router 연결
const router = express.Router();
const indexRouter = require('./index');
const adminRouter = require('./admin');
const skillRouter = require('./skill');
const activityRouter = require('./activity');

// 인덱스 및 포트폴리오 페이지
app.use('/', indexRouter);
// 관리자 페이지
app.use('/admin', adminRouter);
// 관리자 페이지 / 스킬
app.use('/admin', skillRouter);
// 관리자 페이지 / 활동 & 수상이력
app.use('/admin', activityRouter);

// 에러 페이지
app.get('/error', function (req, res) {
    const message = req.query.message;
    const redirect = req.query.redirect;
    res.render('alert', { message: message, redirect: redirect });
});

app.use(function (err, req, res, next) {
    if (err) {
      return res.sendStatus(500);
    }
    next();
});

app.use(function (req, res) {
    res.status(404).redirect('/error?message=페이지를 찾을 수 없습니다.&redirect=/');
    res.status(500).redirect('/error?message=페이지를 찾을 수 없습니다.&redirect=/');
});