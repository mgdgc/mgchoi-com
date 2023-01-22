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

// 관리자 페이지
router.get('/', function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }
    res.render('admin');
});

// 로그인 페이지
router.get('/login', function (req, res) {
    res.sendFile(__dirname + '/static/login.html');
});

// 로그인 처리
router.post('/login', function (req, res) {
    const adminId = req.body.adminId;
    const adminPw = req.body.adminPw;

    // 관리자 인증
    if (adminId == adminAccount.adminId && adminPw == adminAccount.adminPw) {
        req.session.admin = {};
        req.session.admin.adminId = adminId;
        req.session.admin.adminPw = adminPw;
        req.session.save(function (error) {
            if (error) throw error;
            res.redirect('/admin');
        });
    } else {
        sendError(res, "관리자 ID 혹은 비밀번호가 다릅니다.", "/admin/login");
    }
});

// 프로젝트 페이지
router.get('/category', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const connection = await dbPool.getConnection();

    const sql = 'select * from category order by touch desc;';
    const [category] = await connection.query(sql);
    const prjSql = 'select * from project order by touch desc;';
    const [projects] = await connection.query(prjSql);

    connection.release();

    res.render('admin_category', { category: category, projects: projects });

});

// 카테고리 추가
router.post('/category', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const category = req.body.category;
    const connection = await dbPool.getConnection();

    const sql = 'insert into category (title) values (?);';
    await connection.query(sql, [category]);

    connection.release();

    res.redirect('/admin/category');
});

// 카테고리 터치
router.get('/category/:catId/touch', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const catId = req.params.catId;
    const connection = await dbPool.getConnection();

    const sql = 'update category set touch = now() where catId = ?;';
    await connection.query(sql, [catId]);

    connection.release();

    res.redirect('/admin/category');
});


// 카테고리 터치
router.get('/category/:catId/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const catId = req.params.catId;
    
    const connection = await dbPool.getConnection();
    const sql = 'delete from category where catId = ?;';
    await connection.query(sql, [catId]);

    connection.release();

    res.redirect('/admin/category');

});

// 프로젝트 목록
router.get('/category/:catId', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const catId = req.params.catId;
    const connection = await dbPool.getConnection();

    const sql = 'select * from project where catId = ?;';
    const [projects] = await connection.query(sql, [catId]);

    connection.release();

    res.render('admin_project', { catId: catId, projects: projects });
});

// 프로젝트 작성
router.get('/category/:catId/write', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const catId = req.params.catId;
    res.render('admin_write', { catId: catId });
});

// 프로젝트 등록
const fileFields = upload.fields([
    { name: 'markdown', maxCount: 1 },
    { name: 'image', maxCount: 1 },
]);
router.post('/category/:catId/write', fileFields, async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const catId = req.params.catId;

    const title = req.body.title;
    const desc = req.body.desc;
    const link = req.body.link;
    const tag = req.body.tag;
    const { markdown, image } = req.files;
    const mdName = markdown[0].filename;
    const imageName = image[0].filename;

    const connection = await dbPool.getConnection();
    const sql = 'insert into project (catId, title, `desc`, markdown, image, link, tag) values (?, ?, ?, ?, ?, ?, ?);';
    await connection.query(sql, [catId, title, desc, mdName, imageName, link, tag]);

    connection.release();

    res.redirect('/admin/category/' + catId);
});

// 프로젝트 수정
router.get('/project/:prjId/edit', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prjId = req.params.prjId;

    const connection = await dbPool.getConnection();
    const sql = 'select * from project where id = ?;';
    const [project] = await connection.query(sql, [prjId]);
    const catSql = 'select * from category;';
    const [category] = await connection.query(catSql);

    connection.release();

    res.render('admin_edit', { projId: prjId, project: project[0], category: category });
});

// 프로젝트 수정
router.post('/project/:prjId/edit', fileFields, async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prjId = req.params.prjId;

    const category = req.body.category;
    const title = req.body.title;
    const desc = req.body.desc;
    const link = req.body.link;
    const tag = req.body.tag;
    const values = [category, title, desc, link, tag];

    const { markdown, image } = req.files;

    var sql = 'update project set catId = ?, title = ?, `desc` = ?, link = ?, tag = ?';
    if (markdown != null) {
        sql += ', markdown = ?';
        values.push(markdown[0].filename);
    }
    if (image != null) {
        sql += ', image = ?';
        values.push(image[0].filename);
    }
    sql += ' where id = ?;';
    values.push(prjId);

    const connection = await dbPool.getConnection();
    await connection.query(sql, values);

    connection.release();

    res.redirect('/admin/category/' + category);
});

// 프로젝트 삭제
router.get('/project/:prjId/touch', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prjId = req.params.prjId;

    const connection = await dbPool.getConnection();
    const sql = 'update project set touch = now() where id = ?;';
    await connection.query(sql, [prjId]);

    connection.release();

    res.redirect('/admin/category');
});

// 프로젝트 터치
router.get('/project/:prjId/delete', async function (req, res) {
    // 로그인 확인
    const admin = req.session.admin;
    if (admin == null) {
        res.redirect('/admin/login');
        return;
    }

    const prjId = req.params.prjId;

    const connection = await dbPool.getConnection();
    const sql = 'delete from project where id = ?;';
    await connection.query(sql, [prjId]);

    connection.release();

    res.redirect('/admin/category');
});

// 에러 페이지로 이동
function sendError(res, message, redirect) {
    res.redirect('/error?message=' + message + '&redirect=' + redirect);
}

module.exports = router;