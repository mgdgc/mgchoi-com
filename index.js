// Express
const express = require('express');
const router = express.Router();

// JSON 파일을 읽기 위한 FS 모듈
const fs = require('fs');

// Mariadb
const mysql = require('mysql2/promise');
const db_auth = JSON.parse(fs.readFileSync(__dirname + '/db_auth.json'));

// DB Initialzation
const db = mysql.createPool({
    host: 'localhost',
    user: db_auth.username,
    password: db_auth.password,
    database: 'mgchoi',
    multipleStatements: true
});

// 메인 페이지
router.get('/', function (req, res) {
    res.send("Hello, mgdgc!");
});

// 프로젝트 페이지
router.get('/project', function (req, res) {

});

module.exports = router;