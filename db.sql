create database
    mgchoi default character set utf8mb4 collate utf8mb4_unicode_ci;

create table
    mgchoi.category (
        catId integer unsigned not null primary key auto_increment,
        title varchar(10) not null,
        touch datetime not null default now()
    );

create table
    mgchoi.project (
        `id` integer unsigned not null primary key auto_increment,
        catId integer unsigned not null,
        title varchar(50) not null,
        `desc` varchar(50) not null,
        markdown varchar(20) not null,
        `image` varchar(20) not null,
        `link` varchar(50) not null,
        tag varchar(50) not null,
        touch datetime not null default now(),
        `hidden` boolean not null default false,
        foreign key (catId) references mgchoi.category (catId)
    );

create table
    mgchoi.skill_group (
        skillGroupId integer unsigned not null primary key auto_increment,
        `name` varchar(20) not null,
        touch datetime not null default now()
    );

create table
    mgchoi.skill (
        skillId integer unsigned not null primary key auto_increment,
        `group` integer unsigned not null,
        skillName varchar(20) not null,
        icon varchar(20) unsigned not null,
        touch datetime not null default now(),
        foreign key (`group`) references mgchoi.skill_group (skillGroupId)
    );

create table
    mgchoi.activity (
        activityId integer unsigned not null primary key auto_increment,
        activityName varchar(20) not null,
        startYear integer not null,
        startMonth integer not null,
        endYear integer default null,
        endMonth integer default null,
        touch datetime not null default now()
    );

create table
    mgchoi.prize (
        prizeId integer unsigned not null primary key auto_increment,
        prizeName varchar(20) not null,
        `year` integer not null,
        `month` integer not null,
        prize varchar(20),
        touch datetime not null default now()
    );