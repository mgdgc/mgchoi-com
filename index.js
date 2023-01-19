// Express
const express = require('express');
const router = express.Router();

// Markdown to html
const highlight = require('highlight.js');
const markdownIt = require("markdown-it")({
    html: false,
    xhtmlOut: false,
    breaks: false,
    langPrefix: "language-",
    linkify: true,
    typographer: true,
    quotes: "“”‘’",
    highlight: function (str, lang) {
        if (lang && highlight.getLanguage(lang)) {
            try {
                return (
                    '<pre class="hljs"><code>' +
                    highlight.highlight(lang, str, true).value +
                    "</code></pre>"
                );
            } catch (__) { }
        }
        return (
            '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + "</code></pre>"
        );
    }
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

// 메인 페이지
router.get('/', async function (req, res) {
    const connection = await dbPool.getConnection();

    const prjSql = 'select * from project order by touch desc limit 6;';
    const [project] = await connection.query(prjSql);

    const sgSql = 'select * from skill_group order by touch desc;';
    const [skillGroup] = await connection.query(sgSql);

    const skillSql = 'select * from skill where `group` = ? order by touch desc;';
    var skills = {};
    for (var i = 0; i < skillGroup.length; i++) {
        const sgId = skillGroup[i].skillGroupId;
        skills[sgId] = [];
        const [skill] = await connection.query(skillSql, [sgId]);
        for (var j = 0; j < skill.length; j++) {
            skills[sgId].push(skill[j]);
        }
    }

    const actSql = 'select * from activity order by touch desc;';
    const [activity] = await connection.query(actSql);

    const przSql = 'select * from prize order by touch desc;';
    const [prize] = await connection.query(przSql);

    connection.release();

    res.render('index', { project: project, skillGroup: skillGroup, skill: skills, activity: activity, prize: prize });

});

// 프로젝트 페이지
router.get('/project', async function (req, res) {
    const category = req.query.category;
    const connection = await dbPool.getConnection();

    var sql = 'select * from project';
    var where = [];
    if (category != null) {
        sql += ' where catId = ?';
        where.push(category);
    }
    sql += ' order by touch desc;';
    const [projects] = await connection.query(sql, where);

    const catSql = 'select * from category order by touch desc;';
    const [categories] = await connection.query(catSql);

    connection.release();

    res.render('projects', { category: categories, project: projects });
});

// 프로젝트 정보
router.get('/project/:prjId', async function (req, res) {
    const prjId = req.params.prjId;

    const connection = await dbPool.getConnection();
    const sql = 'select * from project where `id` = ?;'
    const [project] = await connection.query(sql, [prjId]);

    connection.release();

    // Content markdown
    const data = fs.readFileSync(__dirname + '/uploads/markdown/' + project[0].markdown, 'utf-8');
    project[0].content = markdownIt.render(data);
    res.send(project[0]);
});

// 이미지 api
router.get('/image/:imageName', function (req, res) {
    const imageName = req.params.imageName;

    fs.readFile(__dirname + '/uploads/image/' + imageName, function (error, data) {
        if (error) throw error;
        res.write(data);
        res.end();
    });
});

module.exports = router;