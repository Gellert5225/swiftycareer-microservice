/**
 * Handles the authentication - User SignUp and SignIn
 */

const db        = require('./server/db');
const User      = db.database.collection('User');
const Role      = db.database.collection('Role');
const Session   = db.database.collection('Session');

const jwt    = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SCError = require('./utils/error');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

exports.signUp = async (user) => {
    user.hashed_password = await bcrypt.hash(user.password, 8);
    delete user.password;

    if (user.roles) {
        let roles_query_results = await Role.find({"name" : {"$in" : user.roles}}).toArray();
        user.roles = roles_query_results;
    } else {
        let user_role = await Role.findOne({ name: 'user' });
        user.roles = [user_role];
    }

    user.created_at = Date.now();
    user.display_name = user.username;
    user.bio = '';
    user.position = '';
    user.profile_picture = '9153598f6891968d494b1e7f30c35142.png';

    let result_user = (await User.insertOne(user)).ops[0];
    const token = jwt.sign({ id: result_user._id }, process.env.JWT_SECRET, { expiresIn: 60 });
    const refresh_token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: parseInt(process.env.JWT_REFRESH_EXP) }
    );
    const session = { refresh_token: refresh_token, user: user._id, expires_at: new Date().toString() };
    const session_result = (await Session.insertOne(session)).ops[0];

    result_user['access_token'] = token;
    result_user['refresh_token'] = refresh_token;
    result_user['session_id'] = session_result._id;
    result_user['profile_picture'] = "9153598f6891968d494b1e7f30c35142.png";

    return result_user;
}

exports.signIn = async ({ username, password }) => {
    let user = await User.findOne({ username: username });
    if (!user) { throw new SCError(404, 'Username does not exist'); }

    let bcrypt_res = await bcrypt.compare(password, user.hashed_password);
    if (!bcrypt_res) { throw new SCError(401, 'Invalid Password'); }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: 60 });
    const refresh_token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: parseInt(process.env.JWT_REFRESH_EXP) }
    );
    const session = {
        refresh_token: refresh_token,
        user: user._id,
        created_at: new Date(Date.now()).toUTCString(),
        expires_at: new Date(Date.now() + process.env.JWT_REFRESH_EXP * 1000).toUTCString()
    };
    const session_result = (await Session.insertOne(session)).ops[0];

    user['access_token'] = token;
    user['refresh_token'] = refresh_token;
    user['session_id'] = session_result._id;

    return user;
}

exports.signOut = async (session_id) => {
    return await Session.deleteOne({ _id: db.mongodb.ObjectID(session_id) });
}

exports.refreshJWT = async (session_id) => {
    return new Promise((resolve, reject) => {
        (async () => {
            try {
                const session = await Session.findOne({ _id: db.mongodb.ObjectID(session_id) });
                if (!session) 
                    reject({ status: 403, message: 'Invalid Session' });
                // verify refresh token
                const decoded = jwt.verify(session.refresh_token, process.env.JWT_SECRET);
                const access_token = jwt.sign({ id: decoded.id }, process.env.JWT_SECRET, { expiresIn: 60 });
                resolve(access_token);
            } catch (error) {
                try {
                    await this.signOut(session_id);
                } catch (error) {
                    reject({ status: 500, message: error.message });
                }
                reject({
                    status: 403,
                    message: error.message === 'jwt expired' ? 'Session expired. Please sign in again.' : error.message
                });
            }
        })()
    });
}
