const { verifyRegistration }    = require('./middleware');
const { verifyToken }           = require('./middleware/authJWT');
const authentication            = require('./app.service');
const jwt    					= require('jsonwebtoken');

module.exports = function(app) {
	app.get('/', (req, res) => {
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
			res.status(401).json(JSON.parse(jsonString));
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
					}, error => {
						res.clearCookie('user_jwt');
						res.clearCookie('user_jwt_refresh', { path: '/refreshJWT' });
						res.clearCookie('user_session_id');
						let jsonString = JSON.stringify({ 
							code: error.status, 
							info: 'error', 
							error: error.message
					 	});
						res.set({
							'Content-Type': 'Application/json',
							'Content-Length': '123',
							'Auth-Error': jsonString
						});
						res.status(error.status).send({ code: error.status, info: 'error', error: error.message });
					});
				} else {
					res.status(200).send({ code: 200, info: decoded.id, error: null });
				}
			});
		}
	});

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
		next();
	});

	app.post('/signup', [verifyRegistration.checkDuplicateUser, verifyRegistration.checkRoleExisted], function(req, res) {
		authentication.signUp({ 
			username: req.body.username, 
			email: req.body.email, 
			password: req.body.password, 
			roles: req.body.roles
		}).then((response) => {
			res.cookie(
				'user_jwt',
				response['access_token'],
				{
					maxAge: 10000000000,
					secure: process.env.NODE_ENV === 'prod',
					httpOnly: true
				}
			);
			res.cookie(
				'user_jwt_refresh',
				response['refresh_token'],
				{
					maxAge: 10000000000,
					path: '/api/auth/refreshJWT',
					secure: process.env.NODE_ENV === 'prod',
					httpOnly: true,
					sameSite: 'lax'
				}
			);
			res.cookie(
				'user_session_id',
				response['session_id'],
				{
					maxAge: 10000000000,
					secure: process.env.NODE_ENV === 'prod',
					httpOnly: true,
					sameSite: 'lax'
				}
			);
			delete response['access_token'];
			delete response['refresh_token'];
			delete response['hashed_password'];
			res.status(200).json({ code: 200, info: response, error: null });
		}, error => {
			if (!error.status) error.status = 500;
			res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
		});
	});

	app.post('/signin', function(req, res) {
		authentication.signIn({
			username: req.body.username, 
			password: req.body.password,
		}).then((response) => {
			res.cookie(
				'user_jwt',
				response['access_token'],
				{
					maxAge: 10000000000,
					secure: process.env.NODE_ENV === 'prod',
					httpOnly: true,
					sameSite: 'lax'
				}
			);
			res.cookie(
				'user_jwt_refresh',
				response['refresh_token'],
				{
					maxAge: 10000000000,
					path: '/api/auth/refreshJWT',
					secure: process.env.NODE_ENV === 'prod',
					httpOnly: true,
					sameSite: 'lax'
				}
			);
			res.cookie(
				'user_session_id',
				response['session_id'],
				{
					maxAge: 10000000000,
					secure: process.env.NODE_ENV === 'prod',
					httpOnly: true,
					sameSite: 'lax'
				}
			);
			delete response['access_token'];
			delete response['refresh_token'];
			delete response['hashed_password'];
			res.status(200).json({ code: 200, info: response, error: null });
		}, error => {
			res.status(error.status ?? 400).json({ code: error.status, info: 'error', error: error.message });
		});
	});

	app.post('/signout', async function(req, res) {
		try {
			const session = await authentication.signOut(req.cookies.user_session_id);
			if (session.deletedCount !== 1) {
				res.status(404).json({ code: 404, info: 'error', error: 'Could not find session id' });
			}
			res.clearCookie('user_jwt');
			res.clearCookie('user_jwt_refresh', { path: '/api/auth/refreshJWT' });
			res.clearCookie('user_session_id');
			res.status(200).json({ code: 200, info: 'Signed Out', error: null });
		} catch (error) {
			if (!error.status) error.status = 500
			res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
		}
	});

	app.get('/refreshJWT', function(req, res) {
		authentication.refreshJWT(req.cookies.user_session_id).then((response) => {
			res.cookie('user_jwt', response, {maxAge: 10000000000, secure: process.env.NODE_ENV === 'prod', httpOnly: true, sameSite: 'lax'});
			const prevURL = req.session.prevURL;
			req.session.prevURL = null;
			res.redirect(prevURL);
		}, error => {
			res.clearCookie('user_jwt');
			res.clearCookie('user_jwt_refresh', { path: '/refreshJWT' });
			res.clearCookie('user_session_id');
			if (req.accepts('html')) return res.redirect('/');
			res.status(error.status).json({ code: error.status, info: 'error', error: error.message });
		});
	});

	app.get('/testCookieJwt', verifyToken, function(req, res) {
		res.status(200).send({ code: 200, info: `Authorized ${req.userId}` });
	});
}