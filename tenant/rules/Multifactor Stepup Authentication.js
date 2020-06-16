function (user, context, callback) {

  // This rule initiates multi-factor authenticaiton as a second factor
  // whenever the request contains the following value:
  // 
  // acr_values = 'http://schemas.openid.net/pape/policies/2007/06/multi-factor'
  // 
  // and multi-factor authentication has not already been completed in the
  // current session/
  
  if (context.request.query.scope.split(" ").includes("read:secret")) {
  	context.multifactor = {
        provider: 'any',
        allowRememberBrowser: false,
      };
    }

  callback(null, user, context);
}