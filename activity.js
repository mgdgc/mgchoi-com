// Express
const express = require('express');
const router = express.Router();

// JSON 파일을 읽기 위한 FS 모듈
const fs = require('fs');

// Mariadb
const mysql = require('mysql2/promise');
const db_auth = JSON.parse(fs.readFileSync(__dirname + '/db_auth.json'));

// DB Initialzation
const dbPool = mysql.createPool({
    host: 'localhost',
    user: db_auth.username,
    password: db_auth.password,
    database: 'mgchoi',
    multipleStatements: true
});

// 관리자 계정
const adminAccount = JSON.parse(fs.readFileSync(__dirname + '/admin_auth.json'));

// 활동 & 수상
router.get('/activity', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const connection = await dbPool.getConnection();

    const activitySql = 'select * from activity order by touch desc;';
    const [activity] = await connection.query(activitySql);
    const prizeSql = 'select * from prize order by touch desc;';
    const [prize] = await connection.query(prizeSql);

    connection.release();

    res.render('admin_activity', { activity: activity, prize: prize });
});

// 활동 추가
router.post('/activity', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const activityName = req.body.activityName;
    const startYear = req.body.startYear;
    const startMonth = req.body.startMonth;
    const endYear = req.body.endYear;
    const endMonth = req.body.endMonth;

    const connection = await dbPool.getConnection();
    const sql = 'insert into activity (activityName, startYear, startMonth, endYear, endMonth) values (?, ?, ?, ?, ?);';
    await connection.query(sql, [activityName, startYear, startMonth, endYear, endMonth]);

    res.redirect('/admin/activity');
});

// 활동 삭제
router.get('/activity/:activityId/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const activityId = req.params.activityId;

    const connection = await dbPool.getConnection();
    const sql = 'delete from activity where activityId = ?;';
    await connection.query(sql, [activityId]);

    res.redirect('/admin/activity');
});

// 활동 터치
router.get('/activity/:activityId/touch', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }
    const activityId = req.params.activityId;

    const connection = await dbPool.getConnection();
    const sql = 'update activity set touch = now() where activityId = ?;';
    await connection.query(sql, [activityId]);

    res.redirect('/admin/activity');
});

// 수상실적 추가
router.post('/prize', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prizeName = req.body.prizeName;
    const icon = req.body.icon;
    const prize = req.body.prize;
    const year = req.body.year;
    const month = req.body.month;

    const connection = await dbPool.getConnection();
    const sql = 'insert into prize (prizeName, icon, prize, `year`, `month`) values (?, ?, ?, ?, ?);';
    await connection.query(sql, [prizeName, icon, prize, year, month]);

    res.redirect('/admin/activity');
});

// 수상실적 추가
router.post('/prize', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prizeName = req.body.prizeName;
    const icon = req.body.icon;
    const prize = req.body.prize;
    const year = req.body.year;
    const month = req.body.month;

    const connection = await dbPool.getConnection();
    const sql = 'insert into prize (prizeName, icon, prize, `year`, `month`) values (?, ?, ?, ?, ?);';
    await connection.query(sql, [prizeName, icon, prize, year, month]);

    res.redirect('/admin/activity');
});

// 수상실적 터치
router.get('/prize/:prizeId/touch', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prizeId = req.params.prizeId;

    const connection = await dbPool.getConnection();
    const sql = 'update prize set touch = now() where prizeId = ?;';
    await connection.query(sql, [prizeId]);

    res.redirect('/admin/activity');
});

// 수상실적 삭제
router.get('/prize/:prizeId/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prizeId = req.params.prizeId;

    const connection = await dbPool.getConnection();
    const sql = 'delete from prize where prizeId = ?;';
    await connection.query(sql, [prizeId]);

    res.redirect('/admin/activity');
});



module.exports = router;