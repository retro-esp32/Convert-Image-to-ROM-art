/*
 * return json data
 */
module.exports = (res, json) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(json));
}
