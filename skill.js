// Express
const express = require('express');
const router = express.Router();

// 파일 업로드
const path = require('path');
const multer = require('multer');
const limits = {
    fieldNameSize: 200, // 필드명 사이즈 최대값 (기본값 100bytes)
    filedSize: 1024 * 1024, // 필드 사이즈 값 설정 (기본값 1MB)
    fields: 2, // 파일 형식이 아닌 필드의 최대 개수 (기본 값 무제한)
    fileSize: 4194304, // 4mb
    files: 2, // 파일 두개
}
const upload = multer({
    storage: multer.diskStorage({
        limits: limits,
        destination: function (req, file, cb) {
            if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
                cb(null, __dirname + '/uploads/image');
            } else if (['text/markdown'].includes(file.mimetype)) {
                cb(null, __dirname + '/uploads/markdown');
            } else {
                cb(null, __dirname + '/uploads/etc');
            }
        },
        filename: function (req, file, cb) {
            cb(null, new Date().valueOf() + path.extname(file.originalname));
        }
    })
});

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

// 스킬 그룹
router.get('/skill', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }
    
    const connection = await dbPool.getConnection();

    const sql = 'select * from skill_group order by touch desc;';
    const [skillGroup] = await connection.query(sql);

    connection.release();

    res.render('admin_skillgroup', { skillGroup: skillGroup });
});

// 스킬 그룹 등록
router.post('/skill', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const name = req.body.name;

    const connection = await dbPool.getConnection();
    const sql = 'insert into skill_group (name) values (?);';
    await connection.query(sql, [name]);

    connection.release();

    res.redirect('/admin/skill');

});

// 스킬 그룹 터치
router.get('/skill/:skillGroupId/touch', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const skillGroupId = req.params.skillGroupId;

    const connection = await dbPool.getConnection();
    const sql = 'update skill_group set touch = now() where skillGroupId = ?';
    await connection.query(sql, [skillGroupId]);

    connection.release();

    res.redirect('/admin/skill');
});

// 스킬 그룹 삭제
router.get('/skill/:skillGroupId/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const skillGroupId = req.params.skillGroupId;

    const connection = await dbPool.getConnection();
    const sql = 'delete from skill_group where skillGroupId = ?;';
    await connection.query(sql, [skillGroupId]);

    connection.release();

    res.redirect('/admin/skill');
});

// 스킬
router.get('/skill/:skillGroupId', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const skillGroupId = req.params.skillGroupId;

    const connection = await dbPool.getConnection();
    const sql = 'select * from skill where `group` = ? order by touch desc;';
    const [skills] = await connection.query(sql, [skillGroupId]);

    connection.release();

    res.render('admin_skill', { skillGroupId: skillGroupId, skills: skills });
});

// 스킬 등록
const fileFields = upload.fields([
    { name: 'icon', maxCount: 1 }
]);
router.post('/skill/:skillGroupId', fileFields, async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const skillGroupId = req.params.skillGroupId;

    const skillName = req.body.skillName;
    const { icon } = req.files;
    const iconName = icon[0].filename;

    const connection = await dbPool.getConnection();
    const sql = 'insert into skill (`group`, skillName, icon) values (?, ?, ?);';
    await connection.query(sql, [skillGroupId, skillName, iconName]);

    connection.release();

    res.redirect('/admin/skill/' + skillGroupId);
});

// 스킬 삭제
router.get('/skill/:skillGroupId/:skillId/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const skillGroupId = req.params.skillGroupId;
    const skillId = req.params.skillId;

    const connection = await dbPool.getConnection();
    const sql = 'delete from skill where skillId = ?;';
    await connection.query(sql, [skillId]);

    connection.release();

    res.redirect('/admin/skill/' + skillGroupId);
});


module.exports = router;