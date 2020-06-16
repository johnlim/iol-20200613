// The Auth0 client, initialized in configureClient()
let auth0 = null;

/**
 * Starts the authentication flow
 */
const login = async (targetUrl) => {
  try {
    console.log("Logging in", targetUrl);

    const options = {
      redirect_uri: window.location.origin,
      scope: "openid profile email offline_access",
      audience: "https://my-secret-api"

    };

    if (targetUrl) {
      options.appState = { targetUrl };
    }

    await auth0.loginWithRedirect(options);
  } catch (err) {
    console.log("Log in failed", err);
  }
};

/**
 * Executes the logout flow
 */
const logout = () => {
  try {
    console.log("Logging out");
    auth0.logout({
      returnTo: window.location.origin
    });
  } catch (err) {
    console.log("Log out failed", err);
  }
};

/**
 * Retrieves the auth configuration from the server
 */
const fetchAuthConfig = () => fetch("/auth_config.json");

/**
 * Initializes the Auth0 client
 */
const configureClient = async () => {
  const response = await fetchAuthConfig();
  const config = await response.json();

  auth0 = await createAuth0Client({
    domain: config.domain,
    client_id: config.clientId,
    cacheLocation: 'localstorage',
    useRefreshTokens: true
  });
};

/**
 * Checks to see if the user is authenticated. If so, `fn` is executed. Otherwise, the user
 * is prompted to log in
 * @param {*} fn The function to execute if the user is logged in
 */
const requireAuth = async (fn, targetUrl) => {
  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    return fn();
  }

  return login(targetUrl);
};

// Will run when page finishes loading
window.onload = async () => {
  await configureClient();

  // If unable to parse the history hash, default to the root URL
  if (!showContentFromUrl(window.location.pathname)) {
    showContentFromUrl("/");
    window.history.replaceState({ url: "/" }, {}, "/");
  }

  const bodyElement = document.getElementsByTagName("body")[0];

  // Listen out for clicks on any hyperlink that navigates to a #/ URL
  bodyElement.addEventListener("click", (e) => {
    if (isRouteLink(e.target)) {
      const url = e.target.getAttribute("href");

      if (showContentFromUrl(url)) {
        e.preventDefault();
        window.history.pushState({ url }, {}, url);
      }
    }
  });

  const isAuthenticated = await auth0.isAuthenticated();

  if (isAuthenticated) {
    console.log("> User is authenticated");
    window.history.replaceState({}, document.title, window.location.pathname);
    updateUI();
    return;
  }

  console.log("> User not authenticated");

  const query = window.location.search;
  const shouldParseResult = query.includes("code=") && query.includes("state=");

  if (shouldParseResult) {
    console.log("> Parsing redirect");
    try {
      const result = await auth0.handleRedirectCallback();

      if (result.appState && result.appState.targetUrl) {
        showContentFromUrl(result.appState.targetUrl);
      }

      console.log("Logged in!");
    } catch (err) {
      console.log("Error parsing redirect:", err);
    }

    window.history.replaceState({}, document.title, "/");
  }

  updateUI();
};

const getSecret = async () => {
  // let url = new URL('https://iol-20200613.au.auth0.com/authorize')
  // url.search = new URLSearchParams({
  //       scope: "openid profile email read:secret",
  //       audience: "https://my-secret-api",
  //       response_type: "code",
  //       client_id: "qPkRSZ6Mj1RAItLOpu3mQA77lMyD1stx",
  //       redirect_uri: "http://mywebsite:3000"
  // })
  // var x = await fetch(url)
  // var x = await fetch("https://iol-20200613.au.auth0.com/authorize?client_id=qPkRSZ6Mj1RAItLOpu3mQA77lMyD1stx&scope=openid%20profile%20email%20offline_access&response_type=code&response_mode=web_message&state=UzRMMzdsQkZPTUZFa3hSR041OGFPVElyRVFuOUg3b3hUdGNXSE1UN04zag%3D%3D&nonce=SHF6WDU5R0dQR2pyMzlhallmLi1CbzBhNE5JajI3QUI1TzVBMDM1WG14YQ%3D%3D&redirect_uri=http%3A%2F%2Flocalhost%3A3000&code_challenge=zusHWd_J-rbU8qGlo4hCbiuweW-gqtGxko8coT73B78&code_challenge_method=S256&prompt=none&auth0Client=eyJuYW1lIjoiYXV0aDAtc3BhLWpzIiwidmVyc2lvbiI6IjEuOS4wIn0%3D", {mode: 'cors'})
  // console.log("xxxx response xxxx", x)

  // const response = await fetch("https://z94ye18h18.execute-api.ap-southeast-1.amazonaws.com/dev/orders");
  // console.log("secret response = ", response)
  var user = await auth0.getUser(
      {
        scope: "openid profile email read:secret",
        audience: "https://my-secret-api"
      }
);
  const differentAudienceOptions = {
        scope: "read:secret",
        audience: "https://my-secret-api"
  };

  // const token = await auth0.getTokenSilently(differentAudienceOptions);
  // console.log("token -----------------", token)

  var accessToken = user.access_token;
  console.log("accessToken", accessToken)
  var response = await fetch(`https://z94ye18h18.execute-api.ap-southeast-1.amazonaws.com/dev/orders`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          Authorization: `Bearer ${accessToken}`,

        },
      });
  console.log("response", response)

}

