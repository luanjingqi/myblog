var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Post = mongoose.model('Post'),
    User = mongoose.model('User'),
    Category = mongoose.model('Category'),
    slug = require('slug'),
    pinyin = require('pinyin'),
    auth = require('./user')

module.exports = function (app) {
    app.use('/admin/posts', router);
};

router.get('/', auth.requireLogin, function (req, res, next) {
    var sortby = req.query.sortby ? req.query.sortby : 'created';
    var sortdir = req.query.sortdir ? req.query.sortdir : 'desc';

    if (['title', 'category', 'author', 'created', 'published'].indexOf(sortby) === -1) {
        sortby = 'created';
    }
    if (['desc', 'asc'].indexOf(sortdir) === -1) {
        sortdir = 'desc';
    }

    var sortObj = {};
    sortObj[sortby] = sortdir;

    var conditions = {};
    if (req.query.category) {
        conditions.category = req.query.category.trim();
    }
    if (req.query.author) {
        conditions.author = req.query.author.trim();
    }
    if (req.query.keyword) {
        conditions.title = new RegExp(req.query.keyword.trim(), 'i');
        conditions.content = new RegExp(req.query.keyword.trim(), 'i');
    }

    User.find({}, function (err, authors) {
        if (err) return next(err);

        Post.find(conditions)
        .sort(sortObj)
        .populate('author')
        .populate('category')
        .exec(function (err, posts) {       
            if (err) return next(err);

            var pageNum = Math.abs(parseInt(req.query.page || 1,10));
            var pageSize = 10;
            var totalCount = posts.length;
            var pageCount = Math.ceil(totalCount / pageSize);

            if (pageNum > pageCount){
                pageNum = pageCount;
            }
            res.render('admin/post/index', {
                posts:posts.slice((pageNum - 1) * pageSize, pageNum * pageSize),
                pageNum:pageNum,
                pageCount:pageCount,
                authors: authors,
                sortdir: sortdir,
                sortby: sortby,
                pretty: true,
                filter: {
                    category: req.query.category || "",
                    author: req.query.author || "",
                    keyword: req.query.keyword || "",
                }
            });
        });
    });
});

router.get('/category/:name', auth.requireLogin, function (req, res, next) {
    Category.findOne({ name: req.params.name}).exec(function(err, category) {
        if(err) {
            return next(err);
        }

        Post.find({ category: category, published: true})
            .sort('created')
            .populate('category')
            .populate('author')
            .exec(function(err, posts) {
                if(err) {
                    return next(err);
                }
                res.render('blog/category', {
                    posts: posts,
                    category: category,
                    pretty: true
                });
            });
    });
});

router.get('/edit/:id', auth.requireLogin, getPostById, function (req, res, next) {
    res.render('admin/post/add', {
        action: "/admin/posts/edit/" + req.post._id,
        post: req.post,
    });
});

router.post('/edit/:id', auth.requireLogin, getPostById, function (req, res, next) {
    var post = req.post;
    var title = req.body.title.trim();
    var category = req.body.category.trim();
    var content = req.body.content.trim();

    var py = pinyin(title).map(function (item) {
        return item[0]
    }).join(' ');

    post.title = title;
    post.category = category;
    post.content = content;
    post.slug = slug(py);

    post.save(function(err, post) {
        if (err) {
            req.flash('error', '文章编辑失败');
            res.redirect('/admin/posts/edit/' + post._id);
        } else {
            req.flash('info', '文章编辑成功');
            res.redirect('/admin/posts');
        }
        
    });
});

router.get('/delete/:id', auth.requireLogin, function (req, res, next) {
    if(!req.params.id) {
        return next(new Error('no post id provided'))
    }
    Post.remove({ _id: req.params.id }).exec(function (err, rowsRemoved) {
        if(err) {
            return next(err)
        }

        if (rowsRemoved) {
            req.flash('success', '文章删除成功')
        } else {
            req.flash('success', '文章删除失败')
        }

        res.redirect('/admin/posts')
    });
});

router.get('/add', auth.requireLogin, function (req, res, next) {
    res.render('admin/post/add', {
        action: "/admin/posts/add",
        pretty: true,
        post: {
            category: { _id: ''}
        },
    });
});

router.post('/add', auth.requireLogin, function (req, res, next) {
    req.checkBody('title', '文章标题不能为空').notEmpty();
    req.checkBody('category', '请选择分类').notEmpty();
    req.checkBody('content', '内容不能为空').notEmpty();

    var errors = req.validationErrors();
    if (errors) {
        return res.render('admin/post/add', {
            errors: errors,
            category: req.body.category,
            title: req.body.title,
            content: req.body.content,
        })
    }

    var title = req.body.title.trim();
    var category = req.body.category.trim();
    var content = req.body.content.trim();

    User.findOne({}, function(err, author) {
        if (err) {
            return next(err)
        }
        var py = pinyin(title).map(function (item) {
            return item[0]
        }).join(' ');

        var post = new Post({
            title: title,
            published: true,
            category: category,
            content: content,
            author: author,
            meta: { favorite: 0 },
            comments: [],
            created: new Date(),
            slug: slug(py),
        });

        post.save(function(err, post) {
            if (err) {
                req.flash('error', '文章保存失败');
                res.redirect('/admin/posts/add');
            } else {
                req.flash('info', '文章保存成功');
                res.redirect('/admin/posts');
            }
            
        });
    });
}); 

function getPostById(req, res, next) {
    if(!req.params.id) {
        return next(new Error('no post id provide'));
    }
    
    Post.findOne({ _id: req.params.id })
    .populate('category')
    .populate('author')
    .exec(function(err, post) {
        if(err) {
            return next(err);
        }
        if(!post) {
            return next(new Error('post not found', req.params.id));
        }
        req.post = post;
        next();
    });
}