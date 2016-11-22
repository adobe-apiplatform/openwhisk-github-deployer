import http from 'http';
import express from 'express';
import bodyParser from 'body-parser';
import api from './api';

var app = express();
app.server = http.createServer(app);

app.use(bodyParser.json({
    limit: '100kb'
}));

// api router
app.use('/api', api());

app.server.listen(process.env.PORT || 18080);

console.log(`Test server started on port ${app.server.address().port}`);

export default app;