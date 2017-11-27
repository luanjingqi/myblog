var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Post = mongoose.model('Post'),
    User = mongoose.model('User'),
    Category = mongoose.model('Category')

module.exports = function (app) {
    app.use('/admin/posts', router);
};

router.get('/', function (req, res, next) {
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
                }
            });
        });
    });
});

router.get('/category/:name', function (req, res, next) {
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

router.get('/edit/:id', function (req, res, next) {
});

router.post('/edit/:id', function (req, res, next) {

});

router.get('/delete/:id', function (req, res, next) {
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

router.get('/add', function (req, res, next) {
    res.render('admin/post/add', {
        pretty: true,
    });
});

router.get('/add', function (req, res, next) {
    
}); 