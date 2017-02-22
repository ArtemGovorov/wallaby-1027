const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const handleError = require('koa-handle-error');
const favicon = require('koa-favicon');
const etag = require('koa-etag');
const conditionalGet = require('koa-conditional-get');
const timings = require('koa-server-timing');

const logger = require('koa-logger');
const session = require('koa-session2');
const RedisStore = require('./lib/redisStore');
const ms = require('ms');

const winston = require('./lib/winston');

const setupRoutes = require('./routes');
const { setup: setupSecurity } = require('./lib/setup-security');

const assetsServer = require('./routes/assetsServer');

// Setup reminders
require('./lib/reminders');

const app = module.exports = new Koa();

const { GCLOUD_PROJECT, NODE_ENV = 'development', SERVER_CANNONICAL_URL = 'https://transfers.do' } = process.env;

// enable trust proxy to get correct protocol information from Heroku or SSL endpoint
app.proxy = (NODE_ENV === 'production');

app.use(timings());

// Log in dev format
app.use(logger());

// Fast rejecting security breach scanners
app.use((ctx, next) => /(\/wp-|\.(php|asp|jsp)$)/i.test(ctx.path) ? null : next());

if (GCLOUD_PROJECT) {
  winston.info('Running on Google Cloud');
  // Google Health Check
  app.use((ctx, next) => {
    if (ctx.path === '/_ah/health') {
      ctx.status = 200;
      ctx.body = null;
    } else return next();
  });
}

// Upgrade insecure requests
app.use((ctx, next) => {
  if (ctx.secure || /sitemap|robots|favicon/.test(ctx.path)) return next();
  ctx.status = 301;
  ctx.redirect(`${SERVER_CANNONICAL_URL}${ctx.originalUrl}`);
});

// error handlers
// https://github.com/koajs/koa/wiki/Error-Handling
app.use(handleError(winston.error));

// Etag and conditional gets handling
app.use(conditionalGet());
app.use(etag());

// Serving assets before settings security, to avoid all those headers
app.use(assetsServer());
app.use(favicon('public/favicon.ico'));

// catch 404 and forward it homepage if it's not image/etc
app.use(async (ctx, next) => {
  await next();
  if (ctx.method === 'GET' && ctx.status === 404 && !/\.(css|jpg|png|js|gif)$/i.test(ctx.path)) ctx.redirect('/');
});

// Configure security settings
app.use(setupSecurity());

// compression
// Google App Engine handles compression on it's own
if (!GCLOUD_PROJECT) app.use(require('koa-compress')());


// Sessions
app.use(session({
  key: 'transfers:sess',
  store: new RedisStore(),
  maxAge: ms('3 days'),
}));

app.use(bodyParser());

app.use(setupRoutes());


// Google Analytics
/*
 if (app.get('env') === 'production') {
 app.use(ua.middleware(frontEndConfig.google.analytics, {
 cookieName: '_ga',
 https: true,
 }));
 }
 */