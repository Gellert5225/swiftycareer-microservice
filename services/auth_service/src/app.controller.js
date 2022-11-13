const authentication 	= require('./app.service');
const jwt				= require('jsonwebtoken');

module.exports = function(app) {
	app.get('/', (req, res) => {
		var upstreamURL = req.headers['x-auth-request-redirect'];
		var splitedUrl = upstreamURL.split('/');   
		var lastPath = splitedUrl[splitedUrl.length - 1];
		console.log(lastPath);
		if (lastPath === 'signin' || lastPath === 'signup' || lastPath === 'signout') {
			res.status(200).send('continue');
		} else {
			let token = req.cookies.user_jwt;
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
							res.status(200).send({ code: response.status, info: response, error: null });
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
		}
	});

	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Headers', 'x-access-token, Origin, Content-Type, Accept');
		next();
	});
}