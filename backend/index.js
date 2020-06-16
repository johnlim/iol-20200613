const serverless = require('serverless-http');
const jwt = require('jsonwebtoken');
var jwksClient = require('jwks-rsa');

const bodyParser = require('body-parser');
const express = require('express');
var cors = require('cors');
const app = express();

app.use(bodyParser.json({strict: false}));
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors());


app.get('/orders', async function (req, res) {
  res.set({
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    }
  });
  return res.status(200).json({success: "orders processed"});
});

// Policy helper function
const generatePolicy = (principalId, effect, resource) => {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

function auth(event, context, callback) {
    console.log('event', event);
    if (!event.authorizationToken) {
      console.log('Unauthorized');
      return callback('Unauthorized');
    }

    const tokenParts = event.authorizationToken.split(' ');
    const tokenValue = tokenParts[1];
    console.log("------------ authoriztion token = ", tokenValue);
    if (!(tokenParts[0].toLowerCase() === 'bearer' && tokenValue)) {
      // no auth token!
      console.log('Unauthorized');
      return callback('Unauthorized');
    }

    var decoded = jwt.decode(tokenValue);
    console.log("decoded token", decoded.iss);

    const options = {
       // audience: '',
    };

    var client = jwksClient({
      jwksUri: `${decoded.iss}.well-known/jwks.json`
    });

    function getKey(header, callback){
      client.getSigningKey(header.kid, function(err, key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        callback(null, signingKey);
      });
    }

    try {
      jwt.verify(tokenValue, getKey, options, (verifyError, decoded) => {
        if (verifyError || !decoded.permissions.includes('read:secret') || !decoded.scope.split(" ").includes("read:secret")) {
          console.log('verifyError', verifyError);
          // 401 Unauthorized
          console.log(`Token invalid. ${verifyError}`);
          return callback('Unauthorized');
        }
        // is custom authorizer function
        console.log('valid from customAuthorizer', decoded);
        return callback(null, generatePolicy(decoded.sub, 'Allow', event.methodArn));
      });
    } catch (err) {
      console.log('catch error. Invalid token', err);
      return callback('Unauthorized');
    }
};
// app.listen(8080, () => console.log(`Example app listening on port 8080!`)) //uncomment to run local
module.exports.handler = serverless(app);
module.exports.createApp = app;
module.exports.auth = auth;
