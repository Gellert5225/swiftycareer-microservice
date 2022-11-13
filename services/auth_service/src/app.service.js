/**
 * Handles the authentication - User SignUp and SignIn
 */

const db        = require('./server/db');
const Session   = db.database.collection('Session');

const jwt       = require('jsonwebtoken');

require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })

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
                resolve({
                    status: 200,
                    decoded: decoded,
                    token: access_token
                });
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
