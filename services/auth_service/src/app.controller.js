module.exports = function(app) {
  const jsonString = JSON.stringify({ status: 'Not Authorized' });
  app.get('/', (req, res) => {
    console.log(req.headers.authorization);
    res.set({
      'Content-Type': 'Application/json',
      'Content-Length': '123',
      'Auth-Error': jsonString
    })
    res.status(401).send({ status: 'Not Authorized' });
  });
}