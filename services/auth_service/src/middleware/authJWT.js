/**
 * Middleware
 * Verify JWT token for authorization purposes
 */

const jwt               = require('jsonwebtoken');
const db                = require('../server/db');
const authentication    = require('../app.service');
const User              = db.user;
const Role              = db.role;

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

verifyToken = (req, res, next) => {
    let token = req.cookies.user_jwt;
    console.log(token);
    if (!token) {
        let jsonString = JSON.stringify({ 
            code: 401, 
            info: 'No Token Provided', 
            error: 'Please login to access the content you requested.' 
        });
        res.set({
            'Content-Type': 'Application/json',
            'Content-Length': '123',
            'Auth-Error': jsonString
        });
        next();
    } else {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                authentication.refreshJWT(req.cookies.user_session_id).then((response) => {
                    res.cookie('user_jwt', 
                        response, 
                        {
                            maxAge: 10000000000, 
                            secure: process.env.NODE_ENV === 'prod', 
                            httpOnly: true, 
                            sameSite: 'lax'
                        }
                    );
                    const prevURL = req.session.prevURL;
                    req.session.prevURL = null;
                    res.redirect(prevURL);
                }, error => {
                    res.clearCookie('user_jwt');
                    res.clearCookie('user_jwt_refresh', { path: '/refreshJWT' });
                    res.clearCookie('user_session_id');
                    res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
                });
            }
            req.userId = decoded.id;
            next();
        });
    }
}

isAdmin = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
    
        Role.find({ _id: { $in: user.roles } }, (err, roles) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
            
            roles.forEach(role => {
                if (role.name === 'admin') {
                    next();
                    return;
                }
            });
    
            res.status(403).send({ message: "Require Admin Role!" });
            return;
            }
        );
    });
}

isModerator = (req, res, next) => {
    User.findById(req.userId).exec((err, user) => {
        if (err) {
            res.status(500).send({ message: err });
            return;
        }
    
        Role.find({ _id: { $in: user.roles } }, (err, roles) => {
            if (err) {
                res.status(500).send({ message: err });
                return;
            }
    
            roles.forEach(role => {
                if (role.name === 'moderator') {
                    next();
                    return;
                }
            });
    
            res.status(403).send({ message: "Require Moderator Role!" });
            return;
            }
        );
    });
};

const authJwt = {
    verifyToken,
    isAdmin,
    isModerator
};

module.exports = authJwt;